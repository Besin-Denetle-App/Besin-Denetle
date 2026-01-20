import {
  AIAnalysisResult,
  AIContentResult,
  AIProductResult,
  ProductType,
} from '@besin-denetle/shared';
import { GoogleGenAI } from '@google/genai';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiConfig } from '../../config';

/**
 * Gemini API - 3 farklı prompt için:
 * 1. identifyProduct - barkoddan ürün bilgisi (grounding açık)
 * 2. getProductContent - içindekiler + besin değerleri (grounding açık)
 * 3. analyzeContent - sağlık analizi (grounding kapalı, pro model)
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string | undefined;
  private readonly isMockMode: boolean;
  private readonly genai: GoogleGenAI | null;

  private readonly modelFast: string;
  private readonly modelSmart: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.isMockMode = !this.apiKey || this.apiKey.trim() === '';

    const aiConfig = this.configService.get<AiConfig>('ai');
    this.modelFast = aiConfig?.modelFast || 'gemini-2.5-flash';
    this.modelSmart = aiConfig?.modelSmart || 'gemini-2.5-pro';

    if (!this.isMockMode && this.apiKey) {
      this.genai = new GoogleGenAI({ apiKey: this.apiKey });
      this.logger.log(
        `AI Service initialized with models: ${this.modelFast} (fast), ${this.modelSmart} (smart)`,
      );
    } else {
      this.genai = null;
      this.logger.warn('AI Service running in MOCK MODE - no API key provided');
    }
  }

  // ========== PROMPT 1: Ürün Tanımlama ==========

  /**
   * Barkoddan marka/isim/gramaj bilgisi çeker
   * Google Search grounding ile web araması yapıyor
   */
  async identifyProduct(barcode: string): Promise<AIProductResult> {
    if (this.isMockMode || !this.genai) {
      return this.mockIdentifyProduct(barcode);
    }

    try {
      const prompt = `Sen bir ürün veri analiz uzmanısın. Türkiye'deki market ve mağaza ürünlerini çok iyi biliyorsun.
Aşağıdaki barkod numarasına sahip ürünü web'de ara.

Barkod: ${barcode}

ÜRÜN TİPİ BELİRLEME KURALLARI:
0 = Kararsız (belirsiz ürün, emin değilsin)
1 = İnsan yiyeceği (gıda, yemek, bisküvi, çikolata, süt ürünleri, meyve, sebze vb.)
2 = İnsan içeceği (su, meyve suyu, çay, kahve, enerji içeceği vb.)
3 = Evcil hayvan yiyeceği/içeceği (kedi maması, köpek maması, kuş yemi vb.)
9 = Diğer (gıda değil - elektronik, giyim, kozmetik, oyuncak vb.)

ÖNEMLİ KURALLAR:
1. Ürün tipini yukarıdaki kurallara göre belirle.
2. Bulamadığın alanları null bırak, tahmin etme.

Yanıt formatı:
{
  "productType": 1,
  "product": {
    "brand": "Marka adı",
    "name": "Ürünün adı",
    "quantity": "Gramaj (örn: 500g, 1L)"
  }
}

SADECE JSON döndür. Açıklama, markdown veya başka bir şey yazma.`;

      const response = await this.genai.models.generateContent({
        model: this.modelFast,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      if (!text.trim()) {
        this.logger.warn('Gemini identifyProduct: Boş yanıt');
        throw new HttpException('AI yanıtı boş döndü', HttpStatus.BAD_GATEWAY);
      }
      this.logger.debug(
        `Gemini identifyProduct response: ${text.substring(0, 200)}...`,
      );

      const result = this.parseJsonResponse<AIProductResult>(text);
      if (!result) {
        throw new HttpException('AI yanıtı işlenemedi', HttpStatus.BAD_GATEWAY);
      }
      return result;
    } catch (error) {
      return this.handleAiError(error, 'identifyProduct');
    }
  }

  // ========== PROMPT 2: İçerik Bilgisi ==========

  /**
   * Ürünün içindekiler listesi + besin değerleri
   * Google Search grounding ile
   */
  async getProductContent(
    brand: string | null,
    name: string | null,
    quantity: string | null,
  ): Promise<AIContentResult> {
    if (this.isMockMode || !this.genai) {
      return this.mockGetProductContent(brand, name);
    }

    try {
      const prompt = `Sen bir gıda uzmanısın. Aşağıdaki ürünün içindekiler listesini ve besin değerlerini bul.

ÜRÜN:
- Marka: ${brand || 'Bilinmiyor'}
- İsim: ${name || 'Bilinmiyor'}
- Gramaj: ${quantity || 'Bilinmiyor'}

ÖNEMLİ KURALLAR:
1. Bulamadığın alanları null bırak, tahmin etme.
2. Besin değerleri 100g başına olmalı.

Yanıt formatı:
{
  "ingredients": "İçindekiler listesi (virgülle ayrılmış)",
  "allergens": "Alerjen bilgisi",
  "nutrition": {
    "servingSize": "100g",
    "calories": 0,
    "protein": 0,
    "carbohydrates": 0,
    "sugars": 0,
    "fat": 0,
    "saturatedFat": 0,
    "fiber": 0,
    "sodium": 0,
    "salt": 0
  }
}

SADECE JSON döndür. Açıklama, markdown veya başka bir şey yazma.`;

      const response = await this.genai.models.generateContent({
        model: this.modelFast,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      if (!text.trim()) {
        this.logger.warn('Gemini getProductContent: Boş yanıt');
        throw new HttpException('AI yanıtı boş döndü', HttpStatus.BAD_GATEWAY);
      }
      this.logger.debug(
        `Gemini getProductContent response: ${text.substring(0, 200)}...`,
      );

      const parsed =
        this.parseJsonResponse<Omit<AIContentResult, 'model'>>(text);
      if (!parsed) {
        throw new HttpException('AI yanıtı işlenemedi', HttpStatus.BAD_GATEWAY);
      }
      return {
        ...parsed,
        model: this.modelFast,
      };
    } catch (error) {
      return this.handleAiError(error, 'getProductContent');
    }
  }

  // ========== PROMPT 3: Sağlık Analizi ==========
  /**
   * İçerik bilgisine göre sağlık değerlendirmesi
   * Google Search yok - model kendi bilgisiyle yanıt veriyor
   */
  async analyzeContent(
    brand: string | null,
    name: string | null,
    ingredients: string | null,
    allergens: string | null,
    nutrition: Record<string, unknown> | null,
  ): Promise<AIAnalysisResult> {
    if (this.isMockMode || !this.genai) {
      return this.mockAnalyzeContent(name);
    }

    try {
      const nutritionStr = nutrition
        ? JSON.stringify(nutrition, null, 2)
        : 'Bilinmiyor';

      const prompt = `Sen bir beslenme uzmanısın. Aşağıdaki gıda ürününü sağlık açısından değerlendir.
Yanıtını TÜRKÇE olarak ver.

ÜRÜN BİLGİSİ:
- Marka: ${brand || 'Bilinmiyor'}
- İsim: ${name || 'Bilinmiyor'}

İÇİNDEKİLER:
${ingredients || 'Bilinmiyor'}

ALERJENLER:
${allergens || 'Bilinmiyor'}

BESİN DEĞERLERİ (100g başına):
${nutritionStr}

ÖNEMLİ KURALLAR:
1. Sağlık puanı 1-10 arası olmalı (1=çok kötü, 10=mükemmel).
2. Özet 3-5 cümle olmalı.

Yanıt formatı:
{
  "summary": "3-5 cümlelik genel değerlendirme (Türkçe)",
  "healthScore": 7,
  "warnings": ["Dikkat edilmesi gereken noktalar"],
  "positives": ["Olumlu yönler"],
  "recommendation": "Tüketim önerisi"
}

SADECE JSON döndür. Açıklama, markdown veya başka bir şey yazma.`;

      const response = await this.genai.models.generateContent({
        model: this.modelSmart,
        contents: prompt,
      });

      const text = response.text || '';
      if (!text.trim()) {
        this.logger.warn('Gemini analyzeContent: Boş yanıt');
        throw new HttpException('AI yanıtı boş döndü', HttpStatus.BAD_GATEWAY);
      }
      this.logger.debug(
        `Gemini analyzeContent response: ${text.substring(0, 200)}...`,
      );

      const parsed =
        this.parseJsonResponse<Omit<AIAnalysisResult, 'model'>>(text);
      if (!parsed) {
        throw new HttpException('AI yanıtı işlenemedi', HttpStatus.BAD_GATEWAY);
      }
      return {
        ...parsed,
        model: this.modelSmart,
      };
    } catch (error) {
      return this.handleAiError(error, 'analyzeContent');
    }
  }

  // ========== Helpers ==========

  /** Markdown code block formatını temizleyip JSON parse eder */
  private parseJsonResponse<T>(text: string): T | null {
    try {
      let cleaned = text.trim();

      // ```json ... ``` formatını temizle
      if (cleaned.startsWith('```')) {
        cleaned = cleaned
          .replace(/^```(?:json)?\n?/, '')
          .replace(/\n?```$/, '');
      }

      return JSON.parse(cleaned) as T;
    } catch (error) {
      this.logger.warn(`JSON parse error: ${(error as Error).message}`);
      this.logger.debug(`Raw text: ${text}`);
      return null;
    }
  }

  /** Hata handling - 429, genel hatalar vs */
  private handleAiError(error: unknown, methodName: string): never {
    const errorMessage = (error as Error).message || 'Bilinmeyen AI hatası';
    this.logger.error(`Gemini ${methodName} error: ${errorMessage}`);

    if (error instanceof HttpException) {
      throw error;
    }

    // 429 Rate Limit
    if (
      errorMessage.includes('429') ||
      errorMessage.includes('RESOURCE_EXHAUSTED')
    ) {
      throw new HttpException(
        'AI servisi şu an yoğun, lütfen biraz sonra tekrar deneyin',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    throw new HttpException(
      'AI servisi şu an kullanılamıyor',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  // ========== Mock Data (API key yokken) ==========

  private mockIdentifyProduct(barcode: string): AIProductResult {
    this.logger.debug(`[MOCK] identifyProduct: ${barcode}`);

    if (barcode.startsWith('869')) {
      return {
        productType: ProductType.FOOD,
        product: {
          brand: 'Mock Marka',
          name: `Test Ürün ${barcode.slice(-4)}`,
          quantity: '100g',
        },
      };
    }

    return {
      productType: ProductType.FOOD,
      product: {
        brand: 'Örnek Marka',
        name: 'Örnek Ürün',
        quantity: '250g',
      },
    };
  }

  private mockGetProductContent(
    brand: string | null,
    name: string | null,
  ): AIContentResult {
    this.logger.debug(`[MOCK] getProductContent: ${brand} - ${name}`);

    return {
      ingredients:
        'Su, Şeker, Buğday Unu, Kakao Yağı, Yağsız Süt Tozu, Emülgatör (Lesitin)',
      allergens: 'Gluten, Süt ürünleri içerir. Fındık izleri içerebilir.',
      nutrition: {
        servingSize: '100g',
        calories: 450,
        protein: 6.5,
        carbohydrates: 58,
        sugars: 42,
        fat: 22,
        saturatedFat: 13,
        fiber: 2.1,
        sodium: 80,
        salt: 0.2,
      },
      model: 'mock-gemini',
    };
  }

  private mockAnalyzeContent(name: string | null): AIAnalysisResult {
    this.logger.debug(`[MOCK] analyzeContent: ${name}`);

    return {
      model: 'mock-gemini',
      summary:
        'Bu ürün yüksek şeker ve doymuş yağ içermektedir. Ara sıra tüketim için uygundur ancak düzenli tüketim önerilmez.',
      healthScore: 4,
      warnings: ['Yüksek şeker içeriği', 'Doymuş yağ oranı yüksek'],
      positives: ['Protein kaynağı', 'Lif içerir'],
      recommendation:
        'Haftada 1-2 kez, küçük porsiyonlar halinde tüketilebilir.',
    };
  }
}
