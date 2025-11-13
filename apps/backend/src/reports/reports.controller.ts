import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
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

  @Get('range')
  getRange(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD format.');
    }
    
    if (start > end) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }
    
    return this.reportsService.getDateRangeReport(start, end);
  }
}

