import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { StartShiftDto } from './dto/start-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  findAll() {
    return this.shiftsService.findAll();
  }

  @Get(':id/report')
  getShiftReport(@Param('id') id: string) {
    return this.shiftsService.getShiftReport(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Post('start')
  @Roles(UserRole.ADMIN)
  start(@Body() dto: StartShiftDto, @CurrentUser() user: any) {
    return this.shiftsService.start(user.id, dto);
  }

  @Post(':id/close')
  @Roles(UserRole.ADMIN)
  close(@Param('id') id: string, @Body() dto: CloseShiftDto) {
    return this.shiftsService.close(id, dto);
  }
}
