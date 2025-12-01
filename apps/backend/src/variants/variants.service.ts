import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariantSection1, VariantSection2 } from '../entities';

@Injectable()
export class VariantsService {
  constructor(
    @InjectRepository(VariantSection1)
    private variantSection1Repository: Repository<VariantSection1>,
    @InjectRepository(VariantSection2)
    private variantSection2Repository: Repository<VariantSection2>,
  ) {}

  // Section 1 variant'ı oluştur
  createSection1(data: Partial<VariantSection1>) {
    const variant = this.variantSection1Repository.create(data);
    return this.variantSection1Repository.save(variant);
  }

  // Section 2 variant'ı oluştur
  createSection2(data: Partial<VariantSection2>) {
    const variant = this.variantSection2Repository.create(data);
    return this.variantSection2Repository.save(variant);
  }
}
