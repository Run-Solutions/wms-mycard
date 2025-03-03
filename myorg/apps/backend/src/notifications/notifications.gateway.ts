import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({ cors: true })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly notificationsService: NotificationsService) {}

  handleConnection(client: Socket): void {
    console.log(`Cliente conectado: ${client.id}`);
    // Al conectarse, se envían las notificaciones pendientes (si las hay)
    const pending = this.notificationsService.getPendingNotifications();
    pending.forEach((notification) => {
      client.emit('notification', notification);
    });
  }

  handleDisconnect(client: Socket): void {
    console.log(`Cliente desconectado: ${client.id}`);
  }
}
