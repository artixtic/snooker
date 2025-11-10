import { IsString, IsOptional } from 'class-validator';

export class AdvanceWinnerDto {
  @IsString()
  matchId: string;

  @IsString()
  winnerId: string; // Player/Member ID who won

  @IsString()
  @IsOptional()
  nextMatchId?: string; // Next match in bracket
}

