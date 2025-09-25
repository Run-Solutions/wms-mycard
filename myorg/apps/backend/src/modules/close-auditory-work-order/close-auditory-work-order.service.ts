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
    console.log('Estados que se reciben:', statuses);
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

    const workOrdersRaw = await this.prisma.workOrder.findMany({
      where: {
        // Filtra OTs que tengan al menos un flow con status en statuses
        flow: { some: { status: { in: statuses } } },
      },
      select: {
        id: true,
        ot_id: true,
        mycard_id: true,
        quantity: true,
        status: true,          // en tu schema puede ser null
        created_by: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { username: true } },
        // ⬇️ Trae TODOS los flows de la OT (sin where aquí)
        flow: {
          select: {
            id: true,
            work_order_id: true,
            area_id: true,
            status: true,
            assigned_user: true,
            assigned_at: true,
            area_response_id: true,
            created_at: true,
            updated_at: true,
            area: { select: { name: true } },
            // para derivar validated a nivel OT
            partialReleases: { select: { validated: true } },
          },
          orderBy: { id: 'asc' }, // opcional
        },
        files: { select: { file_path: true } },
      },
    });

    // Mapear al shape y derivar validated (true si algún partialRelease.validated)
    const workOrders = workOrdersRaw.map((wo) => {
      const validated =
        wo.flow?.some(f => f.partialReleases?.some(pr => pr.validated)) ?? false;

      // quitar partialReleases del flow si no quieres exponerlo
      const flow = wo.flow.map(({ partialReleases, ...rest }) => rest);

      return {
        id: wo.id,
        ot_id: wo.ot_id,
        mycard_id: wo.mycard_id,
        quantity: wo.quantity,
        status: wo.status ?? '',          // si tu DTO exige string estricto
        created_by: wo.created_by,
        validated,
        createdAt: wo.createdAt.toISOString?.() ?? wo.createdAt,
        updatedAt: wo.updatedAt.toISOString?.() ?? wo.updatedAt,
        user: { username: wo.user.username },
        flow,
        files: wo.files,
      };
    });

    console.log(workOrders, 'Ordenes en auditoria encontradas');

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

      return [
        corteWorkOrderId,
        colorEdgeWorkOrderId,
        personalizacionWorkOrderId,
        hotStampingWorkOrderId,
        millingChipWorkOrderId,
      ].filter((id): id is number => !!id);
    });

    const filteredWorkOrderIds = workOrderIds.filter(
      (id): id is number => id !== undefined,
    );
    console.log(filteredWorkOrderIds, 'Ordenes pendientes filtradas');
    // Traer las workOrders asociadas a los IDs
    // helper: construye el where para flow.status
    // Dedup de IDs por si llegan repetidos
    const uniqueIds = Array.from(new Set(filteredWorkOrderIds));

    const allowedStatuses =
      statuses && statuses.length ? statuses : ['En auditoria', 'Parcial'];

    // Construye un OR de equals (case-sensitive)
    const flowStatusOr = allowedStatuses.map((s) => ({
      status: { equals: s }, // sin mode
    }));

    // Filtro para flow.status: alguno de los estados permitidos Y que NO contenga "inconformidad"
    const flowWhere = {
      AND: [
        { OR: flowStatusOr },
        { NOT: { status: { contains: 'inconformidad' } } }, // sin mode => respeta el casing exacto
      ],
    };

    const allRelatedWorkOrders = await this.prisma.workOrder.findMany({
      where: {
        id: { in: uniqueIds },
        status: { notIn: ['Cerrado'] }, // si status es nullable, incluye null
        flow: { some: flowWhere }, // ⬅️ esto sí filtra la orden
      },
      include: {
        user: true,
        flow: {
          where: flowWhere, // devuelves solo los pasos relevantes
          include: { user: true, area: true },
        },
        files: true,
      },
    });
    console.log(allRelatedWorkOrders.length, 'Ordenes pendientes encontradas');

    if (allRelatedWorkOrders.length === 0 && workOrders.length === 0) {
      return { message: 'No hay ordenes pendientes para esta area.' };
    }
    console.log(
      'Ordenes pendientes desde work-orders services',
      allRelatedWorkOrders,
    );
    return [...allRelatedWorkOrders, ...workOrders];
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
        status: { in: ['En auditoria', 'Parcial']},
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

  async updateWorkFlowAuditoryParcial(partialReleaseId: number, quantityRelease: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.partialRelease.update({
        where: {
          id: partialReleaseId,
        },
        data: {
          release_quantity: quantityRelease,
        },
      });
    });
  }

}
