import { FinishReason, GoogleGenAI, Schema } from '@google/genai';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '../../common';
import { AiConfig } from '../../config';

/**
 * Non-retryable hatalar - Fallback denenmeden direkt kullanıcıya dönülür
 * Bu hatalar altyapısal sorunlardır, backup model de aynı hatayı verir.
 */
class NonRetryableError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: HttpStatus,
    public readonly userMessage: string,
  ) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

/**
 * AI Client Service
 * Gemini API ile iletişimi yönetir.
 *
 * Fallback Sistemi (Prompt 1-2):
 * 1. Primary: modelFast + Grounding + Schema
 * 2. Fallback: modelFastBackup + Grounding (Schema yok)
 *
 * Non-Retryable Hatalar (fallback denenmez):
 * - 429 Rate Limit: API quota doldu
 * - 401/403 Auth: API key hatası
 * - 500+ Server: Gemini sunucu hatası
 * - Network: Bağlantı hatası
 *
 * @version 3.0 (Ocak 2026 - Akıllı Fallback)
 */
@Injectable()
export class AiClientService {
  private readonly apiKey: string | undefined;
  private readonly isMockMode: boolean;
  private readonly genai: GoogleGenAI | null;

  private readonly modelFast: string;
  private readonly modelFastBackup: string;
  private readonly modelSmart: string;

  // Her bir API çağrısı için timeout (ms)
  private readonly API_TIMEOUT_MS = 60000; // 60 saniye

  constructor(
    private readonly configService: ConfigService,
    private readonly appLogger: AppLogger,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.isMockMode = !this.apiKey || this.apiKey.trim() === '';

    const aiConfig = this.configService.get<AiConfig>('ai');

    if (!aiConfig) {
      throw new Error('AI Config not found. Please check ai.config.ts');
    }

    this.modelFast = aiConfig.modelFast;
    this.modelFastBackup = aiConfig.modelFastBackup;
    this.modelSmart = aiConfig.modelSmart;

    if (!this.isMockMode && this.apiKey) {
      if (!this.modelFast || !this.modelFastBackup || !this.modelSmart) {
        throw new Error(
          'GEMINI_MODEL_FAST, GEMINI_MODEL_FAST_BACKUP ve GEMINI_MODEL_SMART env değişkenleri zorunlu! ' +
            '.env dosyasını kontrol edin.',
        );
      }

      this.genai = new GoogleGenAI({ apiKey: this.apiKey });
      this.appLogger.business('AI Client Service initialized', {
        modelFast: this.modelFast,
        modelFastBackup: this.modelFastBackup,
        modelSmart: this.modelSmart,
      });
    } else {
      this.genai = null;
      this.appLogger.infrastructure(
        'AI Client Service running in MOCK MODE - no API key provided',
      );
    }
  }

  /**
   * Mock mode kontrolü
   */
  isInMockMode(): boolean {
    return this.isMockMode;
  }

  /**
   * Fast model adını döndürür (Prompt 1-2 için)
   */
  getModelFast(): string {
    return this.modelFast;
  }

  /**
   * Smart model adını döndürür (Prompt 3 için)
   */
  getModelSmart(): string {
    return this.modelSmart;
  }

  // ========== PROMPT 1-2: FALLBACK SİSTEMİ ==========

  /**
   * Google Search grounding + Fallback ile API çağrısı
   * Prompt 1 ve 2 için kullanılır
   *
   * Akış:
   * 1. Primary: modelFast + Grounding + Schema → başarılıysa dön
   * 2. Non-retryable hata → direkt kullanıcıya dön
   * 3. Retryable hata → modelFastBackup + Grounding (Schema yok) → dene
   * 4. Backup da hata → kullanıcıya dön
   */
  async callWithGroundingAndFallback<T>(
    promptV1: string,
    promptV2: string,
    methodName: string,
    responseSchema: Schema,
  ): Promise<T> {
    if (!this.genai) {
      throw new HttpException(
        'AI servisi mock modda çalışıyor',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // ===== PRIMARY: modelFast + Grounding + Schema =====
    try {
      return await this.callPrimary<T>(promptV1, methodName, responseSchema);
    } catch (primaryError) {
      // Non-retryable hata mı kontrol et
      if (primaryError instanceof NonRetryableError) {
        this.appLogger.error(
          `Non-retryable error in ${methodName}, skipping fallback`,
          primaryError,
          {
            method: methodName,
            model: this.modelFast,
            httpStatus: primaryError.httpStatus,
          },
        );
        throw new HttpException(
          primaryError.userMessage,
          primaryError.httpStatus,
        );
      }

      // Retryable hata - fallback'e geç
      this.appLogger.infrastructure('Primary model failed, trying fallback', {
        method: methodName,
        primaryModel: this.modelFast,
        backupModel: this.modelFastBackup,
        error:
          primaryError instanceof Error
            ? primaryError.message
            : String(primaryError),
      });
    }

    // ===== FALLBACK: modelFastBackup + Grounding (Schema yok) =====
    try {
      const result = await this.callFallback<T>(promptV2, methodName);
      this.appLogger.business('Fallback model succeeded', {
        method: methodName,
        model: this.modelFastBackup,
      });
      return result;
    } catch (fallbackError) {
      // Non-retryable hata
      if (fallbackError instanceof NonRetryableError) {
        throw new HttpException(
          fallbackError.userMessage,
          fallbackError.httpStatus,
        );
      }

      // Her iki model de başarısız
      this.appLogger.error(
        `Both primary and fallback failed: ${methodName}`,
        fallbackError instanceof Error
          ? fallbackError
          : new Error(String(fallbackError)),
        {
          method: methodName,
          primaryModel: this.modelFast,
          backupModel: this.modelFastBackup,
        },
      );

      if (fallbackError instanceof HttpException) {
        throw fallbackError;
      }

      throw new HttpException(
        'AI servisi geçici olarak kullanılamıyor',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Primary API çağrısı: modelFast + Grounding + Schema
   */
  private async callPrimary<T>(
    prompt: string,
    methodName: string,
    responseSchema: Schema,
  ): Promise<T> {
    let response;
    try {
      response = await this.withTimeout(
        this.genai!.models.generateContent({
          model: this.modelFast,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema,
          },
        }),
        methodName,
        this.modelFast,
      );
    } catch (error) {
      // API çağrısı sırasında hata - non-retryable mi kontrol et
      this.checkNonRetryableError(error, methodName, this.modelFast);
      throw error; // Retryable hata, üst katmana fırlat
    }

    const text = response.text || '';
    const finishReason = response.candidates?.[0]?.finishReason;

    if (!text.trim()) {
      this.appLogger.infrastructure('Primary model returned empty response', {
        method: methodName,
        model: this.modelFast,
        finishReason,
      });

      if (finishReason === FinishReason.RECITATION) {
        throw new Error('RECITATION: Telif hakkı korumalı içerik');
      }

      if (finishReason === FinishReason.SAFETY) {
        throw new Error('SAFETY: Güvenlik filtreleri devreye girdi');
      }

      throw new Error('Empty response from primary model');
    }

    this.appLogger.infrastructure('Primary model response received', {
      method: methodName,
      model: this.modelFast,
      responseLength: text.length,
    });

    return this.parseJsonResponse<T>(text, methodName);
  }

  /**
   * Fallback API çağrısı: modelFastBackup + Grounding (Schema yok)
   */
  private async callFallback<T>(
    prompt: string,
    methodName: string,
  ): Promise<T> {
    let response;
    try {
      response = await this.withTimeout(
        this.genai!.models.generateContent({
          model: this.modelFastBackup,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.2,
          },
        }),
        methodName,
        this.modelFastBackup,
      );
    } catch (error) {
      this.checkNonRetryableError(error, methodName, this.modelFastBackup);
      throw error;
    }

    const text = response.text || '';
    const finishReason = response.candidates?.[0]?.finishReason;

    if (!text.trim()) {
      this.appLogger.infrastructure('Fallback model returned empty response', {
        method: methodName,
        model: this.modelFastBackup,
        finishReason,
      });

      if (finishReason === FinishReason.RECITATION) {
        throw new HttpException(
          'AI telif hakkı korumalı içerik tespit etti',
          HttpStatus.BAD_GATEWAY,
        );
      }

      if (finishReason === FinishReason.SAFETY) {
        throw new HttpException(
          'AI güvenlik filtreleri devreye girdi',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException('AI yanıtı boş döndü', HttpStatus.BAD_GATEWAY);
    }

    this.appLogger.infrastructure('Fallback model response received', {
      method: methodName,
      model: this.modelFastBackup,
      responseLength: text.length,
    });

    return this.parseJsonResponse<T>(text, methodName);
  }

  // ========== PROMPT 3: SCHEMA ONLY ==========

  /**
   * Google Search olmadan Structured Output ile API çağrısı
   * Prompt 3 (sağlık analizi) için kullanılır - Fallback yok
   */
  async callWithoutGrounding<T>(
    prompt: string,
    methodName: string,
    responseSchema: Schema,
  ): Promise<T> {
    if (!this.genai) {
      throw new HttpException(
        'AI servisi mock modda çalışıyor',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    let response;
    try {
      response = await this.withTimeout(
        this.genai.models.generateContent({
          model: this.modelSmart,
          contents: prompt,
          config: {
            temperature: 1.0,
            responseMimeType: 'application/json',
            responseSchema,
          },
        }),
        methodName,
        this.modelSmart,
      );
    } catch (error) {
      this.checkNonRetryableError(error, methodName, this.modelSmart);
      // Retryable hatalar için genel hata mesajı
      this.appLogger.error(
        `Gemini API error: ${methodName}`,
        error instanceof Error ? error : new Error(String(error)),
        { method: methodName, model: this.modelSmart },
      );
      throw new HttpException(
        'AI servisi geçici olarak kullanılamıyor',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const text = response.text || '';
    const finishReason = response.candidates?.[0]?.finishReason;

    if (!text.trim()) {
      this.appLogger.infrastructure('Smart model returned empty response', {
        method: methodName,
        model: this.modelSmart,
        finishReason,
      });

      if (finishReason === FinishReason.RECITATION) {
        throw new HttpException(
          'AI telif hakkı korumalı içerik tespit etti',
          HttpStatus.BAD_GATEWAY,
        );
      }

      if (finishReason === FinishReason.SAFETY) {
        throw new HttpException(
          'AI güvenlik filtreleri devreye girdi',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException('AI yanıtı boş döndü', HttpStatus.BAD_GATEWAY);
    }

    this.appLogger.infrastructure('Smart model response received', {
      method: methodName,
      model: this.modelSmart,
      responseLength: text.length,
    });

    return this.parseJsonResponse<T>(text, methodName);
  }

  // ========== HELPER METHODS ==========

  /**
   * Non-retryable hata kontrolü
   * Bu hatalar altyapısal sorunlardır, fallback denenmez.
   */
  private checkNonRetryableError(
    error: unknown,
    methodName: string,
    model: string,
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 429 Rate Limit / Quota Exceeded
    if (
      errorMessage.includes('429') ||
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('quota')
    ) {
      this.appLogger.error(
        `Rate limit exceeded: ${methodName}`,
        error as Error,
        {
          method: methodName,
          model,
          errorType: 'RATE_LIMIT',
        },
      );
      throw new NonRetryableError(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
        'AI servisi şu an yoğun, lütfen biraz sonra tekrar deneyin',
      );
    }

    // 401/403 Authentication Errors
    if (
      errorMessage.includes('401') ||
      errorMessage.includes('403') ||
      errorMessage.includes('API_KEY') ||
      errorMessage.includes('PERMISSION_DENIED') ||
      errorMessage.includes('UNAUTHENTICATED')
    ) {
      this.appLogger.error(
        `Authentication error: ${methodName}`,
        error as Error,
        {
          method: methodName,
          model,
          errorType: 'AUTH_ERROR',
        },
      );
      throw new NonRetryableError(
        'Authentication failed',
        HttpStatus.SERVICE_UNAVAILABLE,
        'AI servisi yapılandırma hatası',
      );
    }

    // 500+ Server Errors
    if (
      errorMessage.includes('500') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('504') ||
      errorMessage.includes('INTERNAL') ||
      errorMessage.includes('UNAVAILABLE')
    ) {
      this.appLogger.error(`Server error: ${methodName}`, error as Error, {
        method: methodName,
        model,
        errorType: 'SERVER_ERROR',
      });
      throw new NonRetryableError(
        'Server error',
        HttpStatus.SERVICE_UNAVAILABLE,
        'AI servisi geçici olarak kullanılamıyor',
      );
    }

    // Network Errors
    if (
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('network') ||
      errorMessage.includes('fetch failed')
    ) {
      this.appLogger.error(`Network error: ${methodName}`, error as Error, {
        method: methodName,
        model,
        errorType: 'NETWORK_ERROR',
      });
      throw new NonRetryableError(
        'Network error',
        HttpStatus.SERVICE_UNAVAILABLE,
        'AI servisine bağlanılamadı',
      );
    }

    // Diğer hatalar retryable olarak kabul edilir (fallback denenir)
  }

  /**
   * API çağrısı için timeout wrapper
   * 60 saniyeyi aşan çağrıları iptal eder
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    methodName: string,
    model: string,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `TIMEOUT: API çağrısı ${this.API_TIMEOUT_MS / 1000} saniyeyi aştı`,
          ),
        );
      }, this.API_TIMEOUT_MS);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('TIMEOUT')) {
        this.appLogger.error(`API timeout: ${methodName}`, error as Error, {
          method: methodName,
          model,
          timeoutMs: this.API_TIMEOUT_MS,
          errorType: 'TIMEOUT',
        });
        throw new HttpException(
          'AI servisi yanıt vermedi, lütfen tekrar deneyin',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      throw error;
    }
  }

  /**
   * JSON parse helper
   */
  private parseJsonResponse<T>(text: string, methodName: string): T {
    try {
      let cleaned = text.trim();

      if (cleaned.startsWith('```')) {
        cleaned = cleaned
          .replace(/^```(?:json)?\n?/, '')
          .replace(/\n?```$/, '');
      }

      return JSON.parse(cleaned) as T;
    } catch (error) {
      this.appLogger.error(
        `JSON parse error in ${methodName}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          method: methodName,
          rawTextLength: text.length,
          rawTextPreview: text.substring(0, 100),
        },
      );
      throw new HttpException('AI yanıtı işlenemedi', HttpStatus.BAD_GATEWAY);
    }
  }
}
