import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  getDaily(@Query('date') date?: string) {
    const reportDate = date ? new Date(date) : new Date();
    return this.reportsService.getDailyReport(reportDate);
  }
}

