import { BarcodeStatus } from '@besin-denetle/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barcode } from '../entities/barcode.entity';

@Injectable()
export class BarcodeService {
  constructor(
    @InjectRepository(Barcode)
    private readonly barcodeRepository: Repository<Barcode>,
  ) {}

  async findByCode(code: string): Promise<Barcode | null> {
    return this.barcodeRepository.findOne({
      where: { code },
      relations: {
        products: true,
      }
    });
  }

  async findOrCreate(code: string): Promise<Barcode> {
    const existing = await this.findByCode(code);
    if (existing) {
      return existing;
    }

    const newBarcode = this.barcodeRepository.create({
      code,
      status: BarcodeStatus.PENDING,
    });

    return this.barcodeRepository.save(newBarcode);
  }
}
