import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barcode } from '../../../entities';
import { BarcodeController } from './barcode.controller';
import { BarcodeService } from './barcode.service';

// Barkod CRUD ve flag endpoint'i
@Module({
  imports: [TypeOrmModule.forFeature([Barcode])],
  controllers: [BarcodeController],
  providers: [BarcodeService],
  exports: [BarcodeService],
})
export class BarcodeModule {}
