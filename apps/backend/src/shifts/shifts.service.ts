import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartShiftDto } from './dto/start-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.shift.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findActive(employeeId: string) {
    return this.prisma.shift.findFirst({
      where: {
        employeeId,
        status: 'ACTIVE',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    return shift;
  }

  async start(employeeId: string, dto: StartShiftDto) {
    // Check if there's an active shift
    const activeShift = await this.findActive(employeeId);
    if (activeShift) {
      throw new Error('Employee already has an active shift');
    }

    return this.prisma.shift.create({
      data: {
        employeeId,
        openingCash: dto.openingCash,
        status: 'ACTIVE',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async close(id: string, dto: CloseShiftDto) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
    if (shift.status === 'CLOSED') {
      throw new Error('Shift is already closed');
    }

    // Calculate sales total for this shift
    const sales = await this.prisma.sale.findMany({
      where: {
        employeeId: shift.employeeId,
        createdAt: {
          gte: shift.startedAt,
          lte: new Date(),
        },
      },
    });

    const salesTotal = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const cashDiscrepancy = Number(dto.closingCash) - (Number(shift.openingCash) + salesTotal);

    return this.prisma.shift.update({
      where: { id },
      data: {
        status: 'CLOSED',
        endedAt: new Date(),
        closingCash: dto.closingCash,
        salesTotal,
        cashDiscrepancy,
        notes: dto.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}

