import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentAnalysis } from '../../entities';
import { AiModule } from '../ai/ai.module';
import { ContentModule } from '../content/content.module';
import { ProductModule } from '../product/product.module';
import { VoteModule } from '../vote/vote.module';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';

// AI sağlık analizi - içerik bilgisini alıp Gemini'ye gönderir
@Module({
  imports: [
    TypeOrmModule.forFeature([ContentAnalysis]),
    forwardRef(() => ContentModule),
    forwardRef(() => ProductModule),
    forwardRef(() => VoteModule),
    AiModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
