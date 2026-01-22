import { Global, Module } from '@nestjs/common';
import { FoodCheckService } from '../services/food-check.service';
import { AppLogger } from './app-logger.service';
import { LogContextService } from './log-context.service';

// Global logging ve ilgili servisler
@Global()
@Module({
  providers: [AppLogger, LogContextService, FoodCheckService],
  exports: [AppLogger, LogContextService, FoodCheckService],
})
export class LoggingModule {}
