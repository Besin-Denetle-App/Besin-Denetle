import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // Yeni ürün oluştur
  create(data: Partial<Product>) {
    const product = this.productRepository.create(data);
    return this.productRepository.save(product);
  }

  // Tüm ürünleri getir
  findAll() {
    return this.productRepository.find();
  }

  // Barcode'a göre ürün getir (ilişkilerle birlikte)
  findOne(barcode: string) {
    return this.productRepository.findOne({
      where: { barcode },
      relations: {
        variantSection1s: {
          variantSection2s: true,
          votes: true,
        },
      },
    });
  }
}
