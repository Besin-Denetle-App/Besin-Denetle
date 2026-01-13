import {
  AI_RATE_LIMIT_MS,
  AIAnalysisResult,
  AIContentResult,
  AIProductResult,
  ProductType,
} from '@besin-denetle/shared';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

  // Rate limiting için son çağrı zamanları (userId -> timestamp)
  private readonly lastCallTime: Map<string, number> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.isMockMode = !this.apiKey || this.apiKey.trim() === '';

    if (this.isMockMode) {
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
   * Aynı kullanıcı için ardışık AI çağrıları arasında minimum 10 saniye bekleme
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

  /**
   * Prompt 1: Ürün kimliği (barkoddan marka, isim, gramaj)
   * @param barcode - Barkod numarası
   * @param userId - Kullanıcı ID (opsiyonel, rate limit için)
   * @param enforceLimit - Rate limit uygulansın mı (ilk taramada false)
   */
  identifyProduct(
    barcode: string,
    userId?: string,
    enforceLimit: boolean = false,
  ): Promise<AIProductResult> {
    if (enforceLimit) {
      this.enforceRateLimit(userId);
    } else {
      this.updateLastCallTime(userId);
    }

    if (this.isMockMode) {
      return Promise.resolve(this.mockIdentifyProduct(barcode));
    }

    // TODO: Gerçek Gemini API çağrısı
    // Search Grounding ile web araması yapılacak
    return Promise.resolve(this.mockIdentifyProduct(barcode));
  }

  /**
   * Prompt 2: İçerik bilgisi (içindekiler, alerjenler, besin değerleri)
   * @param userId - Kullanıcı ID (opsiyonel, rate limit için)
   * @param enforceLimit - Rate limit uygulansın mı
   */
  getProductContent(
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

    if (this.isMockMode) {
      return Promise.resolve(this.mockGetProductContent(brand, name));
    }

    // TODO: Gerçek Gemini API çağrısı
    return Promise.resolve(this.mockGetProductContent(brand, name));
  }

  /**
   * Prompt 3: Sağlık analizi
   * @param userId - Kullanıcı ID (opsiyonel, rate limit için)
   * @param enforceLimit - Rate limit uygulansın mı
   */
  analyzeContent(
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

    if (this.isMockMode) {
      return Promise.resolve(this.mockAnalyzeContent(name));
    }

    // TODO: Gerçek Gemini API çağrısı
    return Promise.resolve(this.mockAnalyzeContent(name));
  }

  // ==================== MOCK METHODS ====================

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

  /**
   * Barkoddan ürün tipini belirle (AI veya mock)
   */
  getProductType(isFood: boolean): ProductType {
    if (!isFood) {
      return ProductType.OTHER;
    }
    return ProductType.FOOD; // Varsayılan olarak yiyecek
  }
}
