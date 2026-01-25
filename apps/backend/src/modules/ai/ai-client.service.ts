import { GoogleGenAI, Schema } from '@google/genai';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '../../common';
import { AiConfig } from '../../config';

/**
 * AI Client Service
 * Gemini API ile iletişimi yönetir.
 * Model konfigürasyonu, API çağrıları ve hata yönetimi.
 *
 * Gemini 3 ile Structured Output (responseSchema) desteği sunar.
 */
@Injectable()
export class AiClientService {
  private readonly apiKey: string | undefined;
  private readonly isMockMode: boolean;
  private readonly genai: GoogleGenAI | null;

  private readonly modelFast: string;
  private readonly modelSmart: string;

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
    this.modelSmart = aiConfig.modelSmart;

    if (!this.isMockMode && this.apiKey) {
      // Model isimleri zorunlu (mock mode dışında)
      if (!this.modelFast || !this.modelSmart) {
        throw new Error(
          'GEMINI_MODEL_FAST ve GEMINI_MODEL_SMART env değişkenleri zorunlu! ' +
          '.env dosyasını kontrol edin. Örn: gemini-3-flash-preview',
        );
      }

      this.genai = new GoogleGenAI({ apiKey: this.apiKey });
      this.appLogger.business('AI Client Service initialized', {
        modelFast: this.modelFast,
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

  /**
   * Google Search grounding + Structured Output ile API çağrısı
   * Prompt 1 ve 2 için kullanılır
   *
   * @param prompt - Gemini'ye gönderilecek prompt
   * @param methodName - Log için method adı
   * @param responseSchema - Gemini Schema tanımı
   * @returns Schema'ya uygun typed obje
   */
  async callWithGrounding<T>(
    prompt: string,
    methodName: string,
    responseSchema: Schema,
    retryCount = 0,
  ): Promise<T> {
    if (!this.genai) {
      throw new HttpException(
        'AI servisi mock modda çalışıyor',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const response = await this.genai.models.generateContent({
        model: this.modelFast,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1, // Uydurma önlemek için düşük temperature
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const text = response.text || '';
      const finishReason = response.candidates?.[0]?.finishReason;

      if (!text.trim()) {
        // Detaylı debug için response object'i logla
        this.appLogger.infrastructure('Gemini API returned empty response', {
          method: methodName,
          model: this.modelFast,
          hasText: !!response.text,
          hasCandidates: !!response.candidates,
          candidatesLength: response.candidates?.length,
          firstCandidate: response.candidates?.[0]
            ? {
              finishReason: response.candidates[0].finishReason,
              hasContent: !!response.candidates[0].content,
              partsLength: response.candidates[0].content?.parts?.length,
            }
            : null,
          retryCount,
        });

        // RECITATION: Telif hakkı korumalı içerik tespit edildi
        if (finishReason === 'RECITATION' && retryCount === 0) {
          this.appLogger.infrastructure('RECITATION detected, retrying...', {
            method: methodName,
          });
          return this.callWithGrounding<T>(
            prompt,
            methodName,
            responseSchema,
            1,
          );
        }

        if (finishReason === 'RECITATION') {
          throw new HttpException(
            'AI telif hakkı korumalı içerik tespit ettiği için yanıt vermeyi durdurdu.',
            HttpStatus.BAD_GATEWAY,
          );
        }

        // SAFETY: Güvenlik filtreleri devreye girdi
        if (finishReason === 'SAFETY') {
          this.appLogger.infrastructure('SAFETY filter triggered', {
            method: methodName,
          });
          throw new HttpException(
            'AI güvenlik filtreleri devreye girdi. İçerik uygun değil.',
            HttpStatus.BAD_REQUEST,
          );
        }

        // MAX_TOKENS: Token limiti aşıldı
        if (finishReason === 'MAX_TOKENS') {
          this.appLogger.infrastructure('MAX_TOKENS reached', {
            method: methodName,
          });
          throw new HttpException(
            'AI yanıtı çok uzun. Lütfen tekrar deneyin.',
            HttpStatus.BAD_GATEWAY,
          );
        }

        // OTHER: Diğer sebepler
        if (finishReason === 'OTHER') {
          this.appLogger.infrastructure('Finish reason: OTHER', {
            method: methodName,
          });
          throw new HttpException(
            'AI beklenmeyen bir hatayla karşılaştı.',
            HttpStatus.BAD_GATEWAY,
          );
        }

        throw new HttpException('AI yanıtı boş döndü', HttpStatus.BAD_GATEWAY);
      }

      this.appLogger.infrastructure('Gemini API response received', {
        method: methodName,
        model: this.modelFast,
        responseLength: text.length,
        retryCount,
      });

      // Schema mode'da JSON parse et
      return this.parseJsonResponse<T>(text, methodName);
    } catch (error) {
      return this.handleAiError(error, methodName, this.modelFast);
    }
  }

  /**
   * Google Search olmadan Structured Output ile API çağrısı
   * Prompt 3 (sağlık analizi) için kullanılır
   *
   * @param prompt - Gemini'ye gönderilecek prompt
   * @param methodName - Log için method adı
   * @param responseSchema - Gemini Schema tanımı
   * @returns Schema'ya uygun typed obje
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

    try {
      const response = await this.genai.models.generateContent({
        model: this.modelSmart,
        contents: prompt,
        config: {
          temperature: 0.7, // Yaratıcı sağlık yorumları için dengeli temperature
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const text = response.text || '';
      if (!text.trim()) {
        this.appLogger.infrastructure('Gemini API returned empty response', {
          method: methodName,
          model: this.modelSmart,
        });
        throw new HttpException('AI yanıtı boş döndü', HttpStatus.BAD_GATEWAY);
      }

      this.appLogger.infrastructure('Gemini API response received', {
        method: methodName,
        model: this.modelSmart,
        responseLength: text.length,
      });

      // Schema mode'da JSON parse et
      return this.parseJsonResponse<T>(text, methodName);
    } catch (error) {
      return this.handleAiError(error, methodName, this.modelSmart);
    }
  }

  /**
   * JSON parse helper
   * Markdown code block formatını temizleyip JSON parse eder
   */
  private parseJsonResponse<T>(text: string, methodName: string): T {
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
      this.appLogger.error(
        `JSON parse error in ${methodName}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          method: methodName,
          rawTextLength: text.length,
        },
      );
      throw new HttpException('AI yanıtı işlenemedi', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Hata yönetimi - 429, rate limit, genel hatalar
   */
  private handleAiError(
    error: unknown,
    methodName: string,
    model: string,
  ): never {
    const errorMessage = (error as Error).message || 'Bilinmeyen AI hatası';
    this.appLogger.error(
      `Gemini API failed: ${methodName}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        method: methodName,
        model,
      },
    );

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
}
