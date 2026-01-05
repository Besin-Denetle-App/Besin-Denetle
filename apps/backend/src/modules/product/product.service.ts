import { ICreateProduct, MAX_VARIANTS } from '@besin-denetle/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Product } from '../../entities';

/**
 * Ürün varyantlarını yöneten servis.
 * Veritabanı sorguları ve varyant eleme mantığı burada bulunur.
 */
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Verilen barkoda ait en yüksek puanlı (en güvenilir) ürünü getirir.
   */
  async findBestByBarcodeId(barcodeId: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { barcode_id: barcodeId },
      order: { score: 'DESC', created_at: 'DESC' },
    });
  }

  /**
   * Kullanıcının reddettiği varyantlar hariç en iyi alternatifi bulur.
   */
  async findBestExcluding(
    barcodeId: string,
    excludeIds: string[],
  ): Promise<Product | null> {
    if (excludeIds.length === 0) {
      return this.findBestByBarcodeId(barcodeId);
    }

    return this.productRepository.findOne({
      where: {
        barcode_id: barcodeId,
        id: Not(In(excludeIds)),
      },
      order: { score: 'DESC', created_at: 'DESC' },
    });
  }

  /**
   * ID'ye göre ürün bul
   */
  async findById(id: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id },
      relations: ['barcode', 'contents'],
    });
  }

  /**
   * Barkod ID'sine göre tüm ürünleri getir
   */
  async findAllByBarcodeId(barcodeId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { barcode_id: barcodeId },
      order: { score: 'DESC', created_at: 'DESC' },
    });
  }

  /**
   * Bir barkoda bağlı kaç farklı ürün varyantı olduğunu sayar.
   */
  async countByBarcodeId(barcodeId: string): Promise<number> {
    return this.productRepository.count({
      where: { barcode_id: barcodeId },
    });
  }

  /**
   * Yeni bir ürün varyantı oluşturur. Puanı 0 olarak başlar.
   */
  async create(data: ICreateProduct): Promise<Product> {
    const product = this.productRepository.create({
      barcode_id: data.barcode_id,
      brand: data.brand ?? null,
      name: data.name ?? null,
      quantity: data.quantity ?? null,
      image_url: data.image_url ?? null,
      is_manual: data.is_manual ?? false,
      score: 0,
      vote_count: 0,
      is_flagged: false,
    });
    return this.productRepository.save(product);
  }

  /**
   * Veritabanı şişkinliğini önlemek için varyant limitini kontrol eder.
   * Limit aşıldıysa en düşük puanlı varyantı siler (Survival of the Fittest).
   */
  async enforceVariantLimit(barcodeId: string): Promise<void> {
    const count = await this.countByBarcodeId(barcodeId);

    if (count >= MAX_VARIANTS) {
      // En düşük skorlu varyantı bul ve sil
      const lowestScored = await this.productRepository.findOne({
        where: { barcode_id: barcodeId },
        order: { score: 'ASC', created_at: 'ASC' },
      });

      if (lowestScored) {
        await this.productRepository.remove(lowestScored);
      }
    }
  }

  /**
   * Score güncelle
   */
  async updateScore(id: string, scoreDelta: number, voteCountDelta: number): Promise<void> {
    await this.productRepository
      .createQueryBuilder()
      .update(Product)
      .set({
        score: () => `score + ${scoreDelta}`,
        vote_count: () => `vote_count + ${voteCountDelta}`,
      })
      .where('id = :id', { id })
      .execute();
  }

  /**
   * Ürünü raporla (flag işaretle)
   */
  async flag(id: string): Promise<void> {
    await this.productRepository.update(id, { is_flagged: true });
  }
}
