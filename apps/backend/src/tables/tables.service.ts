import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartTableDto } from './dto/start-table.dto';
import { StopTableDto } from './dto/stop-table.dto';
import { CreateTableDto } from './dto/create-table.dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tableSession.findMany({
      orderBy: { tableNumber: 'asc' },
    });
  }

  async create(createTableDto: CreateTableDto) {
    // Check if table number already exists
    const existing = await this.prisma.tableSession.findUnique({
      where: { tableNumber: createTableDto.tableNumber },
    });

    if (existing) {
      throw new ConflictException(`Table ${createTableDto.tableNumber} already exists`);
    }

    return this.prisma.tableSession.create({
      data: {
        tableNumber: createTableDto.tableNumber,
        status: 'AVAILABLE',
        ratePerHour: 8, // Default rate per minute
      },
    });
  }

  async remove(id: string) {
    const table = await this.findOne(id);
    if (!table) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    // Check if table is currently in use
    if (table.status === 'OCCUPIED' || table.status === 'PAUSED') {
      throw new ConflictException('Cannot delete table that is currently in use');
    }

    return this.prisma.tableSession.delete({
      where: { id },
    });
  }

  async removeAll() {
    // Only delete tables that are available (not in use)
    return this.prisma.tableSession.deleteMany({
      where: {
        status: 'AVAILABLE',
      },
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
        ratePerHour: dto.ratePerHour || table.ratePerHour || 8, // Default to 8 PKR per minute (ratePerHour field stores per minute)
        discount: dto.discount,
        totalPausedMs: 0, // Reset paused time
        pausedAt: null,
        currentCharge: 0,
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

    // Calculate current charge at pause time (before adding pause duration)
    // ratePerHour is actually stored as per minute
    const startTime = table.startedAt.getTime();
    const totalElapsedMs = now.getTime() - startTime;
    const totalPausedMs = table.totalPausedMs || 0;
    const activeTimeMs = totalElapsedMs - totalPausedMs;
    const minutes = activeTimeMs / (1000 * 60);
    const currentCharge = minutes * Number(table.ratePerHour);

    // When pausing, we just set pausedAt. The pause duration will be added to totalPausedMs when resuming
    return this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        status: 'PAUSED',
        pausedAt: now,
        currentCharge: currentCharge,
        // Don't update totalPausedMs here - it will be updated when resuming
      },
    });
  }

  async resume(tableId: string) {
    const table = await this.findOne(tableId);
    if (!table || table.status !== 'PAUSED') {
      throw new Error('Table is not paused');
    }

    if (!table.pausedAt) {
      throw new Error('Table has no pause time');
    }

    const now = new Date();
    const pauseDuration = now.getTime() - table.pausedAt.getTime();
    const newTotalPausedMs = (table.totalPausedMs || 0) + pauseDuration;

    return this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        status: 'OCCUPIED',
        lastResumedAt: now,
        pausedAt: null,
        totalPausedMs: newTotalPausedMs,
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
    let totalPausedMs = table.totalPausedMs || 0;
    
    // If currently paused, add the current pause duration (it hasn't been added to totalPausedMs yet)
    if (table.status === 'PAUSED' && table.pausedAt) {
      const pauseDuration = now - table.pausedAt.getTime();
      totalPausedMs += pauseDuration;
    }
    
    // ratePerHour is actually stored as per minute
    const totalElapsedMs = now - startTime;
    const activeTimeMs = totalElapsedMs - totalPausedMs;
    const minutes = activeTimeMs / (1000 * 60);
    const charge = (minutes * Number(table.ratePerHour)) - (dto.discount || 0);
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
    // ratePerHour is actually stored as per minute
    const minutes = activeTimeMs / (1000 * 60);
    const charge = minutes * Number(table.ratePerHour);
    
    return Math.max(0, charge);
  }
}

