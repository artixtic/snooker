import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { StartTableDto } from './dto/start-table.dto';
import { StopTableDto } from './dto/stop-table.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  findAll() {
    return this.tablesService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto);
  }

  @Delete('all')
  @Roles(UserRole.ADMIN)
  removeAll() {
    return this.tablesService.removeAll();
  }

  @Get('active')
  findActive() {
    return this.tablesService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Post(':id/start')
  start(@Param('id') id: string, @Body() dto: StartTableDto, @CurrentUser() user: any) {
    return this.tablesService.start(id, dto, user.id);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.tablesService.pause(id);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string, @Body() body?: { pausedAt?: string }) {
    return this.tablesService.resume(id, body?.pausedAt);
  }

  @Post(':id/stop')
  stop(@Param('id') id: string, @Body() dto: StopTableDto, @CurrentUser() user: any) {
    return this.tablesService.stop(id, dto, user.id);
  }

  @Post(':id/reset')
  @Roles(UserRole.ADMIN)
  reset(@Param('id') id: string) {
    return this.tablesService.reset(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}

