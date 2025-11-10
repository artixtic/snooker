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
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchScoreDto } from './dto/update-match-score.dto';
import { EndMatchDto } from './dto/end-match.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto);
  }

  @Get()
  findAll(@Query('status') status?: string, @Query('tableId') tableId?: string) {
    return this.matchesService.findAll(status, tableId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Patch(':id/score')
  updateScore(@Param('id') id: string, @Body() updateScoreDto: UpdateMatchScoreDto) {
    return this.matchesService.updateScore(id, updateScoreDto);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.matchesService.pause(id);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string) {
    return this.matchesService.resume(id);
  }

  @Patch(':id/end')
  end(@Param('id') id: string, @Body() endMatchDto: EndMatchDto) {
    return this.matchesService.end(id, endMatchDto);
  }

  @Patch(':id/mark-paid')
  markPaid(@Param('id') id: string, @Body('saleId') saleId: string) {
    return this.matchesService.markPaid(id, saleId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.matchesService.delete(id);
  }
}

