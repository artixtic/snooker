import { IsString, IsOptional, IsInt } from 'class-validator';

export class AddParticipantDto {
  @IsString()
  playerId: string;

  @IsInt()
  @IsOptional()
  seed?: number;
}

