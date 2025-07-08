// myorg/apps/backend/src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ExpoPushService } from './expo-push.service';
import { DeviceTokensService } from './device-tokens.service';

@Injectable()
export class NotificationsService {
  private notificationsQueue: any[] = [];
  private readonly retentionTime = 30000; // 30 segundos
  constructor(
    private prisma: PrismaService,
    private expoPushService: ExpoPushService,
    private deviceTokensService: DeviceTokensService,
  ) {}

  /**
   * Crea la notificación en base de datos y envía push.
   */
  async createAndSendNotification(userId: number, title: string, body: string, data?: Record<string, any>) {
    // 1. Guardar en base de datos
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        data,
      },
    });

    // 2. Obtener tokens
    const tokens = await this.deviceTokensService.getTokensByUser(userId);

    // 3. Enviar push a todos los tokens
    for (const token of tokens) {
      await this.expoPushService.sendPushNotification(token.token, title, body, data);
    }

    return notification;
  }
  async createAndSendNotificationToRole(
    roleName: string, // por ejemplo "Calidad"
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    // 1. Traer todos los usuarios con ese rol
    const users = await this.prisma.user.findMany({
      where: { role: { name: roleName } },
      select: { id: true },
    });
  
    // 2. Para cada usuario, crear notificación y enviar push
    for (const user of users) {
      // Guardar en base
      await this.prisma.notification.create({
        data: {
          userId: user.id,
          title,
          body,
          data,
        },
      });
  
      // Obtener tokens
      const tokens = await this.deviceTokensService.getTokensByUser(user.id);
  
      // Enviar push
      for (const token of tokens) {
        await this.expoPushService.sendPushNotification(
          token.token,
          title,
          body,
          data,
        );
      }
    }
  
    return { message: 'Notificaciones enviadas a todos los usuarios del rol' };
  }

  /**
   * Obtener historial de notificaciones de un usuario.
   */
  async getUserNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Marcar una notificación como leída.
   */
  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Obtener el contador de no leídas.
   */
  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
  sendNotification(notification: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    notification.timestamp = new Date().getTime();
    console.log('Emitiendo notificación:', notification);
    this.notificationsQueue.push(notification);
    // Emite la notificación a todos los clientes conectados
    // (El gateway se encarga de emitir el evento a través del servidor)
    setTimeout(() => {
      this.notificationsQueue = this.notificationsQueue.filter(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (n) => new Date().getTime() - n.timestamp < this.retentionTime,
      );
    }, this.retentionTime);
  }
}