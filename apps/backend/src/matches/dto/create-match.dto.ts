import { IsString, IsArray, IsOptional, IsDateString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMatchPlayerDto {
  @IsString()
  playerId: string;

  @IsOptional()
  seatNumber?: number;
}

export class CreateMatchDto {
  @IsString()
  tableId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMatchPlayerDto)
  players: CreateMatchPlayerDto[];

  @IsString()
  @IsOptional()
  @IsEnum(['snooker', 'pool', '8ball', '9ball'])
  gameType?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;
}

