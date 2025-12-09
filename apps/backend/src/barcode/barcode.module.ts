import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barcode } from '../entities/barcode.entity';
import { BarcodeController } from './barcode.controller';
import { BarcodeService } from './barcode.service';

@Module({
  imports: [TypeOrmModule.forFeature([Barcode])],
  controllers: [BarcodeController],
  providers: [BarcodeService],
  exports: [BarcodeService],
})
export class BarcodeModule {}
