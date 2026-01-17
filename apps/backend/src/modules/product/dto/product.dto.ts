import {
  ConfirmRequest,
  FlagBarcodeRequest,
  GenerateAnalysisRequest,
  RejectAnalysisRequest,
  RejectContentRequest,
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

  @ApiProperty({ description: 'Hariç tutulacak ürün IDleri', required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excludeIds?: string[];
}

/**
 * İçerik reddetme isteği
 */
export class RejectContentRequestDto implements RejectContentRequest {
  @ApiProperty({ description: 'İçerik ID', example: 'uuid' })
  @IsUUID()
  contentId: string;

  @ApiProperty({
    description: 'Hariç tutulacak içerik IDleri',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excludeIds?: string[];
}

/**
 * Analiz reddetme isteği
 */
export class RejectAnalysisRequestDto implements RejectAnalysisRequest {
  @ApiProperty({ description: 'Analiz ID', example: 'uuid' })
  @IsUUID()
  analysisId: string;

  @ApiProperty({
    description: 'Hariç tutulacak analiz IDleri',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excludeIds?: string[];
}

/**
 * Analiz üretme isteği
 */
export class GenerateAnalysisRequestDto implements GenerateAnalysisRequest {
  @ApiProperty({ description: 'İçerik ID', example: 'uuid' })
  @IsUUID()
  contentId: string;
}

/**
 * Barkod bildirme isteği
 */
export class FlagBarcodeRequestDto implements FlagBarcodeRequest {
  @ApiProperty({ description: 'Barkod ID', example: 'uuid' })
  @IsUUID()
  barcodeId: string;
}
