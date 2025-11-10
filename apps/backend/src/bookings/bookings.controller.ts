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
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findAll(startDate, endDate, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Post(':id/check-in')
  checkIn(@Param('id') id: string) {
    return this.bookingsService.checkIn(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }
}

