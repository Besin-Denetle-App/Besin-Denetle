import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentAnalysis } from '../entities/content-analysis.entity';
import { ProductContent } from '../entities/product-content.entity';
import { Vote } from '../entities/vote.entity';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vote, ProductContent, ContentAnalysis])],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
