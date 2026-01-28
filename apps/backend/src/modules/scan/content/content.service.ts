import { ICreateProductContent, MAX_VARIANTS } from '@besin-denetle/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { ProductContent } from '../../../entities';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ProductContent)
    private readonly contentRepository: Repository<ProductContent>,
  ) {}

  /** Product'a ait en yüksek skorlu içeriği getir */
  async findBestByProductId(productId: string): Promise<ProductContent | null> {
    return this.contentRepository.findOne({
      where: { product_id: productId },
      order: { score: 'DESC', created_at: 'DESC' },
    });
  }

  /** Belirli ID'ler hariç en iyi içeriği getir (reject akışı için) */
  async findBestExcluding(
    productId: string,
    excludeIds: string[],
  ): Promise<ProductContent | null> {
    if (excludeIds.length === 0) {
      return this.findBestByProductId(productId);
    }

    return this.contentRepository.findOne({
      where: {
        product_id: productId,
        id: Not(In(excludeIds)),
      },
      order: { score: 'DESC', created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<ProductContent | null> {
    return this.contentRepository.findOne({
      where: { id },
      relations: ['product', 'product.barcode', 'analyses'],
    });
  }

  async countByProductId(productId: string): Promise<number> {
    return this.contentRepository.count({
      where: { product_id: productId },
    });
  }

  async create(data: ICreateProductContent): Promise<ProductContent> {
    const content = this.contentRepository.create({
      product_id: data.product_id,
      ingredients: data.ingredients ?? null,
      allergens: data.allergens ?? null,
      nutrition_table: data.nutrition_table ?? null,
      model: data.model ?? null,
      is_manual: data.is_manual ?? false,
      score: 0,
      vote_count: 0,
    });
    return this.contentRepository.save(content);
  }

  /** Varyant sayısı MAX_VARIANTS'a ulaştıysa en düşük skorluyu sil */
  async enforceVariantLimit(productId: string): Promise<void> {
    const count = await this.countByProductId(productId);

    if (count >= MAX_VARIANTS) {
      const lowestScored = await this.contentRepository.findOne({
        where: { product_id: productId },
        order: { score: 'ASC', created_at: 'ASC' },
      });

      if (lowestScored) {
        await this.contentRepository.remove(lowestScored);
      }
    }
  }

  /** Oylama sonrası skor güncelle */
  async updateScore(
    id: string,
    scoreDelta: number,
    voteCountDelta: number,
  ): Promise<void> {
    await this.contentRepository
      .createQueryBuilder()
      .update(ProductContent)
      .set({
        score: () => 'score + :scoreDelta',
        vote_count: () => 'vote_count + :voteCountDelta',
      })
      .setParameters({ scoreDelta, voteCountDelta })
      .where('id = :id', { id })
      .execute();
  }
}
