import {
    GenerateAnalysisRequest,
    RejectAnalysisRequest,
} from '@besin-denetle/shared';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional, IsUUID } from 'class-validator';

export class GenerateAnalysisRequestDto implements GenerateAnalysisRequest {
  @ApiProperty({ description: 'İçerik ID', example: 'uuid' })
  @IsUUID()
  contentId: string;
}

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
  @ArrayMaxSize(10)
  excludeIds?: string[];
}
