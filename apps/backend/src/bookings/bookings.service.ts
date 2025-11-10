import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto) {
    const { tableId, startTime, endTime } = createBookingDto;

    // Check if table exists
    const table = await this.prisma.tableSession.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${tableId} not found`);
    }

    // Check for overlapping bookings
    const overlapping = await this.prisma.booking.findFirst({
      where: {
        tableId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
        },
        OR: [
          {
            startTime: { lte: new Date(endTime) },
            endTime: { gte: new Date(startTime) },
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('Table is already booked for this time slot');
    }

    return this.prisma.booking.create({
      data: {
        ...createBookingDto,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
      include: {
        table: true,
        member: true,
      },
    });
  }

  async findAll(startDate?: string, endDate?: string, status?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        table: true,
        member: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        table: true,
        member: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    await this.findOne(id);

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...updateBookingDto,
        startTime: updateBookingDto.startTime ? new Date(updateBookingDto.startTime) : undefined,
        endTime: updateBookingDto.endTime ? new Date(updateBookingDto.endTime) : undefined,
      },
      include: {
        table: true,
        member: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.booking.delete({ where: { id } });
  }

  async checkIn(id: string) {
    const booking = await this.findOne(id);

    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      throw new BadRequestException('Only confirmed or pending bookings can be checked in');
    }

    // Update booking status
    await this.prisma.booking.update({
      where: { id },
      data: { status: 'CHECKED_IN' },
    });

    // Start table session if not already started
    const table = await this.prisma.tableSession.findUnique({
      where: { id: booking.tableId },
    });

    if (table && table.status === 'AVAILABLE') {
      await this.prisma.tableSession.update({
        where: { id: booking.tableId },
        data: {
          status: 'OCCUPIED',
          startedAt: new Date(),
          memberId: booking.memberId,
        },
      });
    }

    return this.findOne(id);
  }

  async cancel(id: string) {
    const booking = await this.findOne(id);

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}

