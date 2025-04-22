import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AcceptReviewsService {
  constructor(private prisma: PrismaService) {}

  // Para obtener los WorkOrderFlowPendientes
  async getPendingWorkOrders() {
    console.log('Buscando ordenes pendientes...');
    const pendingOrders = await this.prisma.workOrderFlow.findMany({
      where: {
        status: 'Enviado a CQM',
      },
      include: {
        user: true,
        area: true,
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
        answers: true,
      },
    });

    if(pendingOrders.length === 0) {
      return { message: 'No hay ordenes pendientes por revisar.'}
    }
    console.log('Ordenes pendientes desde accept-reviews service');
    return pendingOrders;
  }

  // Para que el operador calidad acepte la orden
  async acceptWorkOrderFlowCQM(id: number, userId: number){
    console.log('Asignando orden al operador...');

    // Se actualiza el formAnswer
    const updated = await this.prisma.formAnswer.update({
      where: {
        id: id, // Aquí debes usar el 'id' que es la clave primaria
      },
      data: {
        reviewed_by_id: userId,
        reviewer_assigned_at: new Date(),
      },
      include: {
        reviewer: true,
      }
    });
    
    // Se actualiza el status del WorkOrderFlow
    await this.prisma.workOrderFlow.update({
      where: {
        id: updated.work_order_flow_id,
      },
      data: {
        status: 'En Calidad',
      }
    });
    return updated;
  }
}
