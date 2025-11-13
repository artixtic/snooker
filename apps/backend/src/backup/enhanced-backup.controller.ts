import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { EnhancedBackupService } from './enhanced-backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class EnhancedBackupController {
  constructor(private readonly backupService: EnhancedBackupService) {}

  @Get('status')
  getStatus() {
    return this.backupService.getStatus();
  }

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async triggerBackup() {
    await this.backupService.triggerBackup();
    return { message: 'Backup triggered successfully' };
  }

  @Get('history')
  async getHistory(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.backupService.getBackupHistory(limitNum);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  async exportBackup(@Body('includeHistory') includeHistory = false) {
    const filepath = await this.backupService.exportBackup(includeHistory);
    return {
      message: 'Backup exported successfully',
      filepath,
    };
  }

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  async restoreBackup(
    @Body('filepath') filepath: string,
    @Body('target') target: 'MAIN' | 'BACKUP' = 'MAIN',
  ) {
    await this.backupService.restoreFromFile(filepath, target);
    return {
      message: 'Backup restored successfully',
      target,
    };
  }

  @Get('conflicts')
  async getConflicts() {
    return this.backupService.getSyncConflicts();
  }

  @Post('conflicts/:entity/:entityId/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveConflict(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
    @Body('resolution') resolution: 'MAIN' | 'BACKUP' | 'MERGE',
  ) {
    await this.backupService.resolveConflict(entity, entityId, resolution);
    return {
      message: 'Conflict resolved successfully',
      entity,
      entityId,
      resolution,
    };
  }

  @Get('stats')
  async getStats() {
    const status = this.backupService.getStatus();
    const history = await this.backupService.getBackupHistory(10);
    const conflicts = await this.backupService.getSyncConflicts();

    return {
      status,
      recentBackups: history,
      activeConflicts: conflicts.length,
      conflicts,
    };
  }
}

