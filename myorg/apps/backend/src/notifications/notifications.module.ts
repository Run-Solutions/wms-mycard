import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { TestNotificationController } from './test-notification.controller';

@Module({
  providers: [NotificationsService, NotificationsGateway],
  controllers: [TestNotificationController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
