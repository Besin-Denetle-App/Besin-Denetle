import { Body, Controller, Post } from '@nestjs/common';
import { Vote } from '../entities';
import { VotesService } from './votes.service';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  create(@Body() data: Partial<Vote>) {
    return this.votesService.create(data);
  }
}
