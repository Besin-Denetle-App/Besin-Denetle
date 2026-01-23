import {
  ConfirmResponse,
  RejectContentResponse,
  VoteTarget,
  VoteType,
} from '@besin-denetle/shared';
import {
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
import { ProductService } from '../product/product.service';
import { ConfirmRequestDto, RejectContentRequestDto } from './content.dto';
import { ContentService } from './content.service';

@ApiTags('content')
@Controller()
export class ContentController {
  constructor(
    private readonly productService: ProductService,
    private readonly contentService: ContentService,
    private readonly voteService: VoteService,
    private readonly aiService: AiService,
    private readonly rateLimitHelper: RateLimitHelper,
    private readonly foodCheckService: FoodCheckService,
  ) {}

  /**
   * POST /api/products/confirm
   * Ürün onayı + içerik getir (DB'de yoksa AI ile oluştur)
   */
  @Post('products/confirm')
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
        allergens: aiContent.allergens,
        nutrition_table: aiContent.nutrition
          ? { ...aiContent.nutrition, _source: aiContent.model }
          : null,
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
   * POST /api/content/reject
   * Mevcut içeriği reddet, sonraki varyantı getir veya yeni oluştur
   */
  @Post('content/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'İçerik reddet, sonraki içerik getir' })
  @ApiResponse({ status: 200, description: 'Yeni içerik' })
  @ApiResponse({
    status: 400,
    description: 'Non-food ürünün içeriği reject edilemez',
    schema: {
      example: {
        statusCode: 400,
        message: 'Bu ürün yiyecek/içecek kategorisinde değil',
        error: 'Bad Request',
      },
    },
  })
  async rejectContent(
    @CurrentUser('id') userId: string,
    @Body() dto: RejectContentRequestDto,
  ): Promise<RejectContentResponse> {
    const { contentId, excludeIds = [] } = dto;

    const content = await this.contentService.findById(contentId);
    if (!content) {
      throw new NotFoundException('İçerik bulunamadı');
    }

    // Non-food koruma: İçeriğin bağlı olduğu ürünün barkod tipini kontrol et
    this.foodCheckService.assertHumanFood(content.product?.barcode?.type, {
      userId,
      action: 'REJECT_CONTENT',
      resourceId: contentId,
    });

    await this.rateLimitHelper.checkContentReject(userId);
    await this.rateLimitHelper.incrementContentRejectEndpoint(userId);

    // Reddedilen içeriğe downvote
    void this.voteService.vote(
      userId,
      VoteTarget.CONTENT,
      contentId,
      VoteType.DOWN,
    );

    const allExcludeIds = [...new Set([contentId, ...excludeIds])];

    let nextContent = await this.contentService.findBestExcluding(
      content.product_id,
      allExcludeIds,
    );
    let isContentNew = false;

    if (nextContent) {
      // DB hit
      await this.rateLimitHelper.incrementContentRejectDb(userId);
    } else {
      // Alternatif yok - AI ile yeni oluştur
      const product = await this.productService.findById(content.product_id);
      if (!product) {
        throw new NotFoundException('Ürün bulunamadı');
      }

      await this.rateLimitHelper.incrementContentRejectAi(userId);
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

    // Yeni içeriğe upvote
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
}
