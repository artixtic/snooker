import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { StartTableDto } from './dto/start-table.dto';
import { StopTableDto } from './dto/stop-table.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tables')
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  findAll() {
    return this.tablesService.findAll();
  }

  @Post()
  create(@Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto);
  }

  @Delete('all')
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
  start(@Param('id') id: string, @Body() dto: StartTableDto) {
    return this.tablesService.start(id, dto);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.tablesService.pause(id);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string) {
    return this.tablesService.resume(id);
  }

  @Post(':id/stop')
  stop(@Param('id') id: string, @Body() dto: StopTableDto, @CurrentUser() user: any) {
    return this.tablesService.stop(id, dto, user.id);
  }

  @Post(':id/reset')
  reset(@Param('id') id: string) {
    return this.tablesService.reset(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}

