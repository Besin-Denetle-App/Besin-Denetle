import { ProductType } from '@besin-denetle/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barcode } from '../../entities';

@Injectable()
export class BarcodeService {
  constructor(
    @InjectRepository(Barcode)
    private readonly barcodeRepository: Repository<Barcode>,
  ) {}

  /** Barkod numarasıyla ara (products relation dahil) */
  async findByCode(code: string): Promise<Barcode | null> {
    return this.barcodeRepository.findOne({
      where: { code },
      relations: ['products'],
    });
  }

  async findById(id: string): Promise<Barcode | null> {
    return this.barcodeRepository.findOne({
      where: { id },
      relations: ['products'],
    });
  }

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

  async updateType(id: string, type: ProductType): Promise<void> {
    await this.barcodeRepository.update(id, { type });
  }

  /** Kullanıcı raporu - flag_count++ ve is_flagged=true */
  async flag(id: string): Promise<void> {
    await this.barcodeRepository
      .createQueryBuilder()
      .update(Barcode)
      .set({
        flag_count: () => 'flag_count + 1',
        is_flagged: true,
      })
      .where('id = :id', { id })
      .execute();
  }
}
