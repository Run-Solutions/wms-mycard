import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('test-notification')
export class TestNotificationController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  testNotification() {
    const notification = {
      message: 'Notificación de prueba desde Postman',
      type: 'info',
      timestamp: new Date().getTime(),
    };

    this.notificationsService.sendNotification(notification);
    return { success: true, message: 'Notificación enviada' };
  }
}
