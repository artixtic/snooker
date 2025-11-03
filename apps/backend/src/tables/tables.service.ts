import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartTableDto } from './dto/start-table.dto';
import { StopTableDto } from './dto/stop-table.dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tableSession.findMany({
      orderBy: { tableNumber: 'asc' },
    });
  }

  async findActive() {
    return this.prisma.tableSession.findMany({
      where: { status: 'OCCUPIED' },
      orderBy: { tableNumber: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.tableSession.findUnique({
      where: { id },
    });
  }

  async start(tableId: string, dto: StartTableDto) {
    return this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        status: 'OCCUPIED',
        startedAt: new Date(),
        ratePerHour: dto.ratePerHour || 0,
        discount: dto.discount,
      },
    });
  }

  async stop(tableId: string, dto: StopTableDto) {
    const table = await this.findOne(tableId);
    if (!table || !table.startedAt) {
      throw new Error('Table is not started');
    }

    // Calculate charge
    const hours = (Date.now() - table.startedAt.getTime()) / (1000 * 60 * 60);
    const charge = (hours * Number(table.ratePerHour)) - (dto.discount || 0);

    return this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        status: 'AVAILABLE',
        endedAt: new Date(),
        currentCharge: charge,
        discount: dto.discount,
      },
    });
  }
}

