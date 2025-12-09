import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class NutritionDto {
  @IsNumber() @IsOptional() calories: number;
  @IsNumber() @IsOptional() protein: number;
  @IsNumber() @IsOptional() carbohydrates: number;
  @IsNumber() @IsOptional() fat: number;
  @IsNumber() @IsOptional() sugars: number;
  @IsNumber() @IsOptional() salt: number;
}

class ProductContentDto {
  @IsString() @IsOptional() ingredients: string;
  @IsString() @IsOptional() allergens: string;
  
  @ValidateNested()
  @Type(() => NutritionDto)
  nutrition: NutritionDto;
}

class ProductInfoDto {
  @IsString() @IsNotEmpty() brand: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsOptional() quantity: string;
}

export class ScanProductDto {
  @IsString()
  @IsNotEmpty()
  barcode: string;

  @IsString()
  @IsNotEmpty()
  imageBase64: string; 
}

export class ConfirmProductDto {
  @IsString() @IsNotEmpty() barcode: string;
  
  @ValidateNested()
  @Type(() => ProductInfoDto)
  product: ProductInfoDto;

  @ValidateNested()
  @Type(() => ProductContentDto)
  content: ProductContentDto;

  @IsString() @IsOptional() analysis: string;
}
