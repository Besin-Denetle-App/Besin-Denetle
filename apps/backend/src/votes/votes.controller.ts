import { Body, Controller, Post } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { VotesService } from './votes.service';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  create(@Body() data: Prisma.VoteCreateInput) {
    return this.votesService.create(data);
  }
}
