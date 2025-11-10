import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreateCreditTransactionDto } from './dto/create-credit-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post('transactions')
  createTransaction(
    @Body() dto: CreateCreditTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.creditsService.createTransaction(dto, user.id);
  }

  @Get('outstanding')
  getOutstandingCredits() {
    return this.creditsService.getOutstandingCredits();
  }

  @Get('members/:memberId/transactions')
  getMemberTransactions(@Param('memberId') memberId: string) {
    return this.creditsService.getMemberTransactions(memberId);
  }
}

