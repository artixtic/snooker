import { IsString, IsOptional, IsEmail, IsDateString, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  memberNumber: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  memberType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

