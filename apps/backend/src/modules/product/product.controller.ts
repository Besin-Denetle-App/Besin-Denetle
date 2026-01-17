import {
  ConfirmResponse,
  GenerateAnalysisResponse,
  RejectAnalysisResponse,
  RejectContentResponse,
  RejectProductResponse,
  ScanResponse,
  VoteTarget,
  VoteType,
} from '@besin-denetle/shared';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_CONFIRM, THROTTLE_FLAG, THROTTLE_REJECT } from '../../config';
import { AiService } from '../ai/ai.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VoteService } from '../vote/vote.service';
import { AnalysisService } from './analysis.service';
import { BarcodeService } from './barcode.service';
import { ContentService } from './content.service';
import {
  ConfirmRequestDto,
  FlagBarcodeRequestDto,
  GenerateAnalysisRequestDto,
  RejectAnalysisRequestDto,
  RejectContentRequestDto,
  RejectProductRequestDto,
  ScanRequestDto,
} from './dto';
import { ProductService } from './product.service';

/**
 * Ürün işlemlerini yöneten ana kontrolcü.
 * Barkod tarama, ürün onaylama ve reddetme gibi temel akışlar buradan yönetilir.
 */
@ApiTags('products')
@Controller()
export class ProductController {
  constructor(
    private readonly barcodeService: BarcodeService,
    private readonly productService: ProductService,
    private readonly contentService: ContentService,
    private readonly analysisService: AnalysisService,
    private readonly voteService: VoteService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Barkod tarama servisi. { POST /api/products/scan }
   * Gelen barkodu önce veritabanında arar, yoksa AI servisine sorar.
   */
  /**
   * Rate Limit: 20/dk (normal akış)
   */
  @Post('products/scan')
  @HttpCode(HttpStatus.OK)
  @Throttle(THROTTLE_CONFIRM)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barkod tara' })
  @ApiResponse({ status: 200, description: 'Ürün bulundu veya oluşturuldu' })
  async scan(
    @Body() dto: ScanRequestDto,
    @CurrentUser('id') userId: string,
  ): Promise<ScanResponse> {
    const { barcode } = dto;

    if (!barcode || barcode.trim() === '') {
      throw new BadRequestException('Barkod numarası gerekli');
    }

    // Veritabanında barkod var mı kontrol et
    let barcodeEntity = await this.barcodeService.findByCode(barcode);

    if (barcodeEntity) {
      // Barkod mevcut, puanı en yüksek varyantı getiriyoruz.
      const bestProduct = await this.productService.findBestByBarcodeId(
        barcodeEntity.id,
      );

      if (bestProduct) {
        return {
          product: bestProduct,
          isNew: false,
          barcodeType: barcodeEntity.type,
        };
      }
    }

    // Veritabanında bulunamadı, AI devreye giriyor (Gemini Search Grounding)
    const aiResult = await this.aiService.identifyProduct(
      barcode,
      userId,
      true, // enforceLimit: her zaman rate limit uygula
    );

    if (!aiResult.isFood || !aiResult.product) {
      throw new NotFoundException(
        'Bu barkodlu ürün bulunamadı veya gıda ürünü değil',
      );
    }

    // Barkod yoksa oluştur
    if (!barcodeEntity) {
      const productType = this.aiService.getProductType(aiResult.isFood);
      barcodeEntity = await this.barcodeService.create(
        barcode,
        productType,
        false,
      );
    }

    // Ürün varyantı oluştur
    const newProduct = await this.productService.create({
      barcode_id: barcodeEntity.id,
      brand: aiResult.product.brand,
      name: aiResult.product.name,
      quantity: aiResult.product.quantity,
      is_manual: false,
    });

    return {
      product: newProduct,
      isNew: true,
      barcodeType: barcodeEntity.type,
    };
  }

  /**
   * Kullanıcı ürünü doğruladığında çağrılır. { POST /api/products/confirm }
   * Bu aşamada ürünün detaylı içerik ve analiz verilerini hazırlayıp dönüyoruz.
   */
  /**
   * Rate Limit: 20/dk (normal akış)
   */
  @Post('products/confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle(THROTTLE_CONFIRM)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ürün onayla, içerik getir' })
  @ApiResponse({ status: 200, description: 'İçerik döner' })
  async confirm(
    @CurrentUser('id') userId: string,
    @Body() dto: ConfirmRequestDto,
  ): Promise<ConfirmResponse> {
    const { productId } = dto;

    // Ürünü bul
    const product = await this.productService.findById(productId);
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    // Otomatik UPVOTE - ürün onaylandı (arka planda)
    void this.voteService.vote(
      userId,
      VoteTarget.PRODUCT,
      productId,
      VoteType.UP,
    );

    // Ürüne bağlı en iyi skorlu içerik varyantını bul
    let content = await this.contentService.findBestByProductId(productId);
    let isContentNew = false;

    if (!content) {
      // İçerik yok - AI ile oluştur
      const aiContent = await this.aiService.getProductContent(
        product.brand,
        product.name,
        product.quantity,
      );

      content = await this.contentService.create({
        product_id: productId,
        ingredients: aiContent.ingredients,
        allergens: aiContent.allergens,
        nutrition_table: aiContent.nutrition
          ? { ...aiContent.nutrition, _source: aiContent.model }
          : null,
        is_manual: false,
      });
      isContentNew = true;
    }

    // İçerik için UPVOTE (arka planda)
    void this.voteService.vote(
      userId,
      VoteTarget.CONTENT,
      content.id,
      VoteType.UP,
    );

    return {
      content,
      isContentNew,
    };
  }

  /**
   * Kullanıcı ürünü "Bu değil" diyerek reddettiğinde çalışır. { POST /api/products/reject }
   * Sistem alternatif varyant varsa onu sunar, yoksa AI'dan yeni bir tahmin ister.
   */
  /**
   * Rate Limit: 6/dk (reject akışı - AI maliyeti yüksek)
   */
  @Post('products/reject')
  @HttpCode(HttpStatus.OK)
  @Throttle(THROTTLE_REJECT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ürün reddet, sonraki varyant getir' })
  @ApiResponse({
    status: 200,
    description: 'Sonraki varyant veya yeni AI ürünü',
  })
  async rejectProduct(
    @CurrentUser('id') userId: string,
    @Body() dto: RejectProductRequestDto,
  ): Promise<RejectProductResponse> {
    const { productId, excludeIds = [] } = dto;

    // Ürünü bul
    const product = await this.productService.findById(productId);
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    // Otomatik DOWNVOTE - kullanıcı ürünü reddetti (arka planda)
    void this.voteService.vote(
      userId,
      VoteTarget.PRODUCT,
      productId,
      VoteType.DOWN,
    );

    // Tüm hariç tutulacak ID'leri birleştir (şu anki + önceki redler)
    const allExcludeIds = [...new Set([productId, ...excludeIds])];

    // Sonraki en yüksek skorlu varyantı bul (bu ürün hariç)
    const nextProduct = await this.productService.findBestExcluding(
      product.barcode_id,
      allExcludeIds,
    );

    if (nextProduct) {
      return {
        nextProduct,
        isNew: false,
        noMoreVariants: false,
      };
    }

    // Alternatif varyant yok - AI ile yeni ürün oluştur
    const barcode = await this.barcodeService.findById(product.barcode_id);
    if (!barcode) {
      throw new NotFoundException('Barkod bulunamadı');
    }

    const aiResult = await this.aiService.identifyProduct(
      barcode.code,
      userId,
      true, // enforceLimit: her zaman rate limit uygula
    );

    if (!aiResult.isFood || !aiResult.product) {
      return {
        nextProduct: null,
        isNew: false,
        noMoreVariants: true,
      };
    }

    // Varyant limitini kontrol et (max 3)
    await this.productService.enforceVariantLimit(product.barcode_id);

    // Yeni ürün varyantı oluştur
    const newProduct = await this.productService.create({
      barcode_id: product.barcode_id,
      brand: aiResult.product.brand,
      name: aiResult.product.name,
      quantity: aiResult.product.quantity,
      is_manual: false,
    });

    return {
      nextProduct: newProduct,
      isNew: true,
      noMoreVariants: false,
    };
  }

  /**
   * İçerik reddedildiğinde "Domino Etkisi" başlar. { POST /api/content/reject }
   * İçerik değişince, ona bağlı analiz de geçersiz olur ve yenilenmesi gerekir.
   */
  /**
   * Rate Limit: 6/dk (reject akışı - AI maliyeti yüksek)
   */
  @Post('content/reject')
  @HttpCode(HttpStatus.OK)
  @Throttle(THROTTLE_REJECT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'İçerik reddet, sonraki içerik getir' })
  @ApiResponse({ status: 200, description: 'Yeni içerik' })
  async rejectContent(
    @CurrentUser('id') userId: string,
    @Body() dto: RejectContentRequestDto,
  ): Promise<RejectContentResponse> {
    const { contentId, excludeIds = [] } = dto;

    // İçeriği bul
    const content = await this.contentService.findById(contentId);
    if (!content) {
      throw new NotFoundException('İçerik bulunamadı');
    }

    // DOWNVOTE - içerik reddedildi (arka planda)
    void this.voteService.vote(
      userId,
      VoteTarget.CONTENT,
      contentId,
      VoteType.DOWN,
    );

    // Tüm hariç tutulacak ID'leri birleştir (şu anki + önceki redler)
    const allExcludeIds = [...new Set([contentId, ...excludeIds])];

    // Sonraki en yüksek skorlu içeriği bul
    let nextContent = await this.contentService.findBestExcluding(
      content.product_id,
      allExcludeIds,
    );
    let isContentNew = false;

    if (!nextContent) {
      // Alternatif yok - AI ile yeni içerik oluştur
      const product = await this.productService.findById(content.product_id);
      if (!product) {
        throw new NotFoundException('Ürün bulunamadı');
      }

      // Varyant limitini kontrol et
      await this.contentService.enforceVariantLimit(content.product_id);

      const aiContent = await this.aiService.getProductContent(
        product.brand,
        product.name,
        product.quantity,
      );

      nextContent = await this.contentService.create({
        product_id: content.product_id,
        ingredients: aiContent.ingredients,
        allergens: aiContent.allergens,
        nutrition_table: aiContent.nutrition
          ? { ...aiContent.nutrition, _source: aiContent.model }
          : null,
        is_manual: false,
      });
      isContentNew = true;
    }

    // Yeni içerik için UPVOTE (arka planda)
    void this.voteService.vote(
      userId,
      VoteTarget.CONTENT,
      nextContent.id,
      VoteType.UP,
    );

    return {
      nextContent,
      isContentNew,
      noMoreVariants: false,
    };
  }

  /**
   * POST /api/analysis/generate
   * İçerik için analiz üret veya mevcut en iyisini getir
   */
  @Post('analysis/generate')
  @HttpCode(HttpStatus.OK)
  @Throttle(THROTTLE_CONFIRM)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'İçerik için analiz üret' })
  @ApiResponse({ status: 200, description: 'Analiz döner' })
  async generateAnalysis(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateAnalysisRequestDto,
  ): Promise<GenerateAnalysisResponse> {
    const contentId = dto.contentId;

    // İçeriği bul
    const content = await this.contentService.findById(contentId);
    if (!content) {
      throw new NotFoundException('İçerik bulunamadı');
    }

    // En iyi analizi bul
    let analysis = await this.analysisService.findBestByContentId(contentId);
    let isNew = false;

    if (!analysis) {
      // Analiz yok - AI ile oluştur
      const product = await this.productService.findById(content.product_id);

      const aiAnalysis = await this.aiService.analyzeContent(
        product?.brand ?? null,
        product?.name ?? null,
        content.ingredients,
        content.allergens,
        content.nutrition_table,
      );

      const newAnalysis = await this.analysisService.create({
        product_content_id: contentId,
        analysis_text: aiAnalysis,
        is_manual: false,
      });
      analysis = newAnalysis;
      isNew = true;
    }

    // Analiz için UPVOTE (arka planda)
    void this.voteService.vote(
      userId,
      VoteTarget.ANALYSIS,
      analysis.id,
      VoteType.UP,
    );

    return {
      analysis,
      isNew,
    };
  }

  /**
   * POST /api/analysis/reject
   * Analiz reddi - sonraki varyant getir
   * Rate Limit: 6/dk (reject akışı - AI maliyeti yüksek)
   */
  @Post('analysis/reject')
  @HttpCode(HttpStatus.OK)
  @Throttle(THROTTLE_REJECT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analiz reddet' })
  @ApiResponse({ status: 200, description: 'Yeni analiz' })
  async rejectAnalysis(
    @CurrentUser('id') userId: string,
    @Body() dto: RejectAnalysisRequestDto,
  ): Promise<RejectAnalysisResponse> {
    const { analysisId, excludeIds = [] } = dto;

    // Analizi bul
    const analysis = await this.analysisService.findById(analysisId);
    if (!analysis) {
      throw new NotFoundException('Analiz bulunamadı');
    }

    // Otomatik DOWNVOTE - kullanıcı analizi reddetti (arka planda)
    void this.voteService.vote(
      userId,
      VoteTarget.ANALYSIS,
      analysisId,
      VoteType.DOWN,
    );

    // Tüm hariç tutulacak ID'leri birleştir (şu anki + önceki redler)
    const allExcludeIds = [...new Set([analysisId, ...excludeIds])];

    // Sonraki en yüksek skorlu analizi bul
    let nextAnalysis = await this.analysisService.findBestExcluding(
      analysis.product_content_id,
      allExcludeIds,
    );
    let isNew = false;

    if (!nextAnalysis) {
      // Alternatif yok - AI ile yeni analiz oluştur
      const content = await this.contentService.findById(
        analysis.product_content_id,
      );
      if (!content) {
        throw new NotFoundException('İçerik bulunamadı');
      }

      const product = await this.productService.findById(content.product_id);

      // Varyant limitini kontrol et
      await this.analysisService.enforceVariantLimit(
        analysis.product_content_id,
      );

      const aiAnalysis = await this.aiService.analyzeContent(
        product?.brand ?? null,
        product?.name ?? null,
        content.ingredients,
        content.allergens,
        content.nutrition_table,
      );

      nextAnalysis = await this.analysisService.create({
        product_content_id: analysis.product_content_id,
        analysis_text: aiAnalysis,
        is_manual: false,
      });
      isNew = true;
    }

    // Otomatik UPVOTE - yeni analize +1 puan (arka planda)
    void this.voteService.vote(
      userId,
      VoteTarget.ANALYSIS,
      nextAnalysis.id,
      VoteType.UP,
    );

    return {
      nextAnalysis,
      isNew,
      noMoreVariants: false,
    };
  }

  /**
   * POST /api/barcodes/flag
   * Non-food barkodu bildir
   * Rate Limit: 5/dk
   */
  @Post('barcodes/flag')
  @HttpCode(HttpStatus.OK)
  @Throttle(THROTTLE_FLAG)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barkodu bildir (non-food)' })
  @ApiResponse({ status: 200, description: 'Bildirim alındı' })
  async flagBarcode(
    @Body() dto: FlagBarcodeRequestDto,
  ): Promise<{ success: boolean }> {
    const { barcodeId } = dto;

    const barcode = await this.barcodeService.findById(barcodeId);
    if (!barcode) {
      throw new NotFoundException('Barkod bulunamadı');
    }

    await this.barcodeService.flag(barcodeId);

    return { success: true };
  }
}
