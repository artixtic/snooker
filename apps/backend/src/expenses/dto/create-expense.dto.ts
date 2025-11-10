import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { ExpenseCategory } from '@prisma/client';

export class CreateExpenseDto {
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

