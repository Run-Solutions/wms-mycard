import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AcceptWorkOrderService {
  constructor(private prisma: PrismaService) {}

  // Para obtener los WorkOrderFlowPendientes
  async getPendingWorkOrders(areasOperatorIds: number) {
    console.log('Buscando ordenes pendientes...');
    if(!areasOperatorIds) {
      throw new Error('No se proporcionaron areas validas');
    }
    const pendingOrders = await this.prisma.workOrderFlow.findMany({
      where: {
        status: 'Pendiente',
        area_id: areasOperatorIds,
      },
      include: {
        workOrder: {
          include: {
            user: true,
            files: true,
            flow: {
              include: {
                area: true,
              },
            },
          },
        },
      },
    });

    if(pendingOrders.length === 0) {
      return { message: 'No hay ordenes pendientes para esta area.'}
    }
    console.log('Ordenes pendientes desde work-orders services', pendingOrders);
    return pendingOrders;
  }


  // Para que el usuario acepte la orden en su flow
  async acceptWorkOrderFlow(workOrderFlowId: number, userId: number) {
    console.log('Asignando orden al operador...');
    const updated = await this.prisma.workOrderFlow.update({
        where: {
            id: workOrderFlowId,
        },
        data: {
            assigned_user: userId,
            assigned_at: new Date(),
            status: 'En proceso',
        },
        include: {
            user: true,
            area: true,
        }
    });
    return updated;
  }
}
