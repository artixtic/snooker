import { IsString, IsOptional, IsEnum, IsDateString, IsInt, IsNumber, IsArray } from 'class-validator';
import { TournamentFormat, TournamentStatus } from '@prisma/client';

export class CreateTournamentDto {
  @IsString()
  name: string;

  @IsEnum(TournamentFormat)
  format: TournamentFormat;

  @IsEnum(TournamentStatus)
  @IsOptional()
  status?: TournamentStatus;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @IsOptional()
  maxPlayers?: number;

  @IsNumber()
  @IsOptional()
  entryFee?: number;

  @IsNumber()
  @IsOptional()
  prizePool?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  participantIds?: string[]; // Array of player/member IDs
}

