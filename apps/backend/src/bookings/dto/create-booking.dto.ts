import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class CreateBookingDto {
  @IsString()
  tableId: string;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

