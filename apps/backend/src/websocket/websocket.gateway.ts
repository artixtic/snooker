import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
}

