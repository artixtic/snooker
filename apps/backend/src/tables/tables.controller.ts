import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { StartTableDto } from './dto/start-table.dto';
import { StopTableDto } from './dto/stop-table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tables')
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  findAll() {
    return this.tablesService.findAll();
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

  @Post(':id/stop')
  stop(@Param('id') id: string, @Body() dto: StopTableDto) {
    return this.tablesService.stop(id, dto);
  }
}

