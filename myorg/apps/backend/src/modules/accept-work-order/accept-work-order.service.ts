import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AcceptWorkOrderService {
  constructor(private prisma: PrismaService) {}

  // Para obtener los WorkOrderFlowPendientes
  async getPendingWorkOrders(areasOperatorIds: number) {
    console.log('Buscando ordenes pendientes...');
    if (!areasOperatorIds) {
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
                partialReleases: true,
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

    if (pendingOrders.length === 0) {
      return { message: 'No hay ordenes pendientes para esta area.' };
    }
    console.log('Ordenes pendientes desde work-orders services', pendingOrders);
    return pendingOrders;
  }

  // Para obtener los WorkOrderFlowPendientes
  async getInconformidadWorkOrders(
    role_id: number,
    areasOperatorIds: number,
    statuses: string[],
    userId: number,
  ) {
    console.log('Buscando órdenes pendientes...');

    if (!areasOperatorIds && role_id === 2) {
      throw new Error('No se proporcionaron áreas válidas');
    }
    const pendingOrders = await this.prisma.workOrderFlow.findMany({
      where: {
        status: {
          in: statuses,
        },
        area_id: areasOperatorIds,
        assigned_user: userId,
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
                  },
                },
              },
            },
          },
        },
      },
    });

    const pendingOrdersAuditory = await this.prisma.workOrderFlow.findMany({
      where: {
        status: {
          in: statuses,
        },
        formAuditory: {
          some: {
            OR: [{ reviewed_by_id: userId }],
          },
        },
      },
      include: {
        workOrder: {
          include: {
            user: true,
            files: true,
            flow: {
              include: {
                area: true,
                formAuditory: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (pendingOrders.length === 0 && pendingOrdersAuditory.length === 0) {
      return { message: 'No hay órdenes pendientes para esta área.' };
    }

    console.log('Órdenes pendientes desde work-orders services', pendingOrders);

    return {
      pendingOrders,
      pendingOrdersAuditory,
    };
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
    if (previousWorkOrderFlow) {
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
        console.log(
          'No se encontró partialRelease sin validar para actualizar',
        );
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
  async acceptWorkOrderFlowAfterCorte(workOrderFlowId: number, userId: number) {
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
    if (previousWorkOrderFlow) {
      const partial = await this.prisma.partialRelease.findFirst({
        where: {
          work_order_flow_id: previousWorkOrderFlow.id,
          validated: true,
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
        console.log(
          'No se encontró partialRelease sin validar para actualizar',
        );
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
  async inconformidadWorkOrderFlow(
    workOrderFlowId: number,
    userId: number,
    inconformidad: string,
  ) {
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
          reviewed: false,
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
          reviewed: false,
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
  private async updateNextWorkOrderFlow(
    workOrderFlowId: number,
    workOrderId: number,
  ) {
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
  async inconformidadCQMWorkOrderFlow(
    workOrderFlowId: number,
    userId: number,
    inconformidad: string,
  ) {
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
      },
    });
    const formAnswer = await this.prisma.formAnswer.findFirst({
      where: {
        work_order_flow_id: workOrderFlowId,
      },
      orderBy: {
        id: 'desc',
      },
    });
    if (!formAnswer) throw new Error();
    const createInconformidad = await this.prisma.inconformities.create({
      data: {
        form_answer_id: formAnswer.id,
        comments: inconformidad,
        created_by: userId,
      },
    });
    return { updated, createInconformidad };
  }

  async inconformidadAuditoryWorkOrderFlow(
    workOrderFlowId: number,
    userId: number,
    inconformidad: string,
  ) {
    console.log('Marcando inconformidad...');
    const currentFlow = await this.prisma.workOrderFlow.findUnique({
      where: { id: workOrderFlowId },
    });
    if (!currentFlow) {
      throw new Error(
        `No se encontró el workOrderFlow con id ${workOrderFlowId}`,
      );
    }
  
    const updated = await this.prisma.workOrderFlow.update({
      where: { id: workOrderFlowId },
      data: { status: 'En inconformidad auditoria' },
      include: { user: true, area: true },
    });
  
    // 3. Buscar el siguiente flujo por orden
    const siguiente = await this.prisma.workOrderFlow.findFirst({
      where: {
        work_order_id: currentFlow.work_order_id,
        id: { gt: currentFlow.id },
      },
      orderBy: { id: 'asc' },
    });
  
    if (siguiente?.assigned_user === null ) {
      await this.prisma.workOrderFlow.update({
        where: { id: siguiente.id },
        data: { status: 'En espera' },
      });
    } else {
      await this.prisma.workOrderFlow.update({
        where: { id: siguiente?.id },
        data: { status: 'En proceso' },
      });
    }
  
    let formAuditoryId: number | undefined;
  
    // 1. Buscar último partialRelease validado
    const validatedPartial = await this.prisma.partialRelease.findFirst({
      where: {
        work_order_flow_id: workOrderFlowId,
        validated: true,
        form_auditory_id: { not: null },
      },
      orderBy: { id: 'desc' },
    });
  
    if (validatedPartial?.form_auditory_id) {
      formAuditoryId = validatedPartial.form_auditory_id;
    } else {
      // 2. Buscar areasResponse solo si no hay parcialidad validada
      const response = await this.prisma.areasResponse.findFirst({
        where: { work_order_flow_id: workOrderFlowId },
        include: { area: true },
      });
  
      if (!response) throw new Error('No se encontró áreasResponse');
  
      switch (response.area?.id) {
        case 6:
          formAuditoryId = (
            await this.prisma.corteResponse.findFirst({
              where: { areas_response_id: response.id },
            })
          )?.form_auditory_id ?? undefined;
          break;
        case 7:
          formAuditoryId = (
            await this.prisma.colorEdgeResponse.findFirst({
              where: { areas_response_id: response.id },
            })
          )?.form_auditory_id ?? undefined;
          break;
        case 8:
          formAuditoryId = (
            await this.prisma.hotStampingResponse.findFirst({
              where: { areas_response_id: response.id },
            })
          )?.form_auditory_id ?? undefined;
          break;
        case 9:
          formAuditoryId = (
            await this.prisma.millingChipResponse.findFirst({
              where: { areas_response_id: response.id },
            })
          )?.form_auditory_id ?? undefined;
          break;
        case 10:
          formAuditoryId = (
            await this.prisma.personalizacionResponse.findFirst({
              where: { areas_response_id: response.id },
            })
          )?.form_auditory_id ?? undefined;
          break;
        default:
          throw new Error(`Área no soportada: ${response.area?.name}`);
      }
    }
  
    if (!formAuditoryId) {
      throw new Error('No se pudo obtener form_auditory_id');
    }
  
    const createInconformidad = await this.prisma.inconformities.create({
      data: {
        form_auditory_id: formAuditoryId,
        comments: inconformidad,
        created_by: userId,
      },
    });
  
    return { updated, createInconformidad };
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
                    corte: {
                      include: {
                        formAuditory: {
                          include: {
                            user: true,
                          },
                        },
                      },
                    },
                    colorEdge: {
                      include: {
                        formAuditory: {
                          include: {
                            user: true,
                          },
                        },
                      },
                    },
                    hotStamping: {
                      include: {
                        formAuditory: {
                          include: {
                            user: true,
                          },
                        },
                      },
                    },
                    millingChip: {
                      include: {
                        formAuditory: {
                          include: {
                            user: true,
                          },
                        },
                      },
                    },
                    personalizacion: {
                      include: {
                        formAuditory: {
                          include: {
                            user: true,
                          },
                        },
                      },
                    },
                  },
                },
                answers: true,
                partialReleases: {
                  include: {
                    formAuditory: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
                user: true,
              },
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
          },
        },
        answers: true,
        user: true,
      },
    });
    if (!workOrderFlow) {
      return { message: 'No se encontró una orden para esta área.' };
    }
    return workOrderFlow;
  }
}
