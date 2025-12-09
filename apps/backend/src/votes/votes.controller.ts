import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VotesService } from './votes.service';

@ApiTags('votes')
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @ApiOperation({ summary: 'Vote for content or analysis' })
  create(@Body() createVoteDto: CreateVoteDto) {
    return this.votesService.vote(createVoteDto);
  }
}
