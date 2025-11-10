import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class StartTableDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ratePerHour?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discount?: number;

  @IsOptional()
  @IsString()
  memberId?: string;
}

