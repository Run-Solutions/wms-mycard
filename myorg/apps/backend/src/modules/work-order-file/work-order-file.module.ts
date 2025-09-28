import { Module } from '@nestjs/common';
import { WorkOrderFileController } from './work-order-file.controller';
import { WorkOrderFileService } from './work-order-file.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [WorkOrderFileController],
  providers: [WorkOrderFileService, PrismaService],
  exports: [WorkOrderFileService],
})
export class WorkOrderFileModule {}