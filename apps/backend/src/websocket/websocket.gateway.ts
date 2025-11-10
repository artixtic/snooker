import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@NestWebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('match:join')
  handleMatchJoin(client: Socket, @MessageBody() data: { matchId: string }) {
    client.join(`match:${data.matchId}`);
    console.log(`Client ${client.id} joined match room: ${data.matchId}`);
  }

  @SubscribeMessage('match:leave')
  handleMatchLeave(client: Socket, @MessageBody() data: { matchId: string }) {
    client.leave(`match:${data.matchId}`);
    console.log(`Client ${client.id} left match room: ${data.matchId}`);
  }

  // Emit events for real-time updates
  emitProductUpdated(product: any) {
    this.server.emit('product.updated', product);
  }

  emitInventoryLow(products: any[]) {
    this.server.emit('inventory.low', products);
  }

  emitTableStarted(table: any) {
    this.server.emit('table.started', table);
  }

  emitTableStopped(table: any) {
    this.server.emit('table.stopped', table);
  }

  emitSyncComplete(data: any) {
    this.server.emit('sync.complete', data);
  }

  // Match scoring events
  emitMatchScoreUpdate(matchId: string, scores: any) {
    this.server.to(`match:${matchId}`).emit('match:score:update', {
      matchId,
      scores,
      timestamp: new Date().toISOString(),
    });
  }

  emitMatchStatusUpdate(matchId: string, status: string, match: any) {
    this.server.to(`match:${matchId}`).emit('match:status:update', {
      matchId,
      status,
      match,
      timestamp: new Date().toISOString(),
    });
  }

  emitMatchEnded(matchId: string, match: any) {
    this.server.to(`match:${matchId}`).emit('match:ended', {
      matchId,
      match,
      timestamp: new Date().toISOString(),
    });
  }

  // Tournament events
  emitTournamentUpdate(tournamentId: string, tournament: any) {
    this.server.to(`tournament:${tournamentId}`).emit('tournament:update', {
      tournamentId,
      tournament,
      timestamp: new Date().toISOString(),
    });
  }
}

