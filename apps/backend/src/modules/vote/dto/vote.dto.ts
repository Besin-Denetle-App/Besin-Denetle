import { VoteTarget, VoteType } from '@besin-denetle/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';

/**
 * Oylama isteği
 */
export class VoteRequestDto {
  @ApiProperty({ description: 'Oy hedef tipi', enum: VoteTarget })
  @IsEnum(VoteTarget)
  target: VoteTarget;

  @ApiProperty({ description: 'Hedef ID (product, content veya analysis)' })
  @IsUUID()
  targetId: string;

  @ApiProperty({ description: 'Oy tipi', enum: VoteType })
  @IsEnum(VoteType)
  voteType: VoteType;
}
