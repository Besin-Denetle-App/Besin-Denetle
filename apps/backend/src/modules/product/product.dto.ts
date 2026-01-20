import {
  FlagBarcodeRequest,
  RejectProductRequest,
  ScanRequest,
} from '@besin-denetle/shared';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

/**
 * Barkod tarama isteği
 */
export class ScanRequestDto implements ScanRequest {
  @ApiProperty({ description: 'Barkod numarası', example: '8690000123456' })
  @IsString()
  @IsNotEmpty()
  barcode: string;
}

/**
 * Ürün reddetme isteği
 */
export class RejectProductRequestDto implements RejectProductRequest {
  @ApiProperty({ description: 'Ürün ID', example: 'uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Hariç tutulacak ürün IDleri', required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excludeIds?: string[];
}

/**
 * Barkod bildirme isteği
 */
export class FlagBarcodeRequestDto implements FlagBarcodeRequest {
  @ApiProperty({ description: 'Barkod ID', example: 'uuid' })
  @IsUUID()
  barcodeId: string;
}
