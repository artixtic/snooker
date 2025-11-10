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
  Request,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { AdvanceWinnerDto } from './dto/advance-winner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tournaments')
@UseGuards(JwtAuthGuard)
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  create(@Body() createTournamentDto: CreateTournamentDto, @Request() req: any) {
    return this.tournamentsService.create(createTournamentDto, req.user.id);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.tournamentsService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findOne(id);
  }

  @Post(':id/participants')
  addParticipant(@Param('id') id: string, @Body() addParticipantDto: AddParticipantDto) {
    return this.tournamentsService.addParticipant(id, addParticipantDto);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.tournamentsService.start(id);
  }

  @Post(':id/advance')
  advanceWinner(@Param('id') id: string, @Body() advanceWinnerDto: AdvanceWinnerDto) {
    return this.tournamentsService.advanceWinner(id, advanceWinnerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tournamentsService.delete(id);
  }
}

