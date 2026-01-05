import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentAnalysis, Product, ProductContent, Vote } from '../../entities';
import { AuthModule } from '../auth/auth.module';
import { ProductModule } from '../product/product.module';
import { VoteController } from './vote.controller';
import { VoteService } from './vote.service';

/**
 * Vote modülü
 * Oylama işlemlerini yönetir
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, Product, ProductContent, ContentAnalysis]),
    forwardRef(() => ProductModule), // Circular dependency çözümü
    forwardRef(() => AuthModule), // JWT guard için
  ],
  controllers: [VoteController],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {}

