import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Aceptar conexiones desde el Frontend
  },
})
export class DoorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Cliente conectado a Door Gateway');
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado de Door Gateway');
  }

  // Método público para emitir actualizaciones de capacidad
  notifyCapacityUpdate(capacityData: any) {
    this.server.emit('capacityUpdated', capacityData);
  }
}