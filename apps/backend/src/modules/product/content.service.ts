import { ICreateProductContent, MAX_VARIANTS } from '@besin-denetle/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { ProductContent } from '../../entities';

/**
 * Content servisi
 * Ürün içeriği (ingredients, nutrition) CRUD işlemleri
 */
@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ProductContent)
    private readonly contentRepository: Repository<ProductContent>,
  ) {}

  /**
   * Product ID'sine göre en yüksek skorlu içeriği getir
   */
  async findBestByProductId(productId: string): Promise<ProductContent | null> {
    return this.contentRepository.findOne({
      where: { product_id: productId },
      order: { score: 'DESC', created_at: 'DESC' },
    });
  }

  /**
   * Belirli ID'ler hariç en yüksek skorlu içeriği getir
   */
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

  /**
   * ID'ye göre içerik bul
   */
  async findById(id: string): Promise<ProductContent | null> {
    return this.contentRepository.findOne({
      where: { id },
      relations: ['product', 'analyses'],
    });
  }

  /**
   * Product için kaç içerik varyantı olduğunu say
   */
  async countByProductId(productId: string): Promise<number> {
    return this.contentRepository.count({
      where: { product_id: productId },
    });
  }

  /**
   * Yeni içerik varyantı oluştur
   */
  async create(data: ICreateProductContent): Promise<ProductContent> {
    const content = this.contentRepository.create({
      product_id: data.product_id,
      ingredients: data.ingredients ?? null,
      allergens: data.allergens ?? null,
      nutrition_table: data.nutrition_table ?? null,
      is_manual: data.is_manual ?? false,
      score: 0,
      vote_count: 0,
    });
    return this.contentRepository.save(content);
  }

  /**
   * Varyant limitini kontrol et ve en düşük skorluyu sil
   */
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

  /**
   * Score güncelle
   */
  async updateScore(id: string, scoreDelta: number, voteCountDelta: number): Promise<void> {
    await this.contentRepository
      .createQueryBuilder()
      .update(ProductContent)
      .set({
        score: () => `score + ${scoreDelta}`,
        vote_count: () => `vote_count + ${voteCountDelta}`,
      })
      .where('id = :id', { id })
      .execute();
  }
}
