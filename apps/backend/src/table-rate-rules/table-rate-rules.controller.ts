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
import { TableRateRulesService } from './table-rate-rules.service';
import { CreateRateRuleDto } from './dto/create-rate-rule.dto';
import { UpdateRateRuleDto } from './dto/update-rate-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('table-rate-rules')
@UseGuards(JwtAuthGuard)
export class TableRateRulesController {
  constructor(private readonly rateRulesService: TableRateRulesService) {}

  @Post()
  create(@Body() createRateRuleDto: CreateRateRuleDto) {
    return this.rateRulesService.create(createRateRuleDto);
  }

  @Get()
  findAll(@Query('tableId') tableId?: string, @Query('isActive') isActive?: string) {
    return this.rateRulesService.findAll(
      tableId,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    );
  }

  @Get('applicable')
  getApplicableRate(
    @Query('tableId') tableId: string,
    @Query('dateTime') dateTime?: string,
  ) {
    return this.rateRulesService.getApplicableRate(
      tableId,
      dateTime ? new Date(dateTime) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rateRulesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRateRuleDto: UpdateRateRuleDto) {
    return this.rateRulesService.update(id, updateRateRuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rateRulesService.remove(id);
  }
}

