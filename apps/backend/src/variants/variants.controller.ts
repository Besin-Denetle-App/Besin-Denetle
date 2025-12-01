import { Body, Controller, Post } from '@nestjs/common';
import { VariantSection1, VariantSection2 } from '../entities';
import { VariantsService } from './variants.service';

@Controller('variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post('section1')
  createSection1(@Body() data: Partial<VariantSection1>) {
    return this.variantsService.createSection1(data);
  }

  @Post('section2')
  createSection2(@Body() data: Partial<VariantSection2>) {
    return this.variantsService.createSection2(data);
  }
}
