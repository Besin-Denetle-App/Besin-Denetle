import {
  AIAnalysisResult,
  AIContentResult,
  AIProductResult,
} from '@besin-denetle/shared';
import { Injectable } from '@nestjs/common';
import { AppLogger } from '../../common';
import { AiClientService } from './ai-client.service';
import { AiParserService } from './ai-parser.service';
import { AiPromptService } from './ai-prompt.service';
import {
  ANALYZE_CONTENT_SCHEMA,
  GET_PRODUCT_CONTENT_SCHEMA,
  IDENTIFY_PRODUCT_SCHEMA,
} from './ai-schema.config';

/**
 * AI Service (Orchestrator)
 * Diğer AI servislerini koordine eder.
 *
 * 3 farklı prompt için Gemini API kullanımı:
 * 1. identifyProduct - barkoddan ürün bilgisi (grounding + fallback)
 * 2. getProductContent - içindekiler + besin değerleri (grounding + fallback)
 * 3. analyzeContent - sağlık analizi (sadece schema, fallback yok)
 *
 * Fallback Sistemi: Primary başarısız olursa backup model devreye girer.
 *
 * @version 3.0 (Ocak 2026 - Fallback Sistemi)
 */
@Injectable()
export class AiService {
  constructor(
    private readonly promptService: AiPromptService,
    private readonly clientService: AiClientService,
    private readonly parserService: AiParserService,
    private readonly appLogger: AppLogger,
  ) {}

  // ========== PROMPT 1: Ürün Tanımlama ==========

  /**
   * Barkoddan marka/isim/gramaj bilgisi çeker
   * Google Search grounding + Fallback sistemi
   * @returns AIProductResult veya null (confidence < 50 ise)
   */
  async identifyProduct(barcode: string): Promise<AIProductResult | null> {
    // Mock mode kontrolü
    if (this.clientService.isInMockMode()) {
      return this.parserService.mockIdentifyProduct(barcode);
    }

    // V1 ve V2 promptları oluştur
    const promptV1 = this.promptService.buildIdentifyProductPromptV1(barcode);
    const promptV2 = this.promptService.buildIdentifyProductPromptV2(barcode);

    // API çağrısı (fallback sistemi ile)
    const result =
      await this.clientService.callWithGroundingAndFallback<AIProductResult>(
        promptV1,
        promptV2,
        'identifyProduct',
        IDENTIFY_PRODUCT_SCHEMA,
      );

    // Confidence kontrolü: < 50 = ürün bulunamadı
    if (result.confidence < 50) {
      this.appLogger.infrastructure('Ürün bulunamadı (düşük confidence)', {
        barcode,
        confidence: result.confidence,
        productType: result.productType,
      });
      return null;
    }

    this.appLogger.infrastructure('Ürün tanımlandı', {
      barcode,
      confidence: result.confidence,
      brand: result.product?.brand,
      name: result.product?.name,
    });

    return result;
  }

  // ========== PROMPT 2: İçerik Bilgisi ==========

  /**
   * Ürünün içindekiler listesi + besin değerleri
   * Google Search grounding + Fallback sistemi
   */
  async getProductContent(
    brand: string | null,
    name: string | null,
    quantity: string | null,
  ): Promise<AIContentResult> {
    // Mock mode kontrolü
    if (this.clientService.isInMockMode()) {
      return this.parserService.mockGetProductContent(brand, name);
    }

    // V1 ve V2 promptları oluştur
    const promptV1 = this.promptService.buildGetProductContentPromptV1(
      brand,
      name,
      quantity,
    );
    const promptV2 = this.promptService.buildGetProductContentPromptV2(
      brand,
      name,
      quantity,
    );

    // API çağrısı (fallback sistemi ile)
    const result = await this.clientService.callWithGroundingAndFallback<
      Omit<AIContentResult, 'model'>
    >(promptV1, promptV2, 'getProductContent', GET_PRODUCT_CONTENT_SCHEMA);

    // Model bilgisini ekle
    return {
      ...result,
      model: this.clientService.getModelFast(),
    };
  }

  // ========== PROMPT 3: Sağlık Analizi ==========

  /**
   * İçerik bilgisine göre sağlık değerlendirmesi
   * Structured Output (Google Search yok) - Fallback yok
   */
  async analyzeContent(
    brand: string | null,
    name: string | null,
    ingredients: string | null,
    allergens: string | null,
    nutrition: Record<string, unknown> | null,
  ): Promise<AIAnalysisResult> {
    // Mock mode kontrolü
    if (this.clientService.isInMockMode()) {
      return this.parserService.mockAnalyzeContent(name);
    }

    // Prompt oluştur
    const prompt = this.promptService.buildAnalyzeContentPrompt(
      brand,
      name,
      ingredients,
      allergens,
      nutrition,
    );

    // API çağrısı (sadece schema, grounding yok, fallback yok)
    const result = await this.clientService.callWithoutGrounding<
      Omit<AIAnalysisResult, 'model'>
    >(prompt, 'analyzeContent', ANALYZE_CONTENT_SCHEMA);

    // Model bilgisini ekle
    return {
      ...result,
      model: this.clientService.getModelSmart(),
    };
  }
}
