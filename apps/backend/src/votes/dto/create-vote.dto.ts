import { VoteType } from '@besin-denetle/shared';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsOptional()
  productContentId?: string;

  @IsUUID()
  @IsOptional()
  contentAnalysisId?: string;

  @IsEnum(VoteType)
  voteType: VoteType;
}
