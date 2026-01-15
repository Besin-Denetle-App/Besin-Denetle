import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScoreRecalculationService } from './score-recalculation.service';

/**
 * Zamanlanmış görevleri (Cron Jobs) yöneten modül.
 * Her gece 02:00'de skorları yeniden hesaplar.
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [ScoreRecalculationService],
})
export class TasksModule {}
