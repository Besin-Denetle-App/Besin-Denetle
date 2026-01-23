import { ConfirmRequest, RejectContentRequest } from '@besin-denetle/shared';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional, IsUUID } from 'class-validator';

export class ConfirmRequestDto implements ConfirmRequest {
  @ApiProperty({ description: 'Ürün ID', example: 'uuid' })
  @IsUUID()
  productId: string;
}

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
  @ArrayMaxSize(10)
  excludeIds?: string[];
}
