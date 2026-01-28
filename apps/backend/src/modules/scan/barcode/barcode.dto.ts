import { FlagBarcodeRequest } from '@besin-denetle/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Barkod bildirme isteği DTO
 */
export class FlagBarcodeRequestDto implements FlagBarcodeRequest {
  @ApiProperty({ description: 'Barkod ID', example: 'uuid' })
  @IsUUID()
  barcodeId: string;
}
