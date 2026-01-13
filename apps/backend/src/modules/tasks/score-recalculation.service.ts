import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentAnalysis, Product, ProductContent, Vote } from '../../entities';

/**
 * Skorları yeniden hesaplayan zamanlanmış servis.
 * Her gece 02:00'de çalışır ve tüm skorları güncelleyerek
 * silinmiş oylardan kaynaklanan tutarsızlıkları düzeltir.
 */
@Injectable()
export class ScoreRecalculationService {
  private readonly logger = new Logger(ScoreRecalculationService.name);

  constructor(
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductContent)
    private readonly contentRepository: Repository<ProductContent>,
    @InjectRepository(ContentAnalysis)
    private readonly analysisRepository: Repository<ContentAnalysis>,
  ) {}

  /**
   * Her gece saat 02:00'de çalışır (Türkiye saati).
   * Tüm Product, ProductContent ve ContentAnalysis skorlarını
   * Vote tablosundaki gerçek oylardan yeniden hesaplar.
   */
  @Cron('0 2 * * *', {
    name: 'score-recalculation',
    timeZone: 'Europe/Istanbul',
  })
  async handleScoreRecalculation() {
    this.logger.log('🔄 Skor yeniden hesaplama başlatıldı...');
    const startTime = Date.now();

    try {
      // 1. Product skorlarını yeniden hesapla
      const productCount = await this.recalculateProductScores();

      // 2. ProductContent skorlarını yeniden hesapla
      const contentCount = await this.recalculateContentScores();

      // 3. ContentAnalysis skorlarını yeniden hesapla
      const analysisCount = await this.recalculateAnalysisScores();

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Skor yeniden hesaplama tamamlandı! ` +
          `Product: ${productCount}, Content: ${contentCount}, Analysis: ${analysisCount} ` +
          `(${duration}ms)`,
      );
    } catch (error) {
      this.logger.error('❌ Skor yeniden hesaplama hatası:', error);
    }
  }

  /**
   * Product skorlarını Vote tablosundan yeniden hesaplar.
   */
  private async recalculateProductScores(): Promise<number> {
    // Tüm product'ları al
    const products = await this.productRepository.find();
    let updatedCount = 0;

    for (const product of products) {
      // Bu product'a ait tüm oyları say
      const votes = await this.voteRepository.find({
        where: { product_id: product.id },
      });

      // Skoru hesapla: UP = +1, DOWN = -1
      const score = votes.reduce((sum, vote) => {
        return sum + (vote.vote_type === 'UP' ? 1 : -1);
      }, 0);

      const voteCount = votes.length;

      // Sadece değişiklik varsa güncelle
      if (product.score !== score || product.vote_count !== voteCount) {
        await this.productRepository.update(product.id, {
          score,
          vote_count: voteCount,
        });
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * ProductContent skorlarını Vote tablosundan yeniden hesaplar.
   */
  private async recalculateContentScores(): Promise<number> {
    const contents = await this.contentRepository.find();
    let updatedCount = 0;

    for (const content of contents) {
      const votes = await this.voteRepository.find({
        where: { product_content_id: content.id },
      });

      const score = votes.reduce((sum, vote) => {
        return sum + (vote.vote_type === 'UP' ? 1 : -1);
      }, 0);

      const voteCount = votes.length;

      if (content.score !== score || content.vote_count !== voteCount) {
        await this.contentRepository.update(content.id, {
          score,
          vote_count: voteCount,
        });
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * ContentAnalysis skorlarını Vote tablosundan yeniden hesaplar.
   */
  private async recalculateAnalysisScores(): Promise<number> {
    const analyses = await this.analysisRepository.find();
    let updatedCount = 0;

    for (const analysis of analyses) {
      const votes = await this.voteRepository.find({
        where: { content_analysis_id: analysis.id },
      });

      const score = votes.reduce((sum, vote) => {
        return sum + (vote.vote_type === 'UP' ? 1 : -1);
      }, 0);

      const voteCount = votes.length;

      if (analysis.score !== score || analysis.vote_count !== voteCount) {
        await this.analysisRepository.update(analysis.id, {
          score,
          vote_count: voteCount,
        });
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * Manuel olarak skor yeniden hesaplamayı tetikler.
   * Admin API veya test için kullanılabilir.
   */
  async triggerManualRecalculation(): Promise<{
    products: number;
    contents: number;
    analyses: number;
    duration: number;
  }> {
    this.logger.log('🔧 Manuel skor yeniden hesaplama başlatıldı...');
    const startTime = Date.now();

    const products = await this.recalculateProductScores();
    const contents = await this.recalculateContentScores();
    const analyses = await this.recalculateAnalysisScores();

    const duration = Date.now() - startTime;
    this.logger.log(`✅ Manuel hesaplama tamamlandı (${duration}ms)`);

    return { products, contents, analyses, duration };
  }
}
