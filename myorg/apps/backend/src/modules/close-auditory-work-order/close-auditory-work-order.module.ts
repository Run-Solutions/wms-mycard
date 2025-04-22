import { Module } from '@nestjs/common';
import { CloseAuditoryWorkOrderController } from './close-auditory-work-order.controller';
import { CloseAuditoryWorkOrderService } from './close-auditory-work-order.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [CloseAuditoryWorkOrderController],
  providers: [CloseAuditoryWorkOrderService, PrismaService],
})
export class CloseAuditoryWorkOrderModule {}
