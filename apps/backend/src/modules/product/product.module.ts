import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Barcode,
  ContentAnalysis,
  Product,
  ProductContent,
  User,
  Vote,
} from '../../entities';
import { AiModule } from '../ai/ai.module';
import { VoteModule } from '../vote/vote.module';
import { AnalysisService } from './analysis.service';
import { BarcodeService } from './barcode.service';
import { ContentService } from './content.service';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

/**
 * Product modülü
 * Barkod tarama, ürün onaylama/reddetme işlemlerini yönetir
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Barcode,
      Product,
      ProductContent,
      ContentAnalysis,
      Vote,
      User,
    ]),
    forwardRef(() => VoteModule), // Circular dependency çözümü
    AiModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, BarcodeService, ContentService, AnalysisService],
  exports: [ProductService, BarcodeService, ContentService, AnalysisService],
})
export class ProductModule {}
