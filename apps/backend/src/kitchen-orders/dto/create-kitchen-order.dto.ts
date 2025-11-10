import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { KitchenOrderStatus } from '@prisma/client';

export class CreateKitchenOrderDto {
  @IsString()
  saleId: string;

  @IsString()
  items: string; // JSON string of items

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedTime?: number;
}

