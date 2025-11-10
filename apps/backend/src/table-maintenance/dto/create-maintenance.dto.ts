import { IsString, IsDateString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { MaintenanceStatus } from '@prisma/client';

export class CreateMaintenanceDto {
  @IsString()
  tableId: string;

  @IsString()
  type: string;

  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

