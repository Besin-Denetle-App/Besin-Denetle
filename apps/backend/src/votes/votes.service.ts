import { SCORE_CHANGES, VoteType } from '@besin-denetle/shared';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ContentAnalysis } from '../entities/content-analysis.entity';
import { ProductContent } from '../entities/product-content.entity';
import { Vote } from '../entities/vote.entity';
import { CreateVoteDto } from './dto/create-vote.dto';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private voteRepo: Repository<Vote>,
    @InjectRepository(ProductContent)
    private contentRepo: Repository<ProductContent>,
    @InjectRepository(ContentAnalysis)
    private analysisRepo: Repository<ContentAnalysis>,
    private dataSource: DataSource,
  ) {}

  async vote(dto: CreateVoteDto) {
    if (!dto.productContentId && !dto.contentAnalysisId) {
        throw new BadRequestException('Oy vermek için bir hedef (İçerik veya Analiz) seçmelisiniz.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // Mevcut oyu kontrol et
        const existingVote = await queryRunner.manager.findOne(Vote, {
            where: {
                userId: dto.userId,
                productContentId: dto.productContentId,
                contentAnalysisId: dto.contentAnalysisId,
            }
        });

        let updatedScoreChange = 0;
        let updatedVoteCountChange = 0;

        if (existingVote) {
             // Durum 1: Kullanıcı aynı oyu tekrar veriyor (Değişiklik yok)
             if (existingVote.voteType === dto.voteType) {
                 await queryRunner.release();
                 return existingVote;
             }

             // Durum 2: Kullanıcı koyunu değiştiriyor (UP -> DOWN veya tam tersi)
             // UP -> DOWN: Skor 2 azalır (+1'den -1'e düşer)
             // DOWN -> UP: Skor 2 artar (-1'den +1'e çıkar)
             if (existingVote.voteType === VoteType.UP && dto.voteType === VoteType.DOWN) {
                 updatedScoreChange = SCORE_CHANGES.UP_TO_DOWN;
             } else if (existingVote.voteType === VoteType.DOWN && dto.voteType === VoteType.UP) {
                 updatedScoreChange = SCORE_CHANGES.DOWN_TO_UP;
             }
             
             existingVote.voteType = dto.voteType;
             await queryRunner.manager.save(existingVote);
        } else {
            // Durum 3: Yeni Oy
            const newVote = this.voteRepo.create({
                ...dto
            });
            await queryRunner.manager.save(newVote);

            updatedVoteCountChange = 1;
            // UP ise +1, DOWN ise -1
            updatedScoreChange = dto.voteType === VoteType.UP ? SCORE_CHANGES.NEW_UPVOTE : SCORE_CHANGES.NEW_DOWNVOTE;
        }

        // Hedef entity'nin (ProductContent veya ContentAnalysis) skorunu güncelle
        if (dto.productContentId) {
            await queryRunner.manager.increment(ProductContent, { id: dto.productContentId }, 'score', updatedScoreChange);
            if (updatedVoteCountChange !== 0) {
                await queryRunner.manager.increment(ProductContent, { id: dto.productContentId }, 'voteCount', updatedVoteCountChange);
            }
        } else if (dto.contentAnalysisId) {
             await queryRunner.manager.increment(ContentAnalysis, { id: dto.contentAnalysisId }, 'score', updatedScoreChange);
             if (updatedVoteCountChange !== 0) {
                await queryRunner.manager.increment(ContentAnalysis, { id: dto.contentAnalysisId }, 'voteCount', updatedVoteCountChange);
            }
        }

        await queryRunner.commitTransaction();
        return { success: true };

    } catch (err) {
        await queryRunner.rollbackTransaction();
         throw err;
    } finally {
        await queryRunner.release();
    }
  }
}
