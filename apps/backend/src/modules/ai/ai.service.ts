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
  IDENTIFY_PRODUCT_SCHEMA
} from './ai-schema.config';

/**
 * AI Service (Orchestrator)
 * Diğer AI servislerini koordine eder.
 *
 * 3 farklı prompt için Gemini API kullanımı:
 * 1. identifyProduct - barkoddan ürün bilgisi (grounding + schema)
 * 2. getProductContent - içindekiler + besin değerleri (grounding + schema)
 * 3. analyzeContent - sağlık analizi (sadece schema, grounding yok)
 *
 * Gemini 3 Structured Output (responseSchema) ile %100 type-safe çıktılar.
 */
@Injectable()
export class AiService {
  constructor(
    private readonly promptService: AiPromptService,
    private readonly clientService: AiClientService,
    private readonly parserService: AiParserService,
    private readonly appLogger: AppLogger,
  ) { }

  // ========== PROMPT 1: Ürün Tanımlama ==========

  /**
   * Barkoddan marka/isim/gramaj bilgisi çeker
   * Google Search grounding + Structured Output
   * @returns AIProductResult veya null (confidence < 50 ise)
   */
  async identifyProduct(barcode: string): Promise<AIProductResult | null> {
    // Mock mode kontrolü
    if (this.clientService.isInMockMode()) {
      return this.parserService.mockIdentifyProduct(barcode);
    }

    // Prompt oluştur
    const prompt = this.promptService.buildIdentifyProductPrompt(barcode);

    // API çağrısı (grounding + schema ile)
    const result = await this.clientService.callWithGrounding<AIProductResult>(
      prompt,
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
   * Google Search grounding + Structured Output
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

    // Prompt oluştur
    const prompt = this.promptService.buildGetProductContentPrompt(
      brand,
      name,
      quantity,
    );

    // API çağrısı (grounding + schema ile)
    const result = await this.clientService.callWithGrounding<
      Omit<AIContentResult, 'model'>
    >(prompt, 'getProductContent');

    const model = this.clientService.getModelFast();

    // DEBUG LOG: Model bilgisi
    this.appLogger.business('AI GetProductContent completed', {
      model,
      envModelFast: process.env.GEMINI_MODEL_FAST,
    });

    // Model bilgisini ekle
    return {
      ...result,
      model,
    };
  }

  // ========== PROMPT 3: Sağlık Analizi ==========

  /**
   * İçerik bilgisine göre sağlık değerlendirmesi
   * Structured Output (Google Search yok)
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

    // API çağrısı (sadece schema, grounding yok)
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
