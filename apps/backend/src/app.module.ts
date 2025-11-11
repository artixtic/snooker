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
import { ExpensesModule } from './expenses/expenses.module';
import { BookingsModule } from './bookings/bookings.module';
import { TableMaintenanceModule } from './table-maintenance/table-maintenance.module';
import { TableRateRulesModule } from './table-rate-rules/table-rate-rules.module';
import { KitchenOrdersModule } from './kitchen-orders/kitchen-orders.module';
import { MatchesModule } from './matches/matches.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { GamesModule } from './games/games.module';

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
    ExpensesModule,
    BookingsModule,
    TableMaintenanceModule,
    TableRateRulesModule,
    KitchenOrdersModule,
    MatchesModule,
    TournamentsModule,
    GamesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

