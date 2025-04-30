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
  
  // Para obtener los WorkOrderFlowPendientes
  async getInconformidadWorkOrders(areasOperatorIds: number, statuses: string[]) {
    console.log('Buscando ordenes pendientes...');
    if(!areasOperatorIds) {
      throw new Error('No se proporcionaron areas validas');
    }
    const pendingOrders = await this.prisma.workOrderFlow.findMany({
      where: {
        status: {
          in: statuses,
        },
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
                    inconformities: true,
                  }
                },
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

  // Para que el usuario acepte la orden en su flow
  async inconformidadWorkOrderFlow(workOrderFlowId: number, userId: number, inconformidad: string) {
    console.log('Marcando inconformidad...');
    const updated = await this.prisma.workOrderFlow.update({
        where: {
            id: workOrderFlowId,
        },
        data: {
            status: 'En inconformidad',
        },
        include: {
            user: true,
            area: true,
        }
    });
    const areasResponse = await this.prisma.areasResponse.findUnique({
      where: {
        work_order_flow_id: workOrderFlowId,
      }
    });
    if (!areasResponse) throw new Error ();
    const createInconformidad = await this.prisma.inconformities.create({
      data: {
        areas_response_id: areasResponse.id,
        comments: inconformidad,
        created_by: userId,
      },
    });
    // Obtiene el flow actual para saber a qué work_order pertenece
    const currentFlow = await this.prisma.workOrderFlow.findUnique({
      where: { id: workOrderFlowId },
    });
    if (!currentFlow) throw new Error('Flujo no encontrado');
    const nextWorkOrderFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        work_order_id: currentFlow.work_order_id,
        id: {
          gt: workOrderFlowId,
        },
        status: 'Pendiente',
      },
      orderBy: {
        id: 'asc',
      },
    });
    if (nextWorkOrderFlow) {
      // Cambiar el estado del siguiente flujo de trabajo a 'En espera'
      await this.prisma.workOrderFlow.update({
        where: {
          id: nextWorkOrderFlow.id,
        },
        data: {
          status: 'En espera',
        },
      });
    } else {
      console.log('No se encontró un siguiente WorkOrderFlow.');
    }
    return {updated, createInconformidad};
  }
  
  // Para que el usuario acepte la orden en su flow
  async inconformidadCQMWorkOrderFlow(workOrderFlowId: number, userId: number, inconformidad: string) {
    console.log('Marcando inconformidad...');
    const updated = await this.prisma.workOrderFlow.update({
        where: {
            id: workOrderFlowId,
        },
        data: {
            status: 'En inconformidad CQM',
        },
        include: {
            user: true,
            area: true,
        }
    });
    const formAnswer = await this.prisma.formAnswer.findFirst({
      where: {
        work_order_flow_id: workOrderFlowId,
      }
    });
    if (!formAnswer) throw new Error ();
    const createInconformidad = await this.prisma.inconformities.create({
      data: {
        form_answer_id: formAnswer.id,
        comments: inconformidad,
        created_by: userId,
      },
    });
    return {updated, createInconformidad};
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
                    serigrafia: true,
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
