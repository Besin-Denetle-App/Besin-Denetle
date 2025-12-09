import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { BarcodeModule } from '../barcode/barcode.module';
import { ContentAnalysis } from '../entities/content-analysis.entity';
import { ProductContent } from '../entities/product-content.entity';
import { Product } from '../entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductContent, ContentAnalysis]),
    BarcodeModule,
    AiModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
