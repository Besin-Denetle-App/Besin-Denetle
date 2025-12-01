import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantSection1, VariantSection2 } from '../entities';
import { VariantsController } from './variants.controller';
import { VariantsService } from './variants.service';

@Module({
  imports: [TypeOrmModule.forFeature([VariantSection1, VariantSection2])],
  controllers: [VariantsController],
  providers: [VariantsService],
})
export class VariantsModule {}
