import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScoreRecalculationService } from './score-recalculation.service';

// Zamanlı görevler - skor yeniden hesaplama vs
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [ScoreRecalculationService],
})
export class CronModule {}
