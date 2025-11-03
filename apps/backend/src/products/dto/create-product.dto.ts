import { IsString, IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cost?: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

