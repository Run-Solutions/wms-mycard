import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from '../src/notifications/notifications.service';

@Controller('test-notification')
export class TestNotificationController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  testNotification() {
    const notification = {
      message: 'Notificación de prueba desde Postman',
      type: 'info', // puedes cambiar a 'success', 'error', 'warning', etc.
      timestamp: new Date().getTime(),
    };

    this.notificationsService.sendNotification(notification);

    return { success: true, message: 'Notificación enviada' };
  }
}
