import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TableMaintenanceService } from './table-maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('table-maintenance')
@UseGuards(JwtAuthGuard)
export class TableMaintenanceController {
  constructor(private readonly maintenanceService: TableMaintenanceService) {}

  @Post()
  create(
    @Body() createMaintenanceDto: CreateMaintenanceDto,
    @CurrentUser() user: any,
  ) {
    return this.maintenanceService.create(createMaintenanceDto, user.id);
  }

  @Get()
  findAll(@Query('tableId') tableId?: string, @Query('status') status?: string) {
    return this.maintenanceService.findAll(tableId, status);
  }

  @Get('overdue')
  getOverdue() {
    return this.maintenanceService.getOverdue();
  }

  @Get('upcoming')
  getUpcoming(@Query('days') days?: string) {
    return this.maintenanceService.getUpcoming(days ? parseInt(days) : 7);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMaintenanceDto: UpdateMaintenanceDto) {
    return this.maintenanceService.update(id, updateMaintenanceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.maintenanceService.remove(id);
  }
}

