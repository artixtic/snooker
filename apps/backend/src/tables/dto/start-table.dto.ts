import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StartTableDto {
  @IsNumber()
  @Type(() => Number)
  ratePerHour?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discount?: number;
}

