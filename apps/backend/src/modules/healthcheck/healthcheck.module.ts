import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthcheckController } from './healthcheck.controller';

@Module({
  imports: [TypeOrmModule],
  controllers: [HealthcheckController],
})
export class HealthcheckModule {}
