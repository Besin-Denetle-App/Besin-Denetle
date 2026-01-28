import {
  ConfirmResponse,
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

import { FoodCheckService, RateLimitHelper } from '../../../common';

import { AiService } from '../../ai/ai.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/tokens/jwt-auth.guard';
import { VoteService } from '../../vote/vote.service';
import { BarcodeService } from '../barcode/barcode.service';
import { ContentService } from '../content/content.service';
import {
  ConfirmRequestDto,
  RejectProductRequestDto,
  ScanRequestDto,
} from './product.dto';
import { ProductService } from './product.service';

/**
 * Product controller - Ürün işlemleri
 */
@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly barcodeService: BarcodeService,
    private readonly productService: ProductService,
    private readonly contentService: ContentService,
    private readonly voteService: VoteService,
    private readonly aiService: AiService,
    private readonly rateLimitHelper: RateLimitHelper,
    private readonly foodCheckService: FoodCheckService,
  ) {}

  /**
   * Barkod tara - DB'de yoksa AI'dan al
   */
  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Barkod tara' })
  @ApiResponse({ status: 200, description: 'Ürün bulundu veya oluşturuldu' })
  @ApiResponse({
    status: 400,
    description: 'Geçersiz barkod formatı',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Barkod 8-13 karakter arasında olmalıdır',
          'Barkod sadece rakamlardan oluşmalıdır',
        ],
        error: 'Bad Request',
      },
    },
  })
  async scan(
    @CurrentUser('id') userId: string,
    @Body() dto: ScanRequestDto,
  ): Promise<ScanResponse> {
    const { barcode } = dto;

    if (!barcode || barcode.trim() === '') {
      throw new BadRequestException('Barkod numarası gerekli');
    }

    // Rate limit kontrolü
    await this.rateLimitHelper.checkScan(userId);

    // Veritabanında barkod var mı kontrol et
    let barcodeEntity = await this.barcodeService.findByCode(barcode);

    if (barcodeEntity) {
      // Barkod mevcut - tipine göre işlem yap
      const isHumanFood = this.foodCheckService.isHumanFoodType(
        barcodeEntity.type,
      );

      if (!isHumanFood) {
        // Non-food barkod - varsa product bilgisini de getir
        await this.rateLimitHelper.incrementScanDb(userId);
        const existingProduct = await this.productService.findBestByBarcodeId(
          barcodeEntity.id,
        );
        return {
          product: existingProduct,
          barcodeId: barcodeEntity.id,
          isNew: false,
          barcodeType: barcodeEntity.type,
        };
      }

      // Food/Beverage - en iyi varyantı getir
      const bestProduct = await this.productService.findBestByBarcodeId(
        barcodeEntity.id,
      );

      if (bestProduct) {
        // DB HIT
        await this.rateLimitHelper.incrementScanDb(userId);

        return {
          product: bestProduct,
          barcodeId: barcodeEntity.id,
          isNew: false,
          barcodeType: barcodeEntity.type,
        };
      }
    }

    // AI devreye giriyor
    await this.rateLimitHelper.incrementScanAi(userId);

    const aiResult = await this.aiService.identifyProduct(barcode);

    // AI ürün bulamadı (confidence < 50)
    if (!aiResult) {
      throw new NotFoundException('Bu barkodlu ürün bilgisi bulunamadı');
    }

    const isHumanFood = this.foodCheckService.isHumanFoodType(
      aiResult.productType,
    );

    if (!isHumanFood) {
      // Non-food ürün - barkodu DB'ye kaydet ve uygun response dön
      if (!barcodeEntity) {
        barcodeEntity = await this.barcodeService.create(
          barcode,
          aiResult.productType,
          false,
        );
      }
      return {
        product: null,
        barcodeId: barcodeEntity.id,
        isNew: true,
        barcodeType: aiResult.productType,
      };
    }

    // AI ürün bilgisi bulamadı
    if (!aiResult.product) {
      throw new NotFoundException('Bu barkodlu ürün bilgisi bulunamadı');
    }

    // Barkod yoksa oluştur (productType AI'dan geliyor)
    if (!barcodeEntity) {
      barcodeEntity = await this.barcodeService.create(
        barcode,
        aiResult.productType,
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
      barcodeId: barcodeEntity.id,
      isNew: true,
      barcodeType: barcodeEntity.type,
    };
  }

  /**
   * POST /api/products/confirm
   * Ürün onayı + içerik getir (DB'de yoksa AI ile oluştur)
   */
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ürün onayla, içerik getir' })
  @ApiResponse({ status: 200, description: 'İçerik döner' })
  @ApiResponse({
    status: 400,
    description: 'Non-food ürün confirm edilemez',
    schema: {
      example: {
        statusCode: 400,
        message: 'Bu ürün yiyecek/içecek kategorisinde değil',
        error: 'Bad Request',
      },
    },
  })
  async confirm(
    @CurrentUser('id') userId: string,
    @Body() dto: ConfirmRequestDto,
  ): Promise<ConfirmResponse> {
    const { productId } = dto;

    const product = await this.productService.findById(productId);
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    // Non-food koruma: Sadece yiyecek/içecek ürünler confirm edilebilir
    this.foodCheckService.assertHumanFood(product.barcode?.type, {
      userId,
      action: 'CONFIRM_PRODUCT',
      resourceId: productId,
    });

    await this.rateLimitHelper.checkContent(userId);

    // Ürün onaylandı - upvote
    void this.voteService.vote(
      userId,
      VoteTarget.PRODUCT,
      productId,
      VoteType.UP,
    );

    let content = await this.contentService.findBestByProductId(productId);
    let isContentNew = false;

    if (content) {
      // DB hit
      await this.rateLimitHelper.incrementContentDb(userId);
    } else {
      // AI hit - yeni içerik oluştur
      await this.rateLimitHelper.incrementContentAi(userId);

      const aiContent = await this.aiService.getProductContent(
        product.brand,
        product.name,
        product.quantity,
      );

      content = await this.contentService.create({
        product_id: productId,
        ingredients: aiContent.ingredients,
        allergens: aiContent.allergens?.join(', ') ?? null,
        nutrition_table: aiContent.nutrition ?? null,
        model: aiContent.model,
        is_manual: false,
      });
      isContentNew = true;
    }

    // İçerik upvote
    void this.voteService.vote(
      userId,
      VoteTarget.CONTENT,
      content.id,
      VoteType.UP,
    );

    return { content, isContentNew };
  }

  /**
   * Ürün reddet, sonraki varyant getir
   */
  @Post('reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ürün reddet, sonraki varyant getir' })
  @ApiResponse({
    status: 200,
    description: 'Sonraki varyant veya yeni AI ürünü',
  })
  @ApiResponse({
    status: 400,
    description: 'Non-food ürün reject edilemez',
    schema: {
      example: {
        statusCode: 400,
        message: 'Bu ürün yiyecek/içecek kategorisinde değil',
        error: 'Bad Request',
      },
    },
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

    // Non-food koruma: Sadece yiyecek/içecek ürünler reject edilebilir
    this.foodCheckService.assertHumanFood(product.barcode?.type, {
      userId,
      action: 'REJECT_PRODUCT',
      resourceId: productId,
    });

    // Rate limit kontrolü
    await this.rateLimitHelper.checkScanReject(userId);

    // scan_reject hemen artırılır (endpoint limiti)
    await this.rateLimitHelper.incrementScanRejectEndpoint(userId);

    // DOWNVOTE - ürün reddedildi
    void this.voteService.vote(
      userId,
      VoteTarget.PRODUCT,
      productId,
      VoteType.DOWN,
    );

    // Tüm hariç tutulacak ID'leri birleştir (şu anki + önceki redler)
    const allExcludeIds = [...new Set([productId, ...excludeIds])];

    // Sonraki en iyi varyantı bul
    const nextProduct = await this.productService.findBestExcluding(
      product.barcode_id,
      allExcludeIds,
    );

    if (nextProduct) {
      // DB HIT
      await this.rateLimitHelper.incrementScanRejectDb(userId);

      return {
        nextProduct,
        isNew: false,
        noMoreVariants: false,
      };
    }

    // Alternatif yok - AI ile yeni oluştur
    const barcode = await this.barcodeService.findById(product.barcode_id);
    if (!barcode) {
      throw new NotFoundException('Barkod bulunamadı');
    }

    // AI HIT
    await this.rateLimitHelper.incrementScanRejectAi(userId);

    const aiResult = await this.aiService.identifyProduct(barcode.code);

    // AI ürün bulamadı veya non-food
    if (!aiResult) {
      return {
        nextProduct: null,
        isNew: false,
        noMoreVariants: true,
      };
    }

    const isHumanFood = this.foodCheckService.isHumanFoodType(
      aiResult.productType,
    );

    if (!isHumanFood || !aiResult.product) {
      return {
        nextProduct: null,
        isNew: false,
        noMoreVariants: true,
      };
    }

    // Varyant limiti (max 3)
    await this.productService.enforceVariantLimit(product.barcode_id);

    // Yeni varyant oluştur
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
}
