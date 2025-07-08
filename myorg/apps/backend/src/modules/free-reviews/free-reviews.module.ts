import { Module } from '@nestjs/common';
import { FreeReviewsController } from './free-reviews.controller';
import { FreeReviewsService } from './free-reviews.service';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [FreeReviewsController],
  providers: [FreeReviewsService, PrismaService],
})
export class FreeReviewsModule {}
