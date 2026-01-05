import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * Barkod tarama isteği
 */
export class ScanRequestDto {
  @ApiProperty({ description: 'Barkod numarası', example: '8690000123456' })
  @IsString()
  @IsNotEmpty()
  barcode: string;
}

/**
 * Ürün onaylama isteği
 */
export class ConfirmRequestDto {
  @ApiProperty({ description: 'Ürün ID', example: 'uuid' })
  @IsUUID()
  productId: string;
}

/**
 * Ürün reddetme isteği
 */
export class RejectProductRequestDto {
  @ApiProperty({ description: 'Ürün ID', example: 'uuid' })
  @IsUUID()
  productId: string;
}

/**
 * İçerik reddetme isteği
 */
export class RejectContentRequestDto {
  @ApiProperty({ description: 'İçerik ID', example: 'uuid' })
  @IsUUID()
  contentId: string;
}

/**
 * Analiz reddetme isteği
 */
export class RejectAnalysisRequestDto {
  @ApiProperty({ description: 'Analiz ID', example: 'uuid' })
  @IsUUID()
  analysisId: string;
}
