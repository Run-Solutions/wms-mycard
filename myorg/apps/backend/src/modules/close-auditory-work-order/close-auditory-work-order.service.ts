import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateWorkFlowAuditoryDto } from './dto/response.dto';

@Injectable()
export class CloseAuditoryWorkOrderService {
  constructor(private prisma: PrismaService) {}

  // Para obtener los WorkOrderFlowEnAuditoria
  async getInAuditoryWorkOrders(userId: number, statuses: string[]) {
    if (!userId) {
      throw new Error('No se proporcionan areas validas');
    }
    // Para obtener las ordenes de trabajo con estado en auditoria o estados solicitados
    const inAuditoryOrders = await this.prisma.formAuditory.findMany({
      where: {
        reviewed_by_id: userId,
      },
      include: {
        corte_answer_auditory: {
          include: {
            areas_response: {
              include: {
                workOrder: {
                  include: {
                    flow: {
                      where: {
                        status: {
                          in: statuses,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        color_edge_answer_auditory: {
          include: {
            areas_response: {
              include: {
                workOrder: {
                  include: {
                    flow: {
                      where: {
                        status: {
                          in: statuses,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        personalizacion_answer_auditory: { 
          include: {
            areas_response: {
              include: {
                workOrder: {
                  include: {
                    flow: {
                      where: {
                        status: {
                          in: statuses,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        hot_stamping_answer_auditory: { 
          include: {
            areas_response: {
              include: {
                workOrder: {
                  include: {
                    flow: {
                      where: {
                        status: {
                          in: statuses,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        milling_chip_answer_auditory: { 
          include: {
            areas_response: {
              include: {
                workOrder: {
                  include: {
                    flow: {
                      where: {
                        status: {
                          in: statuses,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    // Extraer los IDs de las workOrders que estan en los flujos
    const workOrderIds = inAuditoryOrders.flatMap((order) => {
      const corteWorkOrderId =
        order.corte_answer_auditory?.areas_response?.workOrder?.id;
      const colorEdgeWorkOrderId = order.color_edge_answer_auditory
        ? order.color_edge_answer_auditory?.areas_response?.workOrder?.id
        : undefined;
      const personalizacionWorkOrderId = order.personalizacion_answer_auditory
        ? order.personalizacion_answer_auditory?.areas_response?.workOrder?.id
        : undefined;
      const hotStampingWorkOrderId = order.hot_stamping_answer_auditory
        ? order.hot_stamping_answer_auditory?.areas_response?.workOrder?.id
        : undefined;
      const millingChipWorkOrderId = order.milling_chip_answer_auditory
        ? order.milling_chip_answer_auditory?.areas_response?.workOrder?.id
        : undefined;

      return [corteWorkOrderId, colorEdgeWorkOrderId, personalizacionWorkOrderId, hotStampingWorkOrderId, millingChipWorkOrderId].filter(
        (id): id is number => !!id,
      );
    });

    const filteredWorkOrderIds = workOrderIds.filter(
      (id): id is number => id !== undefined,
    );
    console.log(filteredWorkOrderIds, 'Ordenes pendientes filtradas');
    // Traer las workOrders asociadas a los IDs
    const allRelatedWorkOrders = await this.prisma.workOrder.findMany({
      where: {
        id: { in: filteredWorkOrderIds },
      },
      include: {
        flow: {
          include: {
            user: true,
            area: true,
          },
        },
        files: true,
      },
    });
    console.log(allRelatedWorkOrders.length, 'Ordenes pendientes encontradas');

    if (allRelatedWorkOrders.length === 0) {
      return { message: 'No hay ordenes pendientes para esta area.' };
    }
    console.log(
      'Ordenes pendientes desde work-orders services',
      allRelatedWorkOrders,
    );
    return allRelatedWorkOrders;
  }

  // Para obtener los WorkOrderFlowEnAuditoria
  async getInAuditoryWorkOrderById(id: string) {
    const workOrderFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        workOrder: {
          is: {
            ot_id: id,
          },
        },
        status: 'En auditoria',
      },
      include: {
        workOrder: {
          include: {
            flow: {
              include: {
                area: true,
                areaResponse: {
                  include: {
                    user: true,
                    corte: {
                      include: {
                        form_answer: true,
                        formAuditory: {
                          include: {
                            user: true,
                          },
                        },
                      },
                    },
                    colorEdge: {
                      include: {
                        form_answer: true,
                        formAuditory: {
                          include: {
                            user: true,
                          },
                        },
                      },
                    },
                    hotStamping: {
                      include: {
                        form_answer: true,
                        formAuditory: {
                          include: {
                            user: true,
                          },
                        },
                      },
                    },
                    millingChip: {
                      include: {
                        form_answer: true,
                        formAuditory: {
                          include: {
                            user: true,
                          },
                        },
                      },
                    },
                    personalizacion: {
                      include: {
                        form_answer: true,
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
            },
          },
        },
      },
    });
    if (!workOrderFlow) {
      return { message: 'No se encontró una orden para esta área.' };
    }
    return workOrderFlow;
  }

  // Para guardar respuesta de liberacion de auditor
  async updateWorkFlowAuditory(dto: UpdateWorkFlowAuditoryDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          status: 'Completado',
        },
      });

      // Buscar el siguiente flujo
      const nextFlow = await tx.workOrderFlow.findFirst({
        where: {
          work_order_id: dto.workOrderId,
          id: {
            gt: dto.workOrderFlowId,
          },
          status: 'En espera',
        },
        orderBy: {
          id: 'asc',
        },
      });

      // Si hay siguiente flujo, se actualiza a pendiente
      if (nextFlow) {
        await tx.workOrderFlow.update({
          where: {
            id: nextFlow.id,
          },
          data: {
            status: 'Pendiente',
          },
        });
      } else {
        await tx.workOrder.update({
          where: {
            id: dto.workOrderId,
          },
          data: {
            status: 'Listo',
          },
        });
      }
      return { message: 'Respuesta guardada con exito' };
    });
  }
}