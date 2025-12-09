import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Barcode } from '../entities/barcode.entity';
import { BarcodeService } from './barcode.service';

@ApiTags('barcodes')
@Controller('barcodes')
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  @Get(':code')
  @ApiOperation({ summary: 'Get barcode status or create pending placeholder' })
  @ApiResponse({ status: 200, type: Barcode })
  async getBarcode(@Param('code') code: string) {
    return this.barcodeService.findOrCreate(code);
  }
}
