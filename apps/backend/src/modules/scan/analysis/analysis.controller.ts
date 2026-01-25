import {
  GenerateAnalysisResponse,
  RejectAnalysisResponse,
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
import { ContentService } from '../content/content.service';
import { ProductService } from '../product/product.service';
import {
  GenerateAnalysisRequestDto,
  RejectAnalysisRequestDto,
} from './analysis.dto';
import { AnalysisService } from './analysis.service';

@ApiTags('analysis')
@Controller('api')
export class AnalysisController {
  constructor(
    private readonly productService: ProductService,
    private readonly contentService: ContentService,
    private readonly analysisService: AnalysisService,
    private readonly voteService: VoteService,
    private readonly aiService: AiService,
    private readonly rateLimitHelper: RateLimitHelper,
    private readonly foodCheckService: FoodCheckService,
  ) {}

  /**
   * POST /api/analysis/generate
   * DB'de varsa getir, yoksa AI ile oluştur
   */
  @Post('analysis/generate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'İçerik için analiz üret' })
  @ApiResponse({ status: 200, description: 'Analiz döner' })
  @ApiResponse({
    status: 400,
    description: 'Non-food ürün için analiz üretilemez',
    schema: {
      example: {
        statusCode: 400,
        message: 'Bu ürün yiyecek/içecek kategorisinde değil',
        error: 'Bad Request',
      },
    },
  })
  async generateAnalysis(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateAnalysisRequestDto,
  ): Promise<GenerateAnalysisResponse> {
    const contentId = dto.contentId;

    const content = await this.contentService.findById(contentId);
    if (!content) {
      throw new NotFoundException('İçerik bulunamadı');
    }

    // Non-food koruma: İçeriğin bağlı olduğu ürünün barkod tipini kontrol et
    this.foodCheckService.assertHumanFood(content.product?.barcode?.type, {
      userId,
      action: 'GENERATE_ANALYSIS',
      resourceId: contentId,
    });

    await this.rateLimitHelper.checkAnalysis(userId);

    let analysis = await this.analysisService.findBestByContentId(contentId);
    let isNew = false;

    if (analysis) {
      // DB hit
      await this.rateLimitHelper.incrementAnalysisDb(userId);
    } else {
      // AI hit - yeni analiz oluştur
      await this.rateLimitHelper.incrementAnalysisAi(userId);

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

    // Otomatik upvote (arka planda)
    void this.voteService.vote(
      userId,
      VoteTarget.ANALYSIS,
      analysis.id,
      VoteType.UP,
    );

    return { analysis, isNew };
  }

  /**
   * POST /api/analysis/reject
   * Mevcut analizi reddet, sonraki varyantı getir veya yeni oluştur
   */
  @Post('analysis/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analiz reddet' })
  @ApiResponse({ status: 200, description: 'Yeni analiz' })
  @ApiResponse({
    status: 400,
    description: 'Non-food ürün analizi reject edilemez',
    schema: {
      example: {
        statusCode: 400,
        message: 'Bu ürün yiyecek/içecek kategorisinde değil',
        error: 'Bad Request',
      },
    },
  })
  async rejectAnalysis(
    @CurrentUser('id') userId: string,
    @Body() dto: RejectAnalysisRequestDto,
  ): Promise<RejectAnalysisResponse> {
    const { analysisId, excludeIds = [] } = dto;

    const analysis = await this.analysisService.findById(analysisId);
    if (!analysis) {
      throw new NotFoundException('Analiz bulunamadı');
    }

    // Non-food koruma: Analizin bağlı olduğu içeriğin ürününün barkod tipini kontrol et
    this.foodCheckService.assertHumanFood(
      analysis.productContent?.product?.barcode?.type,
      {
        userId,
        action: 'REJECT_ANALYSIS',
        resourceId: analysisId,
      },
    );

    await this.rateLimitHelper.checkAnalysisReject(userId);
    await this.rateLimitHelper.incrementAnalysisRejectEndpoint(userId);

    // Reddedilen analize downvote
    void this.voteService.vote(
      userId,
      VoteTarget.ANALYSIS,
      analysisId,
      VoteType.DOWN,
    );

    const allExcludeIds = [...new Set([analysisId, ...excludeIds])];

    let nextAnalysis = await this.analysisService.findBestExcluding(
      analysis.product_content_id,
      allExcludeIds,
    );
    let isNew = false;

    if (nextAnalysis) {
      // DB hit
      await this.rateLimitHelper.incrementAnalysisRejectDb(userId);
    } else {
      // Alternatif yok - AI ile yeni oluştur
      const content = await this.contentService.findById(
        analysis.product_content_id,
      );
      if (!content) {
        throw new NotFoundException('İçerik bulunamadı');
      }

      const product = await this.productService.findById(content.product_id);

      await this.rateLimitHelper.incrementAnalysisRejectAi(userId);
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

    // Yeni analize upvote
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
}
