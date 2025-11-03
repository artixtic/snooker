import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { InventoryModule } from './inventory/inventory.module';
import { TablesModule } from './tables/tables.module';
import { ShiftsModule } from './shifts/shifts.module';
import { SyncModule } from './sync/sync.module';
import { ReportsModule } from './reports/reports.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    SalesModule,
    InventoryModule,
    TablesModule,
    ShiftsModule,
    SyncModule,
    ReportsModule,
    ActivityLogsModule,
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

