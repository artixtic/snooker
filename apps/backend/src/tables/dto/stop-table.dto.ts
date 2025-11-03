import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StopTableDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discount?: number;
}

