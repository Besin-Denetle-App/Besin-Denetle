import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScoreRecalculationService } from './score-recalculation.service';

/**
 * Zamanlanmış görevler (Cron Jobs) modülü
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [ScoreRecalculationService],
})
export class TasksModule {}
