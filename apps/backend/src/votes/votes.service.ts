import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from '../entities';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
  ) {}

  // Yeni oy oluştur
  create(data: Partial<Vote>) {
    const vote = this.voteRepository.create(data);
    return this.voteRepository.save(vote);
  }
}
