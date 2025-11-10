import { Module } from '@nestjs/common';
import { KitchenOrdersService } from './kitchen-orders.service';
import { KitchenOrdersController } from './kitchen-orders.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KitchenOrdersController],
  providers: [KitchenOrdersService],
  exports: [KitchenOrdersService],
})
export class KitchenOrdersModule {}

