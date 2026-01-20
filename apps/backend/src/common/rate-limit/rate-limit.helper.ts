import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RateLimitEndpointConfig,
  RateLimitGlobalConfig,
  RateLimitKeyPrefix,
  RateLimitPoolConfig,
  RateLimitService,
} from './index';

/**
 * Rate Limit Helper
 *
 * Controller'lardaki rate limit işlemlerini basitleştirir.
 * Check ve increment işlemlerini endpoint bazlı metodlara çevirir.
 */
@Injectable()
export class RateLimitHelper {
  private poolConfig: RateLimitPoolConfig;
  private globalConfig: RateLimitGlobalConfig;
  private endpointConfig: RateLimitEndpointConfig;

  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
  ) {
    this.poolConfig =
      this.configService.get<RateLimitPoolConfig>('rateLimit.pool')!;
    this.globalConfig =
      this.configService.get<RateLimitGlobalConfig>('rateLimit.global')!;
    this.endpointConfig =
      this.configService.get<RateLimitEndpointConfig>('rateLimit.endpoint')!;
  }

  // ============================================
  // SCAN Endpoint'leri (/products/scan, /products/reject)
  // ============================================

  /**
   * Scan için tüm limitleri kontrol et (DB + AI + Global)
   */
  async checkScan(userId: string): Promise<void> {
    await this.rateLimitService.checkMultiple([
      {
        prefix: RateLimitKeyPrefix.SCAN_DB,
        identifier: userId,
        rule: this.poolConfig.scan_db,
        name: 'scan_db',
      },
      {
        prefix: RateLimitKeyPrefix.SCAN_AI,
        identifier: userId,
        rule: this.poolConfig.scan_ai,
        name: 'scan_ai',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_db_hour,
        name: 'total_db_hour',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_DAY,
        identifier: userId,
        rule: this.globalConfig.total_db_day,
        name: 'total_db_day',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_ai_hour,
        name: 'total_ai_hour',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_DAY,
        identifier: userId,
        rule: this.globalConfig.total_ai_day,
        name: 'total_ai_day',
      },
    ]);
  }

  /**
   * Scan DB HIT sonrası sayaçları artır
   */
  async incrementScanDb(userId: string): Promise<void> {
    await this.rateLimitService.incrementMultiple([
      {
        prefix: RateLimitKeyPrefix.SCAN_DB,
        identifier: userId,
        rule: this.poolConfig.scan_db,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_db_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_DAY,
        identifier: userId,
        rule: this.globalConfig.total_db_day,
      },
    ]);
  }

  /**
   * Scan AI HIT sonrası sayaçları artır
   */
  async incrementScanAi(userId: string): Promise<void> {
    await this.rateLimitService.incrementMultiple([
      {
        prefix: RateLimitKeyPrefix.SCAN_AI,
        identifier: userId,
        rule: this.poolConfig.scan_ai,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_ai_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_DAY,
        identifier: userId,
        rule: this.globalConfig.total_ai_day,
      },
    ]);
  }

  // ============================================
  // SCAN REJECT Endpoint'i (/products/reject)
  // ============================================

  /**
   * Scan Reject için tüm limitleri kontrol et
   */
  async checkScanReject(userId: string): Promise<void> {
    await this.rateLimitService.checkMultiple([
      {
        prefix: RateLimitKeyPrefix.SCAN_REJECT,
        identifier: userId,
        rule: this.endpointConfig.scan_reject,
        name: 'scan_reject',
      },
      {
        prefix: RateLimitKeyPrefix.SCAN_DB,
        identifier: userId,
        rule: this.poolConfig.scan_db,
        name: 'scan_db',
      },
      {
        prefix: RateLimitKeyPrefix.SCAN_AI,
        identifier: userId,
        rule: this.poolConfig.scan_ai,
        name: 'scan_ai',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_DAY,
        identifier: userId,
        rule: this.globalConfig.total_db_day,
        name: 'total_db_day',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_DAY,
        identifier: userId,
        rule: this.globalConfig.total_ai_day,
        name: 'total_ai_day',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_reject_hour,
        name: 'total_reject_hour',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_DAY,
        identifier: userId,
        rule: this.globalConfig.total_reject_day,
        name: 'total_reject_day',
      },
    ]);
  }

  /**
   * Scan Reject endpoint limitini artır (hemen)
   */
  async incrementScanRejectEndpoint(userId: string): Promise<void> {
    await this.rateLimitService.increment(
      RateLimitKeyPrefix.SCAN_REJECT,
      userId,
      this.endpointConfig.scan_reject,
    );
  }

  /**
   * Scan Reject DB HIT sonrası sayaçları artır
   */
  async incrementScanRejectDb(userId: string): Promise<void> {
    await this.rateLimitService.incrementMultiple([
      {
        prefix: RateLimitKeyPrefix.SCAN_DB,
        identifier: userId,
        rule: this.poolConfig.scan_db,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_db_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_DAY,
        identifier: userId,
        rule: this.globalConfig.total_db_day,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_reject_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_DAY,
        identifier: userId,
        rule: this.globalConfig.total_reject_day,
      },
    ]);
  }

  /**
   * Scan Reject AI HIT sonrası sayaçları artır
   */
  async incrementScanRejectAi(userId: string): Promise<void> {
    await this.rateLimitService.incrementMultiple([
      {
        prefix: RateLimitKeyPrefix.SCAN_AI,
        identifier: userId,
        rule: this.poolConfig.scan_ai,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_ai_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_DAY,
        identifier: userId,
        rule: this.globalConfig.total_ai_day,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_reject_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_DAY,
        identifier: userId,
        rule: this.globalConfig.total_reject_day,
      },
    ]);
  }

  // ============================================
  // CONTENT Endpoint'leri (/products/confirm, /content/reject)
  // ============================================

  /**
   * Content için tüm limitleri kontrol et
   */
  async checkContent(userId: string): Promise<void> {
    await this.rateLimitService.checkMultiple([
      {
        prefix: RateLimitKeyPrefix.CONTENT_DB,
        identifier: userId,
        rule: this.poolConfig.content_db,
        name: 'content_db',
      },
      {
        prefix: RateLimitKeyPrefix.CONTENT_AI,
        identifier: userId,
        rule: this.poolConfig.content_ai,
        name: 'content_ai',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_db_hour,
        name: 'total_db_hour',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_DAY,
        identifier: userId,
        rule: this.globalConfig.total_db_day,
        name: 'total_db_day',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_ai_hour,
        name: 'total_ai_hour',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_DAY,
        identifier: userId,
        rule: this.globalConfig.total_ai_day,
        name: 'total_ai_day',
      },
    ]);
  }

  /**
   * Content DB HIT sonrası sayaçları artır
   */
  async incrementContentDb(userId: string): Promise<void> {
    await this.rateLimitService.incrementMultiple([
      {
        prefix: RateLimitKeyPrefix.CONTENT_DB,
        identifier: userId,
        rule: this.poolConfig.content_db,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_db_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_DAY,
        identifier: userId,
        rule: this.globalConfig.total_db_day,
      },
    ]);
  }

  /**
   * Content AI HIT sonrası sayaçları artır
   */
  async incrementContentAi(userId: string): Promise<void> {
    await this.rateLimitService.incrementMultiple([
      {
        prefix: RateLimitKeyPrefix.CONTENT_AI,
        identifier: userId,
        rule: this.poolConfig.content_ai,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_ai_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_DAY,
        identifier: userId,
        rule: this.globalConfig.total_ai_day,
      },
    ]);
  }

  // ============================================
  // CONTENT REJECT Endpoint'i (/content/reject)
  // ============================================

  /**
   * Content Reject için tüm limitleri kontrol et
   */
  async checkContentReject(userId: string): Promise<void> {
    await this.rateLimitService.checkMultiple([
      {
        prefix: RateLimitKeyPrefix.CONTENT_REJECT,
        identifier: userId,
        rule: this.endpointConfig.content_reject,
        name: 'content_reject',
      },
      {
        prefix: RateLimitKeyPrefix.CONTENT_DB,
        identifier: userId,
        rule: this.poolConfig.content_db,
        name: 'content_db',
      },
      {
        prefix: RateLimitKeyPrefix.CONTENT_AI,
        identifier: userId,
        rule: this.poolConfig.content_ai,
        name: 'content_ai',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_DAY,
        identifier: userId,
        rule: this.globalConfig.total_db_day,
        name: 'total_db_day',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_DAY,
        identifier: userId,
        rule: this.globalConfig.total_ai_day,
        name: 'total_ai_day',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_reject_hour,
        name: 'total_reject_hour',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_DAY,
        identifier: userId,
        rule: this.globalConfig.total_reject_day,
        name: 'total_reject_day',
      },
    ]);
  }

  /**
   * Content Reject endpoint limitini artır (hemen)
   */
  async incrementContentRejectEndpoint(userId: string): Promise<void> {
    await this.rateLimitService.increment(
      RateLimitKeyPrefix.CONTENT_REJECT,
      userId,
      this.endpointConfig.content_reject,
    );
  }

  /**
   * Content Reject DB HIT sonrası sayaçları artır
   */
  async incrementContentRejectDb(userId: string): Promise<void> {
    await this.rateLimitService.incrementMultiple([
      {
        prefix: RateLimitKeyPrefix.CONTENT_DB,
        identifier: userId,
        rule: this.poolConfig.content_db,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_db_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_DAY,
        identifier: userId,
        rule: this.globalConfig.total_db_day,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_reject_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_DAY,
        identifier: userId,
        rule: this.globalConfig.total_reject_day,
      },
    ]);
  }

  /**
   * Content Reject AI HIT sonrası sayaçları artır
   */
  async incrementContentRejectAi(userId: string): Promise<void> {
    await this.rateLimitService.incrementMultiple([
      {
        prefix: RateLimitKeyPrefix.CONTENT_AI,
        identifier: userId,
        rule: this.poolConfig.content_ai,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_ai_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_DAY,
        identifier: userId,
        rule: this.globalConfig.total_ai_day,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_reject_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_DAY,
        identifier: userId,
        rule: this.globalConfig.total_reject_day,
      },
    ]);
  }

  // ============================================
  // ANALYSIS Endpoint'leri (/analysis/generate, /analysis/reject)
  // ============================================

  /**
   * Analysis için tüm limitleri kontrol et
   */
  async checkAnalysis(userId: string): Promise<void> {
    await this.rateLimitService.checkMultiple([
      {
        prefix: RateLimitKeyPrefix.ANALYSIS_DB,
        identifier: userId,
        rule: this.poolConfig.analysis_db,
        name: 'analysis_db',
      },
      {
        prefix: RateLimitKeyPrefix.ANALYSIS_AI,
        identifier: userId,
        rule: this.poolConfig.analysis_ai,
        name: 'analysis_ai',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_db_hour,
        name: 'total_db_hour',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_DAY,
        identifier: userId,
        rule: this.globalConfig.total_db_day,
        name: 'total_db_day',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_ai_hour,
        name: 'total_ai_hour',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_DAY,
        identifier: userId,
        rule: this.globalConfig.total_ai_day,
        name: 'total_ai_day',
      },
    ]);
  }

  /**
   * Analysis DB HIT sonrası sayaçları artır
   */
  async incrementAnalysisDb(userId: string): Promise<void> {
    await this.rateLimitService.incrementMultiple([
      {
        prefix: RateLimitKeyPrefix.ANALYSIS_DB,
        identifier: userId,
        rule: this.poolConfig.analysis_db,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_db_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_DAY,
        identifier: userId,
        rule: this.globalConfig.total_db_day,
      },
    ]);
  }

  /**
   * Analysis AI HIT sonrası sayaçları artır
   */
  async incrementAnalysisAi(userId: string): Promise<void> {
    await this.rateLimitService.incrementMultiple([
      {
        prefix: RateLimitKeyPrefix.ANALYSIS_AI,
        identifier: userId,
        rule: this.poolConfig.analysis_ai,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_ai_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_DAY,
        identifier: userId,
        rule: this.globalConfig.total_ai_day,
      },
    ]);
  }

  // ============================================
  // ANALYSIS REJECT Endpoint'i (/analysis/reject)
  // ============================================

  /**
   * Analysis Reject için tüm limitleri kontrol et
   */
  async checkAnalysisReject(userId: string): Promise<void> {
    await this.rateLimitService.checkMultiple([
      {
        prefix: RateLimitKeyPrefix.ANALYSIS_REJECT,
        identifier: userId,
        rule: this.endpointConfig.analysis_reject,
        name: 'analysis_reject',
      },
      {
        prefix: RateLimitKeyPrefix.ANALYSIS_DB,
        identifier: userId,
        rule: this.poolConfig.analysis_db,
        name: 'analysis_db',
      },
      {
        prefix: RateLimitKeyPrefix.ANALYSIS_AI,
        identifier: userId,
        rule: this.poolConfig.analysis_ai,
        name: 'analysis_ai',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_DAY,
        identifier: userId,
        rule: this.globalConfig.total_db_day,
        name: 'total_db_day',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_DAY,
        identifier: userId,
        rule: this.globalConfig.total_ai_day,
        name: 'total_ai_day',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_reject_hour,
        name: 'total_reject_hour',
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_DAY,
        identifier: userId,
        rule: this.globalConfig.total_reject_day,
        name: 'total_reject_day',
      },
    ]);
  }

  /**
   * Analysis Reject endpoint limitini artır (hemen)
   */
  async incrementAnalysisRejectEndpoint(userId: string): Promise<void> {
    await this.rateLimitService.increment(
      RateLimitKeyPrefix.ANALYSIS_REJECT,
      userId,
      this.endpointConfig.analysis_reject,
    );
  }

  /**
   * Analysis Reject DB HIT sonrası sayaçları artır
   */
  async incrementAnalysisRejectDb(userId: string): Promise<void> {
    await this.rateLimitService.incrementMultiple([
      {
        prefix: RateLimitKeyPrefix.ANALYSIS_DB,
        identifier: userId,
        rule: this.poolConfig.analysis_db,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_db_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_DB_DAY,
        identifier: userId,
        rule: this.globalConfig.total_db_day,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_reject_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_DAY,
        identifier: userId,
        rule: this.globalConfig.total_reject_day,
      },
    ]);
  }

  /**
   * Analysis Reject AI HIT sonrası sayaçları artır
   */
  async incrementAnalysisRejectAi(userId: string): Promise<void> {
    await this.rateLimitService.incrementMultiple([
      {
        prefix: RateLimitKeyPrefix.ANALYSIS_AI,
        identifier: userId,
        rule: this.poolConfig.analysis_ai,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_ai_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_AI_DAY,
        identifier: userId,
        rule: this.globalConfig.total_ai_day,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_HOUR,
        identifier: userId,
        rule: this.globalConfig.total_reject_hour,
      },
      {
        prefix: RateLimitKeyPrefix.TOTAL_REJECT_DAY,
        identifier: userId,
        rule: this.globalConfig.total_reject_day,
      },
    ]);
  }

  // ============================================
  // FLAG Endpoint'i (/barcodes/flag)
  // ============================================

  /**
   * Flag limiti kontrol et
   */
  async checkFlag(userId: string): Promise<void> {
    await this.rateLimitService.checkUserLimit(
      RateLimitKeyPrefix.FLAG,
      userId,
      this.endpointConfig.flag,
      'flag',
    );
  }

  /**
   * Flag limiti artır
   */
  async incrementFlag(userId: string): Promise<void> {
    await this.rateLimitService.incrementUserLimit(
      RateLimitKeyPrefix.FLAG,
      userId,
      this.endpointConfig.flag,
    );
  }
}
