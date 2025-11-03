import { IsString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateInventoryMovementDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  change: number; // positive = increase, negative = decrease

  @IsString()
  @IsNotEmpty()
  reason: string;
}

