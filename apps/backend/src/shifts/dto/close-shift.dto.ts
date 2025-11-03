import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CloseShiftDto {
  @IsNumber()
  @Type(() => Number)
  closingCash: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

