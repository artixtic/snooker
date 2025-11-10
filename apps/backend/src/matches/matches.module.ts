import { Module, forwardRef } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, forwardRef(() => WebSocketModule)],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}

