import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppLogger } from '../../common';
import {
  RateLimitKeyPrefix,
  RateLimitResult,
  RateLimitRule,
} from './rate-limit.types';

/**
 * Rate Limit Service
 *
 * Redis-backed rate limiting servisi.
 * PM2 çoklu instance için merkezi sayaç yönetimi sağlar.
 */
@Injectable()
export class RateLimitService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private isConnected = false;

  // Log throttling - aynı hatayı tekrar tekrar loglamamak için
  private lastCheckErrorLog = 0;
  private lastIncrementInfoLog = 0;
  private readonly ERROR_LOG_THROTTLE_MS = 60000; // 1 dakika

  constructor(
    private readonly configService: ConfigService,
    private readonly appLogger: AppLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>(
      'rateLimit.redis.host',
      '127.0.0.1',
    );
    const port = this.configService.get<number>('rateLimit.redis.port', 50102);

    this.redis = new Redis({
      host,
      port,
      retryStrategy: (times) => {
        if (times > 3) {
          this.appLogger.error(
            'Redis connection failed',
            new Error('Max retries exceeded after 3 attempts'),
          );
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      this.isConnected = true;
      this.appLogger.infrastructure('Redis connected', { host, port });
    });

    this.redis.on('error', (err) => {
      this.isConnected = false;
      this.appLogger.error('Redis error', err);
    });

    this.redis.on('close', () => {
      this.isConnected = false;
    });

    try {
      await this.redis.connect();
    } catch {
      // Redis bağlantı hatası error event handler'da loglandı
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.appLogger.infrastructure('Redis connection closed', {
        graceful: true,
      });
    }
  }

  /**
   * Redis bağlantı durumunu kontrol et
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Redis key oluştur
   */
  private buildKey(prefix: RateLimitKeyPrefix, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  /**
   * Tek bir limit kontrolü yap
   * @returns RateLimitResult
   */
  async check(
    prefix: RateLimitKeyPrefix,
    identifier: string,
    rule: RateLimitRule,
  ): Promise<RateLimitResult> {
    if (!this.isConnected) {
      // Throttled log - sadece 1 dk'da bir
      const now = Date.now();
      if (now - this.lastCheckErrorLog > this.ERROR_LOG_THROTTLE_MS) {
        this.appLogger.error(
          'Redis not connected, rejecting requests (fail-closed)',
          new Error('Redis unavailable'),
        );
        this.lastCheckErrorLog = now;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          error: 'Service Unavailable',
          message:
            'Rate limiting service temporarily unavailable. Please try again later.',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const key = this.buildKey(prefix, identifier);

    try {
      const current = await this.redis.get(key);
      const currentCount = current ? parseInt(current, 10) : 0;

      const ttl = await this.redis.ttl(key);
      const resetInSeconds = ttl > 0 ? ttl : rule.ttlSeconds;

      return {
        allowed: currentCount < rule.limit,
        current: currentCount,
        limit: rule.limit,
        remaining: Math.max(0, rule.limit - currentCount),
        resetInSeconds,
      };
    } catch (error) {
      this.appLogger.error(
        'Rate limit check failed',
        error instanceof Error ? error : new Error(String(error)),
      );
      // Hata durumunda reddet (fail-closed)
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          error: 'Service Unavailable',
          message:
            'Rate limiting service temporarily unavailable. Please try again later.',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Sayacı artır
   */
  async increment(
    prefix: RateLimitKeyPrefix,
    identifier: string,
    rule: RateLimitRule,
  ): Promise<number> {
    if (!this.isConnected) {
      // Throttled log - sadece 1 dk'da bir
      const now = Date.now();
      if (now - this.lastIncrementInfoLog > this.ERROR_LOG_THROTTLE_MS) {
        this.appLogger.infrastructure(
          'Redis not connected, skipping increments',
        );
        this.lastIncrementInfoLog = now;
      }
      return 0;
    }

    const key = this.buildKey(prefix, identifier);

    try {
      const pipeline = this.redis.pipeline();
      pipeline.incr(key);
      pipeline.ttl(key);

      const results = await pipeline.exec();
      if (!results) return 0;

      const [[, newCount], [, ttl]] = results as [
        [Error | null, number],
        [Error | null, number],
      ];

      // İlk artış ise TTL ayarla
      if (ttl === -1) {
        await this.redis.expire(key, rule.ttlSeconds);
      }

      return newCount;
    } catch (error) {
      this.appLogger.error(
        'Rate limit increment failed',
        error instanceof Error ? error : new Error(String(error)),
      );
      return 0;
    }
  }

  /**
   * Birden fazla limiti kontrol et (AND logic - hepsi geçmeli)
   * @throws HttpException 429 limiti aşılmışsa
   */
  async checkMultiple(
    checks: Array<{
      prefix: RateLimitKeyPrefix;
      identifier: string;
      rule: RateLimitRule;
      name: string;
    }>,
  ): Promise<void> {
    for (const check of checks) {
      const result = await this.check(
        check.prefix,
        check.identifier,
        check.rule,
      );

      if (!result.allowed) {
        this.appLogger.security('Rate limit exceeded', {
          limitName: check.name,
          identifier: check.identifier,
          current: result.current,
          limit: result.limit,
          resetIn: result.resetInSeconds,
        });

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: `Rate limit exceeded for ${check.name}. Try again in ${result.resetInSeconds} seconds.`,
            retryAfter: result.resetInSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  /**
   * Birden fazla sayacı artır (Pipeline ile optimize edildi)
   * N adet increment için N RTT yerine 2 RTT kullanır
   */
  async incrementMultiple(
    increments: Array<{
      prefix: RateLimitKeyPrefix;
      identifier: string;
      rule: RateLimitRule;
    }>,
  ): Promise<void> {
    if (!this.isConnected || increments.length === 0) {
      return;
    }

    try {
      // 1. Tüm INCR komutlarını tek pipeline ile gönder
      const incrPipeline = this.redis.pipeline();
      const keys: string[] = [];

      for (const inc of increments) {
        const key = this.buildKey(inc.prefix, inc.identifier);
        keys.push(key);
        incrPipeline.incr(key);
        incrPipeline.ttl(key);
      }

      const results = await incrPipeline.exec();
      if (!results) return;

      // 2. TTL ayarlanması gereken key'ler için ikinci pipeline
      const expirePipeline = this.redis.pipeline();
      let needsExpire = false;

      for (let i = 0; i < increments.length; i++) {
        const ttlIndex = i * 2 + 1; // Her increment için [incr, ttl] çifti var
        const [, ttl] = results[ttlIndex] as [Error | null, number];

        // İlk artış ise (TTL -1) expire ayarla
        if (ttl === -1) {
          expirePipeline.expire(keys[i], increments[i].rule.ttlSeconds);
          needsExpire = true;
        }
      }

      if (needsExpire) {
        await expirePipeline.exec();
      }
    } catch (error) {
      this.appLogger.error(
        'Rate limit incrementMultiple failed',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  // ============================================
  // Yardımcı metodlar (kolay kullanım için)
  // ============================================

  /**
   * User bazlı limit kontrolü
   */
  async checkUserLimit(
    prefix: RateLimitKeyPrefix,
    userId: string,
    rule: RateLimitRule,
    limitName: string,
  ): Promise<void> {
    await this.checkMultiple([
      { prefix, identifier: userId, rule, name: limitName },
    ]);
  }

  /**
   * User bazlı sayaç artırma
   */
  async incrementUserLimit(
    prefix: RateLimitKeyPrefix,
    userId: string,
    rule: RateLimitRule,
  ): Promise<void> {
    await this.increment(prefix, userId, rule);
  }

  /**
   * IP bazlı limit kontrolü
   */
  async checkIpLimit(
    prefix: RateLimitKeyPrefix,
    ip: string,
    rule: RateLimitRule,
    limitName: string,
  ): Promise<void> {
    await this.checkMultiple([
      { prefix, identifier: `ip:${ip}`, rule, name: limitName },
    ]);
  }

  /**
   * IP bazlı sayaç artırma
   */
  async incrementIpLimit(
    prefix: RateLimitKeyPrefix,
    ip: string,
    rule: RateLimitRule,
  ): Promise<void> {
    await this.increment(prefix, `ip:${ip}`, rule);
  }
}
