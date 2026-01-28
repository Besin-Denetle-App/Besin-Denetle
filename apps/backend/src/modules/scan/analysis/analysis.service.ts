import { ICreateContentAnalysis, MAX_VARIANTS } from '@besin-denetle/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { ContentAnalysis } from '../../../entities';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(ContentAnalysis)
    private readonly analysisRepository: Repository<ContentAnalysis>,
  ) {}

  /** Content'e ait en yüksek skorlu analizi getir */
  async findBestByContentId(
    contentId: string,
  ): Promise<ContentAnalysis | null> {
    return this.analysisRepository.findOne({
      where: { product_content_id: contentId },
      order: { score: 'DESC', created_at: 'DESC' },
    });
  }

  /** Belirli ID'ler hariç en iyi analizi getir (reject akışı için) */
  async findBestExcluding(
    contentId: string,
    excludeIds: string[],
  ): Promise<ContentAnalysis | null> {
    if (excludeIds.length === 0) {
      return this.findBestByContentId(contentId);
    }

    return this.analysisRepository.findOne({
      where: {
        product_content_id: contentId,
        id: Not(In(excludeIds)),
      },
      order: { score: 'DESC', created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<ContentAnalysis | null> {
    return this.analysisRepository.findOne({
      where: { id },
      relations: [
        'productContent',
        'productContent.product',
        'productContent.product.barcode',
      ],
    });
  }

  async countByContentId(contentId: string): Promise<number> {
    return this.analysisRepository.count({
      where: { product_content_id: contentId },
    });
  }

  async create(data: ICreateContentAnalysis): Promise<ContentAnalysis> {
    const analysis = this.analysisRepository.create({
      product_content_id: data.product_content_id,
      analysis_text: data.analysis_text ?? null,
      model: data.model ?? null,
      is_manual: data.is_manual ?? false,
      score: 0,
      vote_count: 0,
    });
    return this.analysisRepository.save(analysis);
  }

  /** Varyant sayısı MAX_VARIANTS'a ulaştıysa en düşük skorluyu sil */
  async enforceVariantLimit(contentId: string): Promise<void> {
    const count = await this.countByContentId(contentId);

    if (count >= MAX_VARIANTS) {
      const lowestScored = await this.analysisRepository.findOne({
        where: { product_content_id: contentId },
        order: { score: 'ASC', created_at: 'ASC' },
      });

      if (lowestScored) {
        await this.analysisRepository.remove(lowestScored);
      }
    }
  }

  /** Oylama sonrası skor güncelle */
  async updateScore(
    id: string,
    scoreDelta: number,
    voteCountDelta: number,
  ): Promise<void> {
    await this.analysisRepository
      .createQueryBuilder()
      .update(ContentAnalysis)
      .set({
        score: () => 'score + :scoreDelta',
        vote_count: () => 'vote_count + :voteCountDelta',
      })
      .setParameters({ scoreDelta, voteCountDelta })
      .where('id = :id', { id })
      .execute();
  }
}
