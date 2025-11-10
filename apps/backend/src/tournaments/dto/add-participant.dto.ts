import { IsString, IsOptional, IsInt } from 'class-validator';

export class AddParticipantDto {
  @IsString()
  @IsOptional()
  playerId?: string;

  @IsString()
  @IsOptional()
  memberId?: string;

  @IsInt()
  @IsOptional()
  seed?: number;
}

