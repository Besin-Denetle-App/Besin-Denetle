import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data });
  }

  findAll() {
    return this.prisma.product.findMany();
  }

  findOne(barcode: string) {
    return this.prisma.product.findUnique({
      where: { barcode },
      include: {
        variantSection1s: {
          include: {
            variantSection2s: true,
            votes: true,
          },
        },
      },
    });
  }
}
