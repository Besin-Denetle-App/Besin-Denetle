import { Global, Module } from '@nestjs/common';
import { FoodCheckService } from '../services/food-check.service';
import { AppLogger } from './app-logger.service';
import { LogContextService } from './log-context.service';

// global logger ve core servisler
@Global()
@Module({
  providers: [AppLogger, LogContextService, FoodCheckService],
  exports: [AppLogger, LogContextService, FoodCheckService],
})
export class CoreServicesModule { }
