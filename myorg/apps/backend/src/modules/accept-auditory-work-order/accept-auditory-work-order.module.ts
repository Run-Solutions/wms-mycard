import { Module } from '@nestjs/common';
import { AcceptAuditoryWorkOrderController } from './accept-auditory-work-order.controller';
import { AcceptAuditoryWorkOrderService } from './accept-auditory-work-order.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [AcceptAuditoryWorkOrderController],
  providers: [AcceptAuditoryWorkOrderService, PrismaService],
})
export class AcceptAuditoryWorkOrderModule {}
