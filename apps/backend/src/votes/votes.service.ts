import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.VoteCreateInput) {
    return this.prisma.vote.create({ data });
  }
}
