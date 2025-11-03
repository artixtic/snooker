import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class StartShiftDto {
  @IsNumber()
  @Type(() => Number)
  openingCash: number;
}

