import { IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTableDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  tableNumber: number;

  @IsString()
  gameId: string;
}

