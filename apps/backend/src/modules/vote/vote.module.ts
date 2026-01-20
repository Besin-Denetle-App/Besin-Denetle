import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from '../../entities';
import { AnalysisModule } from '../analysis/analysis.module';
import { ContentModule } from '../content/content.module';
import { ProductModule } from '../product/product.module';
import { VoteService } from './vote.service';

/**
 * Vote modülü
 * Tüm oylar controller'lar üzerinden otomatik verilir.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Vote]),
    forwardRef(() => ProductModule),
    forwardRef(() => ContentModule),
    forwardRef(() => AnalysisModule),
  ],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {}
