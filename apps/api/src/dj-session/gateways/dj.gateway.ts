import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001', // ← Puerto de Next.js
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/',
})
export class DjGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('✅ Cliente conectado a DJ Gateway', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('❌ Cliente desconectado de DJ Gateway', client.id);
  }

  // Método público para emitir la cola ordenada
  notifyQueueUpdate(queue: any[]) {
    // 'queueUpdated' es el evento que escucha el Frontend
    this.server.emit('queueUpdated', queue);
  }

    notifyBattleStarted(data: { sessionId: string; genreIds: string[] }) {
    this.server.emit('battleStarted', data);
  }

  notifyBattleUpdated(results: any) {
    // results = { "genre-id-1": 15, "genre-id-2": 30 }
    this.server.emit('battleUpdated', results);
  }

  notifyBattleEnded(data: { sessionId: string }) {
    this.server.emit('battleEnded', data);
  }

  // --- FIDELIZACIÓN / CLIENTE (NUEVO) ---

  notifyPointsUpdated(data: { customerId: string; points: number }) {
    this.server.emit('pointsUpdated', data);
  }
}