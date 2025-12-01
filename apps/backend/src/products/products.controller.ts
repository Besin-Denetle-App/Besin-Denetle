import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Product } from '../entities';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: Partial<Product>) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':barcode')
  findOne(@Param('barcode') barcode: string) {
    return this.productsService.findOne(barcode);
  }
}
