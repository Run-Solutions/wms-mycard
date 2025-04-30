import { Module } from '@nestjs/common';
import { InconformitiesController } from './inconformities.controller';
import { InconformitiesService } from './inconformities.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [InconformitiesController],
  providers: [InconformitiesService, PrismaService],
})
export class InconformitiesModule {}
