import { Module } from '@nestjs/common';
import { FreeReviewsController } from './free-reviews.controller';
import { FreeReviewsService } from './free-reviews.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [FreeReviewsController],
  providers: [FreeReviewsService, PrismaService],
})
export class FreeReviewsModule {}
