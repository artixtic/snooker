import { Module } from '@nestjs/common';
import { TableRateRulesService } from './table-rate-rules.service';
import { TableRateRulesController } from './table-rate-rules.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TableRateRulesController],
  providers: [TableRateRulesService],
  exports: [TableRateRulesService],
})
export class TableRateRulesModule {}

