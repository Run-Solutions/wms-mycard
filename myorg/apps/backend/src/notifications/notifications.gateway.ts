// myorg/apps/backend/src/notifications/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
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
    // Esperamos que el cliente envíe su userId en un mensaje
  }

  handleDisconnect(client: Socket): void {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  /**
   * Cuando el cliente solicita sus notificaciones
   */
  @SubscribeMessage('getNotifications')
  async handleGetNotifications(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const notifications = await this.notificationsService.getUserNotifications(userId);
    notifications.forEach((notification) => {
      client.emit('notification', notification);
    });
  }
}