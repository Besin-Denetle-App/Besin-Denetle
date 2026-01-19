import {
  AI_RATE_LIMIT_MS,
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
 * Gemini AI entegrasyon servisi
 * Ürün tanımlama, içerik bulma ve sağlık analizi.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string | undefined;
  private readonly isMockMode: boolean;
  private readonly genai: GoogleGenAI | null;

  // Model isimleri
  private readonly modelFast: string;
  private readonly modelSmart: string;

  // Rate limit map (userId -> timestamp)
  private readonly lastCallTime: Map<string, number> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.isMockMode = !this.apiKey || this.apiKey.trim() === '';

    // Model config
    const aiConfig = this.configService.get<AiConfig>('ai');
    this.modelFast = aiConfig?.modelFast || 'gemini-2.5-flash';
    this.modelSmart = aiConfig?.modelSmart || 'gemini-2.5-pro';

    // Gemini client
    if (!this.isMockMode && this.apiKey) {
      this.genai = new GoogleGenAI({ apiKey: this.apiKey });
      this.logger.log(
        `AI Service initialized with models: ${this.modelFast} (fast), ${this.modelSmart} (smart)`,
      );
    } else {
      this.genai = null;
      this.logger.warn('AI Service running in MOCK MODE - no API key provided');
    }

    // Rate limit temizleme (1 saat)
    setInterval(
      () => {
        this.cleanupOldRateLimitEntries();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Eski rate limit kayıtlarını temizle (1 saatten eski)
   */
  private cleanupOldRateLimitEntries(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 saat
    let deleted = 0;

    for (const [key, timestamp] of this.lastCallTime) {
      if (now - timestamp > maxAge) {
        this.lastCallTime.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      this.logger.debug(
        `Rate limit cleanup: ${deleted} eski kayıt silindi, ${this.lastCallTime.size} kayıt kaldı`,
      );
    }
  }

  /**
   * Rate limit kontrolü
   */
  private enforceRateLimit(userId?: string): void {
    const key = userId || 'global';
    const lastCall = this.lastCallTime.get(key) || 0;
    const elapsed = Date.now() - lastCall;
    const remaining = AI_RATE_LIMIT_MS - elapsed;

    if (remaining > 0) {
      this.logger.warn(
        `Rate limit active for ${key}. ${Math.ceil(remaining / 1000)}s remaining`,
      );
      throw new HttpException(
        `Lütfen ${Math.ceil(remaining / 1000)} saniye bekleyin`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Zamanı güncelle
    this.lastCallTime.set(key, Date.now());
  }

  /**
   * Rate limit uygulama olmadan sadece zaman güncelle
   */
  private updateLastCallTime(userId?: string): void {
    const key = userId || 'global';
    this.lastCallTime.set(key, Date.now());
  }

  // ==================== PROMPT 1 ====================

  /**
   * Prompt 1: Ürün kimliği (barkoddan marka, isim, gramaj)
   */
  async identifyProduct(
    barcode: string,
    userId?: string,
    enforceLimit: boolean = false,
  ): Promise<AIProductResult> {
    if (enforceLimit) {
      this.enforceRateLimit(userId);
    } else {
      this.updateLastCallTime(userId);
    }

    // Mock modda sahte veri döndür
    if (this.isMockMode || !this.genai) {
      return this.mockIdentifyProduct(barcode);
    }

    try {
      const prompt = `Sen bir gıda uzmanısın. Aşağıdaki barkod numarasına sahip ürünü web'de ara.

Barkod: ${barcode}

ÖNEMLİ KURALLAR:
1. Eğer bu bir GIDA veya İÇECEK ürünü DEĞİLSE: {"isFood": false}
2. Bulamadığın alanları null bırak, tahmin etme.
3. Sadece JSON döndür, başka açıklama ekleme.

Yanıt formatı:
{
  "isFood": true,
  "product": {
    "brand": "Marka adı",
    "name": "Ürünün adı",
    "quantity": "Gramaj (örn: 500g, 1L)"
  }
}`;

      // Google Search grounding ile çağrı yap
      const response = await this.genai.models.generateContent({
        model: this.modelFast,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      if (!text.trim()) {
        this.logger.warn('Gemini identifyProduct: Boş yanıt alındı');
        throw new HttpException('AI yanıtı boş döndü', HttpStatus.BAD_GATEWAY);
      }
      this.logger.debug(
        `Gemini identifyProduct response: ${text.substring(0, 200)}...`,
      );

      // JSON parse et
      const result = this.parseJsonResponse<AIProductResult>(text);
      if (!result) {
        throw new HttpException('AI yanıtı işlenemedi', HttpStatus.BAD_GATEWAY);
      }
      return result;
    } catch (error) {
      const errorMessage = (error as Error).message || 'Bilinmeyen AI hatası';
      this.logger.error(`Gemini identifyProduct error: ${errorMessage}`);

      // HttpException'ları tekrar fırlat
      if (error instanceof HttpException) {
        throw error;
      }

      // 429 Rate Limit hatası
      if (
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED')
      ) {
        throw new HttpException(
          'AI servisi şu an yoğun, lütfen biraz sonra tekrar deneyin',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Diğer hatalar
      throw new HttpException(
        'AI servisi şu an kullanılamıyor',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ==================== PROMPT 2 ====================

  /**
   * Prompt 2: İçerik bilgisi (içindekiler, alerjenler, besin değerleri)
   */
  async getProductContent(
    brand: string | null,
    name: string | null,
    quantity: string | null,
    userId?: string,
    enforceLimit: boolean = false,
  ): Promise<AIContentResult> {
    if (enforceLimit) {
      this.enforceRateLimit(userId);
    } else {
      this.updateLastCallTime(userId);
    }

    // Mock modda sahte veri döndür
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
3. Sadece JSON döndür, başka açıklama ekleme.

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
}`;

      // Google Search grounding ile çağrı yap
      const response = await this.genai.models.generateContent({
        model: this.modelFast,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      if (!text.trim()) {
        this.logger.warn('Gemini getProductContent: Boş yanıt alındı');
        throw new HttpException('AI yanıtı boş döndü', HttpStatus.BAD_GATEWAY);
      }
      this.logger.debug(
        `Gemini getProductContent response: ${text.substring(0, 200)}...`,
      );

      // JSON parse + model ekle
      const parsed =
        this.parseJsonResponse<Omit<AIContentResult, 'model'>>(text);
      if (!parsed) {
        throw new HttpException('AI yanıtı işlenemedi', HttpStatus.BAD_GATEWAY);
      }
      return {
        ...parsed,
        model: this.modelFast, // Kullanılan model
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Bilinmeyen AI hatası';
      this.logger.error(`Gemini getProductContent error: ${errorMessage}`);

      // HttpException ise tekrar fırlat
      if (error instanceof HttpException) {
        throw error;
      }

      // 429 Rate Limit hatası
      if (
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED')
      ) {
        throw new HttpException(
          'AI servisi şu an yoğun, lütfen biraz sonra tekrar deneyin',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Diğer hatalar
      throw new HttpException(
        'AI servisi şu an kullanılamıyor',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ==================== PROMPT 3 ====================

  /**
   * Prompt 3: Sağlık analizi (grounding yok)
   */
  async analyzeContent(
    brand: string | null,
    name: string | null,
    ingredients: string | null,
    allergens: string | null,
    nutrition: Record<string, unknown> | null,
    userId?: string,
    enforceLimit: boolean = false,
  ): Promise<AIAnalysisResult> {
    if (enforceLimit) {
      this.enforceRateLimit(userId);
    } else {
      this.updateLastCallTime(userId);
    }

    // Mock modda sahte veri döndür
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
3. Sadece JSON döndür, başka açıklama ekleme.

Yanıt formatı:
{
  "summary": "3-5 cümlelik genel değerlendirme (Türkçe)",
  "healthScore": 7,
  "warnings": ["Dikkat edilmesi gereken noktalar"],
  "positives": ["Olumlu yönler"],
  "recommendation": "Tüketim önerisi"
}`;

      // Grounding kullanılmadan çağrı yap
      const response = await this.genai.models.generateContent({
        model: this.modelSmart,
        contents: prompt,
      });

      const text = response.text || '';
      if (!text.trim()) {
        this.logger.warn('Gemini analyzeContent: Boş yanıt alındı');
        throw new HttpException('AI yanıtı boş döndü', HttpStatus.BAD_GATEWAY);
      }
      this.logger.debug(
        `Gemini analyzeContent response: ${text.substring(0, 200)}...`,
      );

      // JSON parse + model ekle
      const parsed =
        this.parseJsonResponse<Omit<AIAnalysisResult, 'model'>>(text);
      if (!parsed) {
        throw new HttpException('AI yanıtı işlenemedi', HttpStatus.BAD_GATEWAY);
      }
      return {
        ...parsed,
        model: this.modelSmart, // Kullanılan model
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Bilinmeyen AI hatası';
      this.logger.error(`Gemini analyzeContent error: ${errorMessage}`);

      // HttpException ise tekrar fırlat
      if (error instanceof HttpException) {
        throw error;
      }

      // 429 Rate Limit hatası
      if (
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED')
      ) {
        throw new HttpException(
          'AI servisi şu an yoğun, lütfen biraz sonra tekrar deneyin',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Diğer hatalar
      throw new HttpException(
        'AI servisi şu an kullanılamıyor',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ==================== YARDIMCI ====================

  /**
   * JSON parse (markdown temizleme dahil)
   */
  private parseJsonResponse<T>(text: string): T | null {
    try {
      // Markdown temizle
      let cleaned = text.trim();

      // ```json ... ``` formatı
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

  /**
   * Barkoddan ürün tipini belirle
   */
  getProductType(isFood: boolean): ProductType {
    if (!isFood) {
      return ProductType.OTHER;
    }
    return ProductType.FOOD;
  }

  // ==================== MOCK ====================

  /**
   * Mock: Ürün kimliği
   */
  private mockIdentifyProduct(barcode: string): AIProductResult {
    this.logger.debug(`[MOCK] Identifying product for barcode: ${barcode}`);

    // Test barkodları
    if (barcode.startsWith('869')) {
      return {
        isFood: true,
        product: {
          brand: 'Mock Marka',
          name: `Test Ürün ${barcode.slice(-4)}`,
          quantity: '100g',
        },
      };
    }

    // Varsayılan mock
    return {
      isFood: true,
      product: {
        brand: 'Örnek Marka',
        name: 'Örnek Ürün',
        quantity: '250g',
      },
    };
  }

  /**
   * Mock: İçerik bilgisi
   */
  private mockGetProductContent(
    brand: string | null,
    name: string | null,
  ): AIContentResult {
    this.logger.debug(`[MOCK] Getting content for: ${brand} - ${name}`);

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
      model: 'mock-gemini', // Mock model
    };
  }

  /**
   * Mock: Sağlık analizi
   */
  private mockAnalyzeContent(name: string | null): AIAnalysisResult {
    this.logger.debug(`[MOCK] Analyzing content for: ${name}`);

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
