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

// Kullanılacak Gemini modelleri
const GEMINI_MODEL_FAST = 'gemini-2.5-flash'; // Prompt 1-2: Ürün tanımlama ve içerik (stabil)
const GEMINI_MODEL_SMART = 'gemini-2.5-pro'; // Prompt 3: Sağlık analizi (daha akıllı)

/**
 * Yapay Zeka entegrasyon servisi.
 * Google Gemini API ile iletişim kurarak ürün tanımlama, içerik bulma ve sağlık analizi işlemlerini yürütür.
 * Maliyet kontrolü ve API limit aşımını önlemek için kullanıcı bazlı Rate Limiting uygulanır.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string | undefined;
  private readonly isMockMode: boolean;
  private readonly genai: GoogleGenAI | null;

  // Rate limiting için son çağrı zamanları (userId -> timestamp)
  private readonly lastCallTime: Map<string, number> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.isMockMode = !this.apiKey || this.apiKey.trim() === '';

    // Gemini client oluştur (API key varsa)
    if (!this.isMockMode && this.apiKey) {
      this.genai = new GoogleGenAI({ apiKey: this.apiKey });
      this.logger.log(`AI Service initialized with models: ${GEMINI_MODEL_FAST} (fast), ${GEMINI_MODEL_SMART} (smart)`);
    } else {
      this.genai = null;
      this.logger.warn('AI Service running in MOCK MODE - no API key provided');
    }

    // Her 1 saatte eski rate limit kayıtlarını temizle (bellek sızıntısını önler)
    setInterval(
      () => {
        this.cleanupOldRateLimitEntries();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Eski rate limit kayıtlarını temizler.
   * 1 saatten eski kayıtlar silinerek bellek tasarrufu sağlanır.
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
   * API kullanım sıklığını kontrol eder.
   * Aynı kullanıcı için ardışık AI çağrıları arasında minimum bekleme süresi
   * @param userId - Kullanıcı ID (opsiyonel, yoksa global rate limit)
   * @throws TooManyRequestsException - Bekleme süresi dolmadıysa
   */
  enforceRateLimit(userId?: string): void {
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

    // Yeni çağrı zamanını kaydet
    this.lastCallTime.set(key, Date.now());
  }

  /**
   * İlk tarama sırasında kullanıcıyı bekletmemek için rate limit istisnası uygular.
   * Ancak son arama zamanını günceller, böylece hemen ardından gelecek istekler limitlenir.
   */
  private updateLastCallTime(userId?: string): void {
    const key = userId || 'global';
    this.lastCallTime.set(key, Date.now());
  }

  // ==================== PROMPT 1: ÜRÜN KİMLİĞİ ====================

  /**
   * Prompt 1: Ürün kimliği (barkoddan marka, isim, gramaj)
   * Google Search Grounding ile web araması yaparak ürün bilgisi bulur.
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
    "name": "Ürün adı",
    "quantity": "Gramaj (örn: 500g, 1L)"
  }
}`;

      // Google Search grounding ile çağrı yap
      const response = await this.genai.models.generateContent({
        model: GEMINI_MODEL_FAST,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      this.logger.debug(`Gemini identifyProduct response: ${text.substring(0, 200)}...`);

      // JSON parse et
      const result = this.parseJsonResponse<AIProductResult>(text);
      return result || this.mockIdentifyProduct(barcode);
    } catch (error) {
      this.logger.error(`Gemini identifyProduct error: ${(error as Error).message}`);
      // Hata durumunda mock veri döndür
      return this.mockIdentifyProduct(barcode);
    }
  }

  // ==================== PROMPT 2: İÇERİK BİLGİSİ ====================

  /**
   * Prompt 2: İçerik bilgisi (içindekiler, alerjenler, besin değerleri)
   * Google Search Grounding ile web araması yaparak içerik bilgisi bulur.
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
        model: GEMINI_MODEL_FAST,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      this.logger.debug(`Gemini getProductContent response: ${text.substring(0, 200)}...`);

      // JSON parse et
      const result = this.parseJsonResponse<AIContentResult>(text);
      return result || this.mockGetProductContent(brand, name);
    } catch (error) {
      this.logger.error(`Gemini getProductContent error: ${(error as Error).message}`);
      return this.mockGetProductContent(brand, name);
    }
  }

  // ==================== PROMPT 3: SAĞLIK ANALİZİ ====================

  /**
   * Prompt 3: Sağlık analizi
   * Grounding kullanılmaz, sadece model bilgisi ile analiz yapılır.
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
      const nutritionStr = nutrition ? JSON.stringify(nutrition, null, 2) : 'Bilinmiyor';

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
2. Özet 2-3 cümle olmalı.
3. Sadece JSON döndür, başka açıklama ekleme.

Yanıt formatı:
{
  "summary": "2-3 cümlelik genel değerlendirme (Türkçe)",
  "healthScore": 5,
  "warnings": ["Dikkat edilmesi gereken noktalar"],
  "positives": ["Olumlu yönler"],
  "recommendation": "Tüketim önerisi"
}`;

      // Grounding kullanılmadan çağrı yap (maliyet optimizasyonu)
      const response = await this.genai.models.generateContent({
        model: GEMINI_MODEL_SMART,
        contents: prompt,
      });

      const text = response.text || '';
      this.logger.debug(`Gemini analyzeContent response: ${text.substring(0, 200)}...`);

      // JSON parse et ve model bilgisini backend'de ekle
      const parsed = this.parseJsonResponse<Omit<AIAnalysisResult, 'model'>>(text);
      if (parsed) {
        return {
          ...parsed,
          model: GEMINI_MODEL_SMART, // Model bilgisini backend'de ekle
        };
      }
      return this.mockAnalyzeContent(name);
    } catch (error) {
      this.logger.error(`Gemini analyzeContent error: ${(error as Error).message}`);
      return this.mockAnalyzeContent(name);
    }
  }

  // ==================== YARDIMCI METOTLAR ====================

  /**
   * Gemini yanıtından JSON parse eder.
   * Yanıt markdown code block içinde olabilir, temizler.
   */
  private parseJsonResponse<T>(text: string): T | null {
    try {
      // Markdown code block temizle
      let cleaned = text.trim();
      
      // ```json ... ``` formatını temizle
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
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

  // ==================== MOCK METOTLAR ====================

  /**
   * Mock: Ürün kimliği
   */
  private mockIdentifyProduct(barcode: string): AIProductResult {
    this.logger.debug(`[MOCK] Identifying product for barcode: ${barcode}`);

    // Bazı test barkodları için farklı sonuçlar
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

    // Varsayılan mock sonuç
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
