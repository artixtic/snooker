import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Injectable()
export class TableMaintenanceService {
  constructor(private prisma: PrismaService) {}

  async create(createMaintenanceDto: CreateMaintenanceDto, employeeId?: string) {
    const table = await this.prisma.tableSession.findUnique({
      where: { id: createMaintenanceDto.tableId },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${createMaintenanceDto.tableId} not found`);
    }

    return this.prisma.tableMaintenance.create({
      data: {
        ...createMaintenanceDto,
        scheduledDate: new Date(createMaintenanceDto.scheduledDate),
        employeeId,
      },
      include: {
        table: true,
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });
  }

  async findAll(tableId?: string, status?: string) {
    const where: any = {};

    if (tableId) {
      where.tableId = tableId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.tableMaintenance.findMany({
      where,
      include: {
        table: true,
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const maintenance = await this.prisma.tableMaintenance.findUnique({
      where: { id },
      include: {
        table: true,
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!maintenance) {
      throw new NotFoundException(`Maintenance record with ID ${id} not found`);
    }

    return maintenance;
  }

  async update(id: string, updateMaintenanceDto: UpdateMaintenanceDto) {
    await this.findOne(id);

    return this.prisma.tableMaintenance.update({
      where: { id },
      data: {
        ...updateMaintenanceDto,
        scheduledDate: updateMaintenanceDto.scheduledDate
          ? new Date(updateMaintenanceDto.scheduledDate)
          : undefined,
        completedDate: updateMaintenanceDto.status === 'COMPLETED' && !updateMaintenanceDto.completedDate
          ? new Date()
          : updateMaintenanceDto.completedDate
          ? new Date(updateMaintenanceDto.completedDate)
          : undefined,
      },
      include: {
        table: true,
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tableMaintenance.delete({ where: { id } });
  }

  async getOverdue() {
    const now = new Date();
    return this.prisma.tableMaintenance.findMany({
      where: {
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledDate: { lt: now },
      },
      include: {
        table: true,
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async getUpcoming(days: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return this.prisma.tableMaintenance.findMany({
      where: {
        status: { in: ['SCHEDULED'] },
        scheduledDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        table: true,
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }
}

