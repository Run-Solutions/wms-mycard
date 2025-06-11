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
        status: {
          in: ['Pendiente', 'Pendiente parcial'],
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
                areaResponse: true,
                partialReleases: true
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
  async getInconformidadWorkOrders(areasOperatorIds: number, statuses: string[], userId:number) {
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
        assigned_user: userId
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
    console.log('Asignando orden al operador...', workOrderFlowId);
    const workOrder = await this.prisma.workOrderFlow.findUnique({
      where: { id: workOrderFlowId },
    });
    if (!workOrder) throw new Error('Orden de trabajo no encontrada');
    const previousWorkOrderFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        work_order_id: workOrder.work_order_id,
        id: { lt: workOrderFlowId },
      },
      orderBy: { id: 'desc' },
    });
    if(previousWorkOrderFlow) {
      const partial = await this.prisma.partialRelease.findFirst({
        where: {
          work_order_flow_id: previousWorkOrderFlow.id,
          validated: false,
        },
      });
      console.log('partial:', partial);
      if (partial) {
        try {
          await this.prisma.partialRelease.update({
            where: { id: partial.id },
            data: { validated: true },
          });
          console.log('Actualización de partialRelease exitosa');
        } catch (error) {
          console.error('Error al actualizar partialRelease:', error);
        }
      } else {
        console.log('No se encontró partialRelease sin validar para actualizar');
      }
    } else {
      console.log('No se encontró flujo de trabajo anterior');
    }
    const updatedWorkOrderFlow = await this.prisma.workOrderFlow.update({
      where: { id: workOrderFlowId },
      data: {
        assigned_user: userId,
        assigned_at: new Date(),
        status: 'En proceso',
      },
      include: {
        user: true,
        area: true,
      },
    });
    return {
      workOrderFlow: updatedWorkOrderFlow,
    };
  }

  // Para que el usuario marque inconformidad del flow anterior
  async inconformidadWorkOrderFlow(workOrderFlowId: number, userId: number, inconformidad: string) {
    console.log('Marcando inconformidad...');
    const lastCompletedOrPartial = await this.prisma.workOrderFlow.findUnique({
      where: { id: workOrderFlowId },
    });
    const partial = await this.prisma.partialRelease.findFirst({
      where: {
        work_order_flow_id: workOrderFlowId,
        validated: false,
      },
    });
    if (!lastCompletedOrPartial) throw new Error('Flujo no encontrado');
    let createInconformidad: object | null;
    // Si el flujo anterior es parcial o está en estado de 'Parcial' debe crear la inconformidad en el partial
    if (lastCompletedOrPartial.status === 'Parcial' || partial) {
      createInconformidad = await this.prisma.inconformities.create({
        data: {
          partial_release_id: partial?.id,
          comments: inconformidad,
          created_by: userId,
        },
      });
    } else {
      const areasResponse = await this.prisma.areasResponse.findUnique({
        where: { work_order_flow_id: workOrderFlowId },
      });
      if (!areasResponse) throw new Error('Área response no encontrada');
      createInconformidad = await this.prisma.inconformities.create({
        data: {
          areas_response_id: areasResponse.id,
          comments: inconformidad,
          created_by: userId,
        },
      });
    }
    // Actualiza estado a 'En inconformidad'
    const updated = await this.prisma.workOrderFlow.update({
      where: { id: workOrderFlowId },
      data: { status: 'En inconformidad' },
      include: { user: true, area: true },
    });
    // Cambiar estado del siguiente flujo si existe
    await this.updateNextWorkOrderFlow(workOrderFlowId, updated.work_order_id);
    return { updated, createInconformidad };
  }

  // Actualiza siguiente flujo de trabajo a 'En espera' si existe
  private async updateNextWorkOrderFlow(workOrderFlowId: number, workOrderId: number) {
    const nextWorkOrderFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        work_order_id: workOrderId,
        id: { gt: workOrderFlowId },
        status: {
          in: ['Pendiente', 'Pendiente parcial'],
        },
      },
      orderBy: { id: 'asc' },
    });

    if (nextWorkOrderFlow) {
      await this.prisma.workOrderFlow.update({
        where: { id: nextWorkOrderFlow.id },
        data: { status: 'En espera' },
      });
    } else {
      console.log('No se encontró un siguiente WorkOrderFlow.');
    }
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
      },
      orderBy: {
        id: 'desc',
      },
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
        partialReleases: true,
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
                answers: true,
                partialReleases: true,
                user: true,
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
        },
        answers: true,
        user: true,
      },
    });
    if(!workOrderFlow) {
      return { message: 'No se encontró una orden para esta área.'}
    }
    return workOrderFlow;
  } 
}
