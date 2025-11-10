import { Module } from '@nestjs/common';
import { TableMaintenanceService } from './table-maintenance.service';
import { TableMaintenanceController } from './table-maintenance.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TableMaintenanceController],
  providers: [TableMaintenanceService],
  exports: [TableMaintenanceService],
})
export class TableMaintenanceModule {}

