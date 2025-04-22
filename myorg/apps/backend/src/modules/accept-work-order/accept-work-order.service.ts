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
                areaResponse: true,
              },
            },
          },
        },
        areaResponse: {
          include: {
            prepress: true,
            user: true,
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

  // Para obtener una Orden de Trabajo En Proceso por ID
  async getWorkOrderFlowById(id: number, areasOperatorIds: number) {
    const workOrderFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        id: id,
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
                areaResponse: {
                  include: {
                    prepress: true,
                    impression: true,
                    empalme: true,
                    laminacion: true,
                    corte: true,
                    colorEdge: true,
                    hotStamping: true,
                    millingChip: true,
                    personalizacion: true,
                  },
                },
              }
            },
          },
        },
        area: true,
        areaResponse: {
          include: {
            prepress: true,
            impression: true,
            empalme: true,
            corte: true,
            colorEdge: true,
            hotStamping: true,
            millingChip: true,
            personalizacion: true,
          }
        }
      },
    });
    if(!workOrderFlow) {
      return { message: 'No se encontró una orden para esta área.'}
    }
    return workOrderFlow;
  } 
}
