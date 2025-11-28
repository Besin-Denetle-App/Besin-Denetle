import { Body, Controller, Post } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { VariantsService } from './variants.service';

@Controller('variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post('section1')
  createSection1(@Body() data: Prisma.VariantSection1CreateInput) {
    return this.variantsService.createSection1(data);
  }

  @Post('section2')
  createSection2(@Body() data: Prisma.VariantSection2CreateInput) {
    return this.variantsService.createSection2(data);
  }
}
