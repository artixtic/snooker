import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateMaintenanceDto } from './create-maintenance.dto';

export class UpdateMaintenanceDto extends PartialType(CreateMaintenanceDto) {
  @IsOptional()
  @IsDateString()
  completedDate?: string;
}

