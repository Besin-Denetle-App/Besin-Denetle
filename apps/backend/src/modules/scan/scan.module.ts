import { Module } from '@nestjs/common';
import { AnalysisModule } from './analysis/analysis.module';
import { BarcodeModule } from './barcode/barcode.module';
import { ContentModule } from './content/content.module';
import { ProductModule } from './product/product.module';

/**
 * ScanModule - Tarama akışı domain'i
 *
 * Barcode → Product → Content → Analysis
 *
 * Bu modül tüm scan alt modüllerini birleştirir.
 */
@Module({
  imports: [BarcodeModule, ProductModule, ContentModule, AnalysisModule],
  exports: [BarcodeModule, ProductModule, ContentModule, AnalysisModule],
})
export class ScanModule {}
