import { IsObject, IsOptional, IsString } from 'class-validator';

export class EndMatchDto {
  @IsObject()
  @IsOptional()
  finalScores?: Record<string, number>; // { playerId: finalScore }

  @IsString()
  @IsOptional()
  winnerId?: string; // Player/Member ID who won

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

