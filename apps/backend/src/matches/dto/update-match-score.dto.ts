import { IsObject, IsOptional } from 'class-validator';

export class UpdateMatchScoreDto {
  @IsObject()
  @IsOptional()
  score?: Record<string, number>; // { playerId: score }

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>; // Additional match data
}

