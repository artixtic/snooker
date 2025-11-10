import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export enum CreditTransactionType {
  SALE = 'SALE',
  PAYMENT = 'PAYMENT',
  ADJUSTMENT = 'ADJUSTMENT',
  REFUND = 'REFUND',
}

export class CreateCreditTransactionDto {
  @IsString()
  memberId: string;

  @IsOptional()
  @IsString()
  saleId?: string;

  @IsEnum(CreditTransactionType)
  type: CreditTransactionType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

