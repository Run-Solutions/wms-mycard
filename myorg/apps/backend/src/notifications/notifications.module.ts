// myorg/apps/backend/src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ExpoPushService } from './expo-push.service';
import { DeviceTokensService } from './device-tokens.service';
import { PrismaService } from 'prisma/prisma.service';
import { DeviceTokensController } from './device-tokens.controller';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [DeviceTokensController, NotificationsController],
  providers: [PrismaService, NotificationsService, ExpoPushService, DeviceTokensService],
  exports: [NotificationsService, DeviceTokensService],
})
export class NotificationsModule {}