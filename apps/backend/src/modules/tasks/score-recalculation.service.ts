import { VoteType } from '@besin-denetle/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource, EntityManager } from 'typeorm';

/** Skor hesaplama sonucu */
interface RecalculationResult {
  products: number;
  contents: number;
  analyses: number;
  duration: number;
}

/**
 * Skorları yeniden hesaplayan zamanlanmış servis.
 * Her gece 02:00'de çalışır ve tüm skorları güncelleyerek
 * silinmiş oylardan kaynaklanan tutarsızlıkları düzeltir.
 *
 * Performans: SQL subquery kullanarak tek sorguda güncelleme yapar.
 * Bu sayede N+1 query problemi önlenir.
 */
@Injectable()
export class ScoreRecalculationService {
  private readonly logger = new Logger(ScoreRecalculationService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Her gece saat 02:00'de çalışır (Türkiye saati).
   */
  @Cron('0 2 * * *', {
    name: 'score-recalculation',
    timeZone: 'Europe/Istanbul',
  })
  async handleScoreRecalculation(): Promise<void> {
    this.logger.log('🔄 Skor yeniden hesaplama başlatıldı...');

    try {
      const result = await this.recalculateAllScores();
      this.logger.log(
        `✅ Skor yeniden hesaplama tamamlandı! ` +
          `Product: ${result.products}, Content: ${result.contents}, Analysis: ${result.analyses} ` +
          `(${result.duration}ms)`,
      );
    } catch (error) {
      this.logger.error('❌ Skor yeniden hesaplama hatası:', error);
      throw error;
    }
  }

  /**
   * Manuel olarak skor yeniden hesaplamayı tetikler.
   * Admin API veya test için kullanılabilir.
   */
  async triggerManualRecalculation(): Promise<RecalculationResult> {
    this.logger.log('🔧 Manuel skor yeniden hesaplama başlatıldı...');

    const result = await this.recalculateAllScores();
    this.logger.log(`✅ Manuel hesaplama tamamlandı (${result.duration}ms)`);

    return result;
  }

  /**
   * Tüm skorları yeniden hesaplar.
   * Product, ProductContent ve ContentAnalysis için tek transaction içinde çalışır.
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
   * Product skorlarını Vote tablosundan yeniden hesaplar.
   */
  private async recalculateProductScores(manager: EntityManager): Promise<number> {
    const result = await manager.query(`
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
    return result[1] ?? 0;
  }

  /**
   * ProductContent skorlarını Vote tablosundan yeniden hesaplar.
   */
  private async recalculateContentScores(manager: EntityManager): Promise<number> {
    const result = await manager.query(`
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
    return result[1] ?? 0;
  }

  /**
   * ContentAnalysis skorlarını Vote tablosundan yeniden hesaplar.
   */
  private async recalculateAnalysisScores(manager: EntityManager): Promise<number> {
    const result = await manager.query(`
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
    return result[1] ?? 0;
  }
}
