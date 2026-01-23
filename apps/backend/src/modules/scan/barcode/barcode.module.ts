import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barcode } from '../../../entities';
import { BarcodeService } from './barcode.service';

// Barkod CRUD - ProductModule tarafından kullanılıyor
@Module({
  imports: [TypeOrmModule.forFeature([Barcode])],
  providers: [BarcodeService],
  exports: [BarcodeService],
})
export class BarcodeModule {}
