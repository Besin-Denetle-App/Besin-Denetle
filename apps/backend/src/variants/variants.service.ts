import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VariantsService {
  constructor(private prisma: PrismaService) {}

  createSection1(data: Prisma.VariantSection1CreateInput) {
    return this.prisma.variantSection1.create({ data });
  }

  createSection2(data: Prisma.VariantSection2CreateInput) {
    return this.prisma.variantSection2.create({ data });
  }
}
