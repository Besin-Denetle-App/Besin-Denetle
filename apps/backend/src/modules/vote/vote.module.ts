import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentAnalysis, Product, ProductContent, Vote } from '../../entities';
import { ProductModule } from '../product/product.module';
import { VoteService } from './vote.service';

/**
 * Vote modülü
 * Tüm oylar product.controller.ts üzerinden otomatik verilir.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, Product, ProductContent, ContentAnalysis]),
    forwardRef(() => ProductModule), // Circular dependency
  ],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {}
