import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('backup')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('status')
  getStatus() {
    return this.backupService.getBackupStatus();
  }

  @Post('trigger')
  async triggerBackup() {
    await this.backupService.triggerBackup();
    return { message: 'Backup triggered successfully' };
  }
}

