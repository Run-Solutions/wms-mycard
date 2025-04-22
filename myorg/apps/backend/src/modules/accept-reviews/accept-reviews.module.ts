import { Module } from '@nestjs/common';
import { AcceptReviewsController } from './accept-reviews.controller';
import { AcceptReviewsService } from './accept-reviews.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [AcceptReviewsController],
  providers: [AcceptReviewsService, PrismaService],
})
export class AcceptReviewsModule {}
