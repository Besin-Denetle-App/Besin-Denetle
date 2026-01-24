import { VoteType } from '@besin-denetle/shared';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource, EntityManager } from 'typeorm';
import { AppLogger } from '../../common';

/**
 * Raw query sonuçundan etkilenen satır sayısı
 */
function extractAffectedRows(result: unknown): number {
  if (Array.isArray(result) && typeof result[1] === 'number') {
    return result[1];
  }
  return 0;
}

/** Skor hesaplama sonucu */
interface RecalculationResult {
  products: number;
  contents: number;
  analyses: number;
  duration: number;
}

/** Her gece 02:00'de tüm skorları yeniden hesaplar */
@Injectable()
export class ScoreRecalculationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly appLogger: AppLogger,
  ) {}

  @Cron('0 2 * * *', {
    // Her gece 02:00 (TR)
    name: 'score-recalculation',
    timeZone: 'Europe/Istanbul',
  })
  async handleScoreRecalculation(): Promise<void> {
    this.appLogger.business('Score recalculation cron started', {
      job: 'score-recalculation',
    });

    try {
      const result = await this.recalculateAllScores();
      this.appLogger.business('Score recalculation completed', {
        job: 'score-recalculation',
        products: result.products,
        contents: result.contents,
        analyses: result.analyses,
        duration: result.duration,
      });
    } catch (error) {
      this.appLogger.error(
        'Score recalculation failed',
        error instanceof Error ? error : new Error(String(error)),
        { job: 'score-recalculation' },
      );
    }
  }

  /**
   * Manuel hesaplama triggeri
   */
  async triggerManualRecalculation(): Promise<RecalculationResult> {
    this.appLogger.business('Manual score recalculation triggered', {
      job: 'manual-recalculation',
    });

    const result = await this.recalculateAllScores();
    this.appLogger.business('Manual recalculation completed', {
      job: 'manual-recalculation',
      duration: result.duration,
    });

    return result;
  }

  /**
   * Tüm skorları hesapla (tek transaction)
   */
  private async recalculateAllScores(): Promise<RecalculationResult> {
    const startTime = Date.now();

    let products = 0;
    let contents = 0;
    let analyses = 0;

    await this.dataSource.transaction(async (manager) => {
      products = await this.recalculateProductScores(manager);
      contents = await this.recalculateContentScores(manager);
      analyses = await this.recalculateAnalysisScores(manager);
    });

    return {
      products,
      contents,
      analyses,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Product skorlarını hesapla
   */
  private async recalculateProductScores(
    manager: EntityManager,
  ): Promise<number> {
    const result: unknown = await manager.query(`
      UPDATE product p
      SET 
        score = COALESCE((
          SELECT SUM(CASE WHEN v.vote_type = '${VoteType.UP}' THEN 1 ELSE -1 END)
          FROM vote v WHERE v.product_id = p.id
        ), 0),
        vote_count = COALESCE((
          SELECT COUNT(*) FROM vote v WHERE v.product_id = p.id
        ), 0)
      WHERE EXISTS (SELECT 1 FROM vote v WHERE v.product_id = p.id)
         OR p.score != 0 
         OR p.vote_count != 0
    `);
    return extractAffectedRows(result);
  }

  /**
   * Content skorlarını hesapla
   */
  private async recalculateContentScores(
    manager: EntityManager,
  ): Promise<number> {
    const result: unknown = await manager.query(`
      UPDATE product_content pc
      SET 
        score = COALESCE((
          SELECT SUM(CASE WHEN v.vote_type = '${VoteType.UP}' THEN 1 ELSE -1 END)
          FROM vote v WHERE v.product_content_id = pc.id
        ), 0),
        vote_count = COALESCE((
          SELECT COUNT(*) FROM vote v WHERE v.product_content_id = pc.id
        ), 0)
      WHERE EXISTS (SELECT 1 FROM vote v WHERE v.product_content_id = pc.id)
         OR pc.score != 0 
         OR pc.vote_count != 0
    `);
    return extractAffectedRows(result);
  }

  /**
   * Analysis skorlarını hesapla
   */
  private async recalculateAnalysisScores(
    manager: EntityManager,
  ): Promise<number> {
    const result: unknown = await manager.query(`
      UPDATE content_analysis ca
      SET 
        score = COALESCE((
          SELECT SUM(CASE WHEN v.vote_type = '${VoteType.UP}' THEN 1 ELSE -1 END)
          FROM vote v WHERE v.content_analysis_id = ca.id
        ), 0),
        vote_count = COALESCE((
          SELECT COUNT(*) FROM vote v WHERE v.content_analysis_id = ca.id
        ), 0)
      WHERE EXISTS (SELECT 1 FROM vote v WHERE v.content_analysis_id = ca.id)
         OR ca.score != 0 
         OR ca.vote_count != 0
    `);
    return extractAffectedRows(result);
  }
}
