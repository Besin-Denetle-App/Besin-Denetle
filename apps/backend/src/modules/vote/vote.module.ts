import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentAnalysis, Product, ProductContent, Vote } from '../../entities';
import { ProductModule } from '../product/product.module';
import { VoteService } from './vote.service';

/**
 * Vote modülü
 * Oylama işlemlerini yönetir.
 * NOT: VoteController kaldırıldı - tüm oylar otomatik olarak
 * product.controller.ts içinden voteService.vote() ile veriliyor.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, Product, ProductContent, ContentAnalysis]),
    forwardRef(() => ProductModule), // Circular dependency çözümü
  ],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {}
