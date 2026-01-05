import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VoteRequestDto } from './dto';
import { VoteService } from './vote.service';

/**
 * Vote Controller
 * Oylama endpoint'i
 */
@ApiTags('vote')
@Controller('vote')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  /**
   * POST /api/vote
   * Oy ver veya oyunu değiştir
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Oy ver' })
  @ApiResponse({ status: 200, description: 'Oy kaydedildi' })
  async vote(
    @CurrentUser('id') userId: string,
    @Body() dto: VoteRequestDto,
  ): Promise<any> {
    const result = await this.voteService.vote(
      userId,
      dto.target,
      dto.targetId,
      dto.voteType,
    );

    return {
      success: true,
      scoreDelta: result.scoreDelta,
      previousVote: result.previousVote,
    };
  }
}
