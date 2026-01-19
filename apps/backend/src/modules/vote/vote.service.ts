import { SCORE_CHANGES, VoteTarget, VoteType } from '@besin-denetle/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from '../../entities';
import { AnalysisService } from '../product/analysis.service';
import { ContentService } from '../product/content.service';
import { ProductService } from '../product/product.service';

/**
 * Vote servisi
 * Oylama işlemleri ve skor güncellemeleri
 */
@Injectable()
export class VoteService {
  constructor(
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    private readonly productService: ProductService,
    private readonly contentService: ContentService,
    private readonly analysisService: AnalysisService,
  ) {}

  /**
   * Oy ver veya mevcut oyu değiştir
   */
  async vote(
    userId: string,
    target: VoteTarget,
    targetId: string,
    voteType: VoteType,
  ): Promise<{ scoreDelta: number; previousVote: VoteType | null }> {
    // Mevcut oy kontrol
    const existingVote = await this.findExistingVote(userId, target, targetId);

    let scoreDelta = 0;
    let voteCountDelta = 0;
    let previousVote: VoteType | null = null;

    if (existingVote) {
      previousVote = existingVote.vote_type;

      if (existingVote.vote_type === voteType) {
        // Aynı oy
        return { scoreDelta: 0, previousVote };
      }

      // Oy değişimi
      if (voteType === VoteType.UP) {
        scoreDelta = SCORE_CHANGES.DOWN_TO_UP; // +2
      } else {
        scoreDelta = SCORE_CHANGES.UP_TO_DOWN; // -2
      }
      voteCountDelta = 0; // Değişimde count artmaz

      // Mevcut oyu güncelle
      existingVote.vote_type = voteType;
      await this.voteRepository.save(existingVote);
    } else {
      // Yeni oy
      scoreDelta =
        voteType === VoteType.UP
          ? SCORE_CHANGES.NEW_UP
          : SCORE_CHANGES.NEW_DOWN;
      voteCountDelta = 1;

      // Yeni kayıt
      const vote = this.createVoteEntity(userId, target, targetId, voteType);
      await this.voteRepository.save(vote);
    }

    // Skor güncelle
    await this.updateTargetScore(target, targetId, scoreDelta, voteCountDelta);

    return { scoreDelta, previousVote };
  }

  /**
   * Mevcut oyu bul
   */
  private async findExistingVote(
    userId: string,
    target: VoteTarget,
    targetId: string,
  ): Promise<Vote | null> {
    const whereClause: Record<string, unknown> = { user_id: userId };

    switch (target) {
      case VoteTarget.PRODUCT:
        whereClause.product_id = targetId;
        break;
      case VoteTarget.CONTENT:
        whereClause.product_content_id = targetId;
        break;
      case VoteTarget.ANALYSIS:
        whereClause.content_analysis_id = targetId;
        break;
    }

    return this.voteRepository.findOne({ where: whereClause });
  }

  /**
   * Vote entity oluştur
   */
  private createVoteEntity(
    userId: string,
    target: VoteTarget,
    targetId: string,
    voteType: VoteType,
  ): Vote {
    const vote = new Vote();
    vote.user_id = userId;
    vote.vote_type = voteType;
    vote.product_id = null;
    vote.product_content_id = null;
    vote.content_analysis_id = null;

    switch (target) {
      case VoteTarget.PRODUCT:
        vote.product_id = targetId;
        break;
      case VoteTarget.CONTENT:
        vote.product_content_id = targetId;
        break;
      case VoteTarget.ANALYSIS:
        vote.content_analysis_id = targetId;
        break;
    }

    return vote;
  }

  /**
   * Skor güncelle
   */
  private async updateTargetScore(
    target: VoteTarget,
    targetId: string,
    scoreDelta: number,
    voteCountDelta: number,
  ): Promise<void> {
    switch (target) {
      case VoteTarget.PRODUCT:
        await this.productService.updateScore(
          targetId,
          scoreDelta,
          voteCountDelta,
        );
        break;
      case VoteTarget.CONTENT:
        await this.contentService.updateScore(
          targetId,
          scoreDelta,
          voteCountDelta,
        );
        break;
      case VoteTarget.ANALYSIS:
        await this.analysisService.updateScore(
          targetId,
          scoreDelta,
          voteCountDelta,
        );
        break;
    }
  }
}
