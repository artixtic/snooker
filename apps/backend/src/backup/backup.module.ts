import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { BackupService } from './backup.service';
import { EnhancedBackupService } from './enhanced-backup.service';
import { BackupController } from './backup.controller';
import { EnhancedBackupController } from './enhanced-backup.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    PrismaModule,
    WebSocketModule,
  ],
  providers: [
    BackupService, // Keep old service for backward compatibility
    EnhancedBackupService, // New enhanced service
  ],
  controllers: [
    BackupController, // Keep old controller for backward compatibility
    EnhancedBackupController, // New enhanced controller
  ],
  exports: [EnhancedBackupService],
})
export class BackupModule {}

