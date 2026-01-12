import {
  ConfirmRequest,
  FlagBarcodeRequest,
  RejectAnalysisRequest,
  RejectContentRequest,
  RejectProductRequest,
  ScanRequest,
} from '@besin-denetle/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

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
 * Ürün onaylama isteği
 */
export class ConfirmRequestDto implements ConfirmRequest {
  @ApiProperty({ description: 'Ürün ID', example: 'uuid' })
  @IsUUID()
  productId: string;
}

/**
 * Ürün reddetme isteği
 */
export class RejectProductRequestDto implements RejectProductRequest {
  @ApiProperty({ description: 'Ürün ID', example: 'uuid' })
  @IsUUID()
  productId: string;
}

/**
 * İçerik reddetme isteği
 */
export class RejectContentRequestDto implements RejectContentRequest {
  @ApiProperty({ description: 'İçerik ID', example: 'uuid' })
  @IsUUID()
  contentId: string;
}

/**
 * Analiz reddetme isteği
 */
export class RejectAnalysisRequestDto implements RejectAnalysisRequest {
  @ApiProperty({ description: 'Analiz ID', example: 'uuid' })
  @IsUUID()
  analysisId: string;
}

/**
 * Barkod bildirme isteği
 */
export class FlagBarcodeRequestDto implements FlagBarcodeRequest {
  @ApiProperty({ description: 'Barkod ID', example: 'uuid' })
  @IsUUID()
  barcodeId: string;
}
