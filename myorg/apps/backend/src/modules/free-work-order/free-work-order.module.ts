import { Module } from '@nestjs/common';
import { FreeWorkOrderController } from './free-work-order.controller';
import { FreeWorkOrderService } from './free-work-order.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [FreeWorkOrderController],
  providers: [FreeWorkOrderService, PrismaService],
})
export class FreeWorkOrderModule {}
