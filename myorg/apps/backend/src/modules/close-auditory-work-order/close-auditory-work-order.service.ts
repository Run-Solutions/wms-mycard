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
        OR: [
          {
            // Si corte_answer_auditory es lista -> some; si NO, cambia a "is"
            corte_answer_auditory: {
              areas_response: {
                is: {
                  workOrder: {
                    is: {
                      flow: { some: { status: statuses[0] } }, // flow sí es lista
                    },
                  },
                },
              },
            },
          },
          {
            color_edge_answer_auditory: {
              areas_response: {
                is: {
                  workOrder: {
                    is: {
                      flow: { some: { status: statuses[0] } },
                    },
                  },
                },
              },
            },
          },
          {
            personalizacion_answer_auditory: {
              areas_response: {
                is: {
                  workOrder: {
                    is: {
                      flow: { some: { status: statuses[0] } },
                    },
                  },
                },
              },
            },
          },
          {
            hot_stamping_answer_auditory: {
              areas_response: {
                is: {
                  workOrder: {
                    is: {
                      flow: { some: { status: statuses[0] } },
                    },
                  },
                },
              },
            },
          },
          {
            milling_chip_answer_auditory: {
              areas_response: {
                is: {
                  workOrder: {
                    is: {
                      flow: { some: { status: statuses[0] } },
                    },
                  },
                },
              },
            },
          },
        ],
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
                        status: statuses[0],
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
                        status: statuses[0],
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
                        status: statuses[0],
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
                        status: statuses[0],
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
                        status: statuses[0],
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
        // Ya garantiza que exista al menos un flow 'parcial' (statuses[1])
        flow: { some: { status: { in: [statuses[1]] } } },
      },
      select: {
        id: true,
        ot_id: true,
        mycard_id: true,
        quantity: true,
        status: true,
        created_by: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { username: true } },
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
            // ⬇️ Traemos quantity y release_quantity para la validación
            partialReleases: {
              select: {
                validated: true,
                quantity: true,
                release_quantity: true,
              },
            },
          },
          orderBy: { created_at: 'asc' }, // "último" = flujo cronológicamente más reciente
        },
        files: { select: { file_path: true } },
      },
    });

    // Normaliza el valor de "parcial"
    const STATUS_PARCIAL = String(
      statuses?.find((s) => String(s).toLowerCase() === 'parcial') ?? 'parcial',
    ).toLowerCase();

    // 1) Solo OTs cuyo ÚLTIMO flow sea 'parcial'
    const onlyLastFlowParcial = workOrdersRaw.filter((wo) => {
      const flows = Array.isArray(wo.flow) ? wo.flow : [];
      if (flows.length === 0) return false;
      const last = flows[flows.length - 1];
      const lastStatus = String(last?.status ?? '')
        .trim()
        .toLowerCase();
      return lastStatus === STATUS_PARCIAL;
    });

    // Helper para convertir a número (soporta strings)
    const toNum = (v: unknown) => (v == null || v === '' ? NaN : Number(v));

    // 2) Excluir OTs si existe algún partialRelease con quantity === release_quantity
    const withoutFullyReleased = onlyLastFlowParcial.filter((wo) => {
      const prs = (wo.flow ?? []).flatMap((f) => f.partialReleases ?? []);
      if (prs.length === 0) return true; // si no hay partialReleases, no excluimos
      // Excluir si ALGUNO tiene equality exacta (interpretado como "ya liberado totalmente ese parcial")
      const hasEqual = prs.some((pr) => {
        const q = toNum(pr?.quantity);
        const rq = toNum(pr?.release_quantity);
        return Number.isFinite(q) && Number.isFinite(rq) && q === rq;
      });
      return !hasEqual;
    });

    const workOrders = withoutFullyReleased.map((wo) => {
      const validated =
        (wo.flow ?? []).some((f) =>
          (f.partialReleases ?? []).some((pr) => pr?.validated),
        ) || false;

      // Si no quieres exponer partialReleases en la respuesta:
      const flow = (wo.flow ?? []).map(({ partialReleases, ...rest }) => {
        void partialReleases; // evita @typescript-eslint/no-unused-vars
        return rest;
      });

      return {
        id: wo.id,
        ot_id: wo.ot_id,
        mycard_id: wo.mycard_id,
        quantity: wo.quantity,
        status: wo.status ?? '',
        created_by: wo.created_by,
        validated,
        createdAt: wo.createdAt.toISOString?.() ?? wo.createdAt,
        updatedAt: wo.updatedAt.toISOString?.() ?? wo.updatedAt,
        user: { username: wo.user?.username ?? '' },
        flow,
        files: wo.files,
      };
    });

    console.log(
      workOrders,
      'Ordenes en auditoria con último flow=parcial y sin partialRelease q==rq',
    );

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
    const allRelatedWorkOrders = await this.prisma.workOrder.findMany({
      where: {
        id: { in: filteredWorkOrderIds },
      },
      include: {
        user: true,
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
        status: { in: ['En auditoria', 'Parcial'] },
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

  async updateWorkFlowAuditoryParcial(
    partialReleaseId: number,
    quantityRelease: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const partial = await tx.partialRelease.findUnique({
        where: { id: partialReleaseId },
        select: { release_quantity: true },
      });

      const current = partial?.release_quantity ?? 0;

      return tx.partialRelease.update({
        where: { id: partialReleaseId },
        data: {
          release_quantity: current + quantityRelease,
        },
      });
    });
  }
}
