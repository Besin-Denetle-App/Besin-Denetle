import {
  AIAnalysisResult,
  AIContentResult,
  AIProductResult,
  ProductType,
} from '@besin-denetle/shared';
import { Injectable } from '@nestjs/common';
import { AppLogger } from '../../common';

/**
 * AI Parser Service
 * Mock data üretir (API key yokken).
 * Structured Output (responseSchema) kullanıldığından parse metodları silindi.
 */
@Injectable()
export class AiParserService {
  constructor(private readonly appLogger: AppLogger) {}

  // ========== Mock Data (API key yokken) ==========

  mockIdentifyProduct(barcode: string): AIProductResult {
    this.appLogger.infrastructure('MOCK: identifyProduct', { barcode });

    if (barcode.startsWith('869')) {
      return {
        productType: ProductType.FOOD,
        confidence: 85,
        product: {
          brand: 'Mock Marka',
          name: `Test Ürün ${barcode.slice(-4)}`,
          quantity: '100g',
        },
      };
    }

    return {
      productType: ProductType.FOOD,
      confidence: 90,
      product: {
        brand: 'Örnek Marka',
        name: 'Örnek Ürün',
        quantity: '250g',
      },
    };
  }

  mockGetProductContent(
    brand: string | null,
    name: string | null,
  ): AIContentResult {
    this.appLogger.infrastructure('MOCK: getProductContent', { brand, name });

    return {
      ingredients:
        'Su, Şeker, Buğday Unu, Kakao Yağı, Yağsız Süt Tozu, Emülgatör (Lesitin)',
      allergens: ['Gluten', 'Süt ürünleri', 'Fındık izleri'],
      nutrition: {
        servingSize: '100g',
        energy: 450,
        fat: 22,
        saturatedFat: 13,
        cholesterol: 15,
        carbohydrates: 58,
        sugars: 42,
        polyols: 0,
        starch: 10,
        fiber: 2.1,
        protein: 6.5,
        salt: 0.2,
      },
      model: 'mock-gemini',
    };
  }

  mockAnalyzeContent(name: string | null): AIAnalysisResult {
    this.appLogger.infrastructure('MOCK: analyzeContent', { name });

    return {
      model: 'mock-gemini',
      summary:
        'Bu ürün yüksek şeker ve doymuş yağ içermektedir. NOVA 4 kategorisinde ultra işlenmiş bir gıdadır. Ara sıra tüketim için uygundur ancak düzenli tüketim önerilmez.',
      healthScore: 4,
      novaGroup: 4,
      novaReason: 'Aroma, emülgatör ve stabilizatör içeriyor.',
      nutriScore: 'D',
      warnings: ['Yüksek şeker içeriği', 'Doymuş yağ oranı yüksek', 'E250'],
      positives: ['Protein kaynağı', 'Lif içerir'],
      warning_summary:
        "Bu ürün 100g başına 42g şeker içermektedir ki bu günlük önerilen miktarın yaklaşık %50'sidir. Ayrıca doymuş yağ oranı yüksek olup kardiyovasküler sağlık için risk oluşturabilir.",
      positive_summary:
        'Ürün 6.5g protein içermesi sayesinde bir miktar tokluk hissi sağlayabilir. Ayrıca 2.1g lif içeriği sindirim sistemini destekler.',
      recommendation:
        'Haftada 1-2 kez, küçük porsiyonlar halinde tüketilebilir. Günlük şeker alımınızı takip edin ve bu ürünü tükettikten sonra ekstra şekerli gıdalardan kaçının.',
    };
  }
}
