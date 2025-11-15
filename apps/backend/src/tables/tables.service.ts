import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartTableDto } from './dto/start-table.dto';
import { StopTableDto } from './dto/stop-table.dto';
import { CreateTableDto } from './dto/create-table.dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tableSession.findMany({
      include: {
        game: true,
      },
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

    // Get the game to use its default rate
    const game = await this.prisma.game.findUnique({
      where: { id: createTableDto.gameId },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${createTableDto.gameId} not found`);
    }

    const defaultRate = Number(game.defaultRate);

    return this.prisma.tableSession.create({
      data: {
        tableNumber: createTableDto.tableNumber,
        gameId: createTableDto.gameId,
        status: 'AVAILABLE',
        ratePerHour: defaultRate,
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
      include: {
        game: true,
      },
    });
  }

  async start(tableId: string, dto: StartTableDto, employeeId: string) {
    const table = await this.findOne(tableId);
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    // If already occupied, return the table (idempotent for offline queued requests)
    if (table.status === 'OCCUPIED' && table.startedAt) {
      return table;
    }

    // Check if there's any active shift (admin starts shift, employees can use it)
    const activeShift = await this.prisma.shift.findFirst({
      where: {
        status: 'ACTIVE',
      },
    });

    if (!activeShift) {
      throw new BadRequestException('No active shift found. Please ask admin to start a shift before checking in a table.');
    }

    // Get the rate - use provided rate, or table's current rate, or game's default rate, or fallback to 8
    let rate = dto.ratePerHour;
    if (!rate) {
      rate = table.ratePerHour ? Number(table.ratePerHour) : undefined;
    }
    if (!rate && table.game) {
      rate = Number(table.game.defaultRate);
    }
    if (!rate) {
      rate = 8; // Final fallback
    }

    return this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        status: 'OCCUPIED',
        startedAt: new Date(),
        lastResumedAt: new Date(),
        ratePerHour: rate,
        discount: dto.discount,
        totalPausedMs: 0, // Reset paused time
        pausedAt: null,
        currentCharge: 0,
      },
      include: {
        game: true,
      },
    });
  }

  async pause(tableId: string) {
    const table = await this.findOne(tableId);
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    // If already paused, return the table (idempotent)
    if (table.status === 'PAUSED') {
      return table;
    }

    // If table is already available (checked out), return it (idempotent for offline queued requests)
    if (table.status === 'AVAILABLE') {
      return table;
    }

    if (table.status !== 'OCCUPIED') {
      throw new BadRequestException(`Table is ${table.status.toLowerCase()}, cannot pause`);
    }

    if (!table.startedAt) {
      throw new BadRequestException('Table has no start time. Please start the table first.');
    }

    const now = new Date();
    const lastResumedAt = table.lastResumedAt || table.startedAt;
    if (!lastResumedAt) {
      throw new BadRequestException('Table has no start time. Please start the table first.');
    }

    // Calculate current charge at pause time using the game's rate type
    let currentCharge = 0;
    try {
      currentCharge = this.calculateCurrentCharge(table);
    } catch (error) {
      console.error('Error calculating charge for pause:', error);
      // Continue with 0 charge if calculation fails
      currentCharge = 0;
    }

    // When pausing, we just set pausedAt. The pause duration will be added to totalPausedMs when resuming
    return this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        status: 'PAUSED',
        pausedAt: now,
        currentCharge: currentCharge,
        // Don't update totalPausedMs here - it will be updated when resuming
      },
      include: {
        game: true,
      },
    });
  }

  async resume(tableId: string, clientPausedAt?: string) {
    const table = await this.findOne(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // If already occupied, return the table (idempotent)
    if (table.status === 'OCCUPIED') {
      return table;
    }

    // If table is already available (checked out), return it (idempotent for offline queued requests)
    if (table.status === 'AVAILABLE') {
      return table;
    }

    if (table.status !== 'PAUSED') {
      throw new Error('Table is not paused');
    }

    // Use client-provided pausedAt if available (for offline sync scenarios),
    // otherwise use the database pausedAt
    const pausedAtTime = clientPausedAt 
      ? new Date(clientPausedAt).getTime()
      : (table.pausedAt ? table.pausedAt.getTime() : null);

    if (!pausedAtTime) {
      throw new Error('Table has no pause time');
    }

    const now = new Date();
    const pauseDuration = now.getTime() - pausedAtTime;
    const newTotalPausedMs = (table.totalPausedMs || 0) + pauseDuration;

    return this.prisma.tableSession.update({
      where: { id: tableId },
      data: {
        status: 'OCCUPIED',
        lastResumedAt: now,
        pausedAt: null,
        totalPausedMs: newTotalPausedMs,
      },
      include: {
        game: true,
      },
    });
  }

  async stop(tableId: string, dto: StopTableDto, employeeId?: string) {
    const table = await this.findOne(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // If table is already available (checked out), return it (idempotent for offline queued requests)
    if (table.status === 'AVAILABLE') {
      return table;
    }

    // If table is not started, just reset it
    if (!table.startedAt) {
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
   * Uses game's rate type to determine if rate is per minute or per hour
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
    
    // Get rate type from game, default to PER_MINUTE
    const rateType = table.game?.rateType || 'PER_MINUTE';
    const rate = Number(table.ratePerHour);
    
    let charge = 0;
    if (rateType === 'PER_HOUR') {
      // Rate is per hour
      const hours = activeTimeMs / (1000 * 60 * 60);
      charge = hours * rate;
    } else {
      // Rate is per minute (default)
      const minutes = activeTimeMs / (1000 * 60);
      charge = minutes * rate;
    }
    
    return Math.max(0, charge);
  }
}

