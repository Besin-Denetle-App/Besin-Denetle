import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentAnalysis, Product, ProductContent, Vote } from '../../entities';
import { ScoreRecalculationService } from './score-recalculation.service';

/**
 * Zamanlanmış görevleri (Cron Jobs) yöneten modül.
 * Her gece 02:00'de skorları yeniden hesaplar.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Vote, Product, ProductContent, ContentAnalysis]),
  ],
  providers: [ScoreRecalculationService],
})
export class TasksModule {}
