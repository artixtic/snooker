import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    // Check if we should use backup database as main database (live mode)
    const useBackupAsMain = configService.get<string>('USE_BACKUP_AS_MAIN', 'false');
    const isUseBackup = useBackupAsMain === 'true' || useBackupAsMain === '1';
    
    if (isUseBackup) {
      const backupDatabaseUrl = configService.get<string>('BACKUP_DATABASE_URL');
      if (backupDatabaseUrl) {
        super({
          datasources: {
            db: {
              url: backupDatabaseUrl,
            },
          },
        });
        return;
      }
    }
    
    // Default: use regular DATABASE_URL
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

