import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../../entities';
import { AiModule } from '../../ai/ai.module';
import { VoteModule } from '../../vote/vote.module';
import { BarcodeModule } from '../barcode/barcode.module';
import { ContentModule } from '../content/content.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

/**
 * Product modülü
 * Ürün tarama ve reddetme işlemleri
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    BarcodeModule,
    forwardRef(() => VoteModule),
    forwardRef(() => ContentModule),
    AiModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
