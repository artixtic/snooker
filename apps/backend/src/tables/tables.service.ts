import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartTableDto } from './dto/start-table.dto';
import { StopTableDto } from './dto/stop-table.dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tableSession.findMany({
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            memberNumber: true,
          },
        },
      },
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
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            memberNumber: true,
          },
        },
      },
    });
  }

  async updateMember(tableId: string, memberId: string | null) {
    return this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        memberId: memberId || null,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            memberNumber: true,
          },
        },
      },
    });
  }

  async start(tableId: string, dto: StartTableDto) {
    const table = await this.findOne(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    return this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        status: 'OCCUPIED',
        startedAt: new Date(),
        lastResumedAt: new Date(),
        ratePerHour: dto.ratePerHour || table.ratePerHour || 0,
        discount: dto.discount,
        memberId: dto.memberId || table.memberId,
        totalPausedMs: 0, // Reset paused time
        pausedAt: null,
        currentCharge: 0,
      },
      include: {
        member: true,
      },
    });
  }

  async pause(tableId: string) {
    const table = await this.findOne(tableId);
    if (!table || table.status !== 'OCCUPIED') {
      throw new Error('Table is not occupied');
    }

    if (!table.startedAt) {
      throw new Error('Table has no start time');
    }

    const now = new Date();
    const lastResumedAt = table.lastResumedAt || table.startedAt;
    if (!lastResumedAt) {
      throw new Error('Table has no start time');
    }

    // Calculate paused time since last resume
    const pausedSinceLastResume = now.getTime() - lastResumedAt.getTime();
    const newTotalPausedMs = (table.totalPausedMs || 0) + pausedSinceLastResume;

    // Calculate current charge at pause time
    const startTime = table.startedAt.getTime();
    const totalElapsedMs = now.getTime() - startTime;
    const activeTimeMs = totalElapsedMs - newTotalPausedMs;
    const hours = activeTimeMs / (1000 * 60 * 60);
    const currentCharge = hours * Number(table.ratePerHour);

    return this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        status: 'PAUSED',
        pausedAt: now,
        totalPausedMs: newTotalPausedMs,
        currentCharge: currentCharge,
      },
    });
  }

  async resume(tableId: string) {
    const table = await this.findOne(tableId);
    if (!table || table.status !== 'PAUSED') {
      throw new Error('Table is not paused');
    }

    return this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        status: 'OCCUPIED',
        lastResumedAt: new Date(),
        pausedAt: null,
      },
    });
  }

  async stop(tableId: string, dto: StopTableDto, employeeId?: string) {
    const table = await this.findOne(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // If table is not started, just reset it
    if (!table.startedAt || table.status === 'AVAILABLE') {
      return this.reset(tableId);
    }

    // Calculate charge excluding paused time
    const now = Date.now();
    const startTime = table.startedAt.getTime();
    const totalPausedMs = table.totalPausedMs || 0;
    
    // If currently paused, add the current pause duration
    let currentPauseMs = 0;
    if (table.status === 'PAUSED' && table.pausedAt) {
      const lastResumedAt = table.lastResumedAt || table.startedAt;
      currentPauseMs = table.pausedAt.getTime() - lastResumedAt.getTime();
    }
    
    const totalElapsedMs = now - startTime;
    const activeTimeMs = totalElapsedMs - totalPausedMs - currentPauseMs;
    const hours = activeTimeMs / (1000 * 60 * 60);
    const charge = (hours * Number(table.ratePerHour)) - (dto.discount || 0);
    const finalCharge = Math.max(0, charge);

    // Update table
    const updatedTable = await this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        status: 'AVAILABLE',
        endedAt: new Date(),
        currentCharge: finalCharge,
        discount: dto.discount,
        pausedAt: null,
      },
      include: {
        member: true,
      },
    });

    return updatedTable;
  }

  async reset(tableId: string) {
    return this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        status: 'AVAILABLE',
        startedAt: null,
        endedAt: null,
        pausedAt: null,
        lastResumedAt: null,
        totalPausedMs: 0,
        currentCharge: 0,
        discount: null,
        memberId: null,
      },
      include: {
        member: true,
      },
    });
  }

  /**
   * Calculate current charge for an active table (excluding paused time)
   */
  calculateCurrentCharge(table: any): number {
    if (!table.startedAt || table.status === 'AVAILABLE') {
      return 0;
    }

    const now = Date.now();
    const startTime = table.startedAt.getTime();
    const totalPausedMs = table.totalPausedMs || 0;
    
    // If currently paused, add the current pause duration
    let currentPauseMs = 0;
    if (table.status === 'PAUSED' && table.pausedAt) {
      const lastResumedAt = table.lastResumedAt || table.startedAt;
      currentPauseMs = table.pausedAt.getTime() - lastResumedAt.getTime();
    }
    
    const totalElapsedMs = now - startTime;
    const activeTimeMs = totalElapsedMs - totalPausedMs - currentPauseMs;
    const hours = activeTimeMs / (1000 * 60 * 60);
    const charge = hours * Number(table.ratePerHour);
    
    return Math.max(0, charge);
  }
}

