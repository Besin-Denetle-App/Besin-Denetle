import { ProductType } from '@besin-denetle/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barcode } from '../../entities';

/**
 * Barkod servisi
 * Barkod CRUD işlemleri ve veritabanı sorguları
 */
@Injectable()
export class BarcodeService {
  constructor(
    @InjectRepository(Barcode)
    private readonly barcodeRepository: Repository<Barcode>,
  ) {}

  /**
   * Barkod numarasına göre barkod kaydını bul
   */
  async findByCode(code: string): Promise<Barcode | null> {
    return this.barcodeRepository.findOne({
      where: { code },
      relations: ['products'],
    });
  }

  /**
   * ID'ye göre barkod bul
   */
  async findById(id: string): Promise<Barcode | null> {
    return this.barcodeRepository.findOne({
      where: { id },
      relations: ['products'],
    });
  }

  /**
   * Yeni barkod oluştur
   */
  async create(
    code: string,
    type: ProductType = ProductType.UNKNOWN,
    isManual: boolean = false,
  ): Promise<Barcode> {
    const barcode = this.barcodeRepository.create({
      code,
      type,
      is_manual: isManual,
      is_flagged: false,
    });
    return this.barcodeRepository.save(barcode);
  }

  /**
   * Barkod tipini güncelle
   */
  async updateType(id: string, type: ProductType): Promise<void> {
    await this.barcodeRepository.update(id, { type });
  }

  /**
   * Barkodu raporla (flag işaretle)
   */
  async flag(id: string): Promise<void> {
    await this.barcodeRepository.update(id, { is_flagged: true });
  }
}
