import {
  ConfirmRequest,
  RejectProductRequest,
  ScanRequest,
} from '@besin-denetle/shared';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

/**
 * Barkod tarama isteği
 */
export class ScanRequestDto implements ScanRequest {
  @ApiProperty({
    description: 'Barkod numarası (EAN-8, EAN-13, UPC-A)',
    example: '8690000123456',
    minLength: 8,
    maxLength: 13,
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 13, {
    message: 'Barkod 8-13 karakter arasında olmalıdır',
  })
  @Matches(/^[0-9]+$/, {
    message: 'Barkod sadece rakamlardan oluşmalıdır',
  })
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
  @ArrayMaxSize(10)
  excludeIds?: string[];
}

/**
 * Ürün onaylama isteği
 */
export class ConfirmRequestDto implements ConfirmRequest {
  @ApiProperty({ description: 'Ürün ID', example: 'uuid' })
  @IsUUID()
  productId: string;
}
