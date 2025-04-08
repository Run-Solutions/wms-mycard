import { Module } from '@nestjs/common';
import { AcceptWorkOrderController } from './accept-work-order.controller';
import { AcceptWorkOrderService } from './accept-work-order.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [AcceptWorkOrderController],
  providers: [AcceptWorkOrderService, PrismaService],
})
export class AcceptWorkOrderModule {}
