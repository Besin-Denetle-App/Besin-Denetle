import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfirmProductDto, ScanProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('scan')
  @ApiOperation({ summary: 'Scan a barcode with image. AI checks if it is food.' })
  scan(@Body() dto: ScanProductDto) {
    return this.productsService.scan(dto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm AI result and save to DB' })
  confirm(@Body() dto: ConfirmProductDto) {
    return this.productsService.confirm(dto);
  }
}
