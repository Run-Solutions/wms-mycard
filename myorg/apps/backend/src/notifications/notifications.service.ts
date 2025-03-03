import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private notificationsQueue: any[] = [];
  private readonly retentionTime = 30000; // 30 segundos

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

  getPendingNotifications() {
    const now = new Date().getTime();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.notificationsQueue.filter(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (n) => now - n.timestamp < this.retentionTime,
    );
  }
}
