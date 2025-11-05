import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

const EARLY_BLOCK_CONFIG = {
  impression: { delegate: 'impressionResponse' },
  serigrafia: { delegate: 'serigrafiaResponse' },
  empalme: { delegate: 'empalmeResponse' },
  laminacion: { delegate: 'laminacionResponse' },
} as const;

type EarlyBlockKey = keyof typeof EARLY_BLOCK_CONFIG;

@Injectable()
export class InconformitiesService {
  constructor(private prisma: PrismaService) {}

  async inconformityPrepress(areaResponseId: number) {
    return this.prisma.$transaction(async (tx) => {
      const areaResponse = await tx.areasResponse.findUnique({
        where: {
          id: Number(areaResponseId),
        },
      });
      if (!areaResponse) {
        throw new NotFoundException('No se encontró el registro AreasResponse');
      }
      // Eliminar el registro asociado a ese AreasResponse
      await tx.inconformities.updateMany({
        where: {
          areas_response_id: areaResponse.id,
          OR: [{ reviewed: false }, { reviewed: null }],
        },
        data: { reviewed: true },
      });
      await tx.prepressResponse.deleteMany({
        where: {
          areas_response_id: Number(areaResponseId),
        },
      });
      await tx.areasResponse.deleteMany({
        where: {
          id: Number(areaResponseId),
        },
      });
      await tx.workOrderFlow.update({
        where: {
          id: Number(areaResponse.work_order_flow_id),
        },
        data: {
          status: 'En proceso',
        },
      });
      return { message: 'Respuesta guardada con exito' };
    });
  }

  async inconformityImpresion(areaResponseId: number) {
    return this.prisma.$transaction(async (tx) => {
      const areaResponse = await tx.areasResponse.findFirst({
        where: {
          work_order_flow_id: Number(areaResponseId),
        },
      });
      const flow = await tx.workOrderFlow.findUnique({
        where: {
          id: Number(areaResponseId),
        },
      });
      const flowParcial = await tx.partialRelease.findFirst({
        where: {
          work_order_flow_id: flow?.id,
          validated: false,
        },
        select: { id: true },
      });
      if (!areaResponse || (areaResponse && flowParcial)) {
        if (flowParcial) {
          await tx.inconformities.updateMany({
            where: {
              partial_release_id: flowParcial.id,
              OR: [{ reviewed: false }, { reviewed: null }],
            },
            data: { reviewed: true },
          });
          await tx.partialRelease.deleteMany({
            where: {
              work_order_flow_id: flow?.id,
              validated: false,
            },
          });
          await tx.areasResponse.deleteMany({
            where: {
              work_order_flow_id: flow?.id,
            },
          });
          await tx.workOrderFlow.update({
            where: {
              id: flow?.id,
            },
            data: {
              status: 'Listo',
            },
          });
        }
        return { message: 'Respuesta guardada con exito' };
      }
      await tx.inconformities.updateMany({
        where: {
          areas_response_id: areaResponse.id,
          OR: [{ reviewed: false }, { reviewed: null }],
        },
        data: { reviewed: true },
      });
      // Eliminar el registro impresion asociado a ese AreasResponse
      await tx.impressionResponse.deleteMany({
        where: {
          areas_response_id: areaResponse.id,
        },
      });
      await tx.areasResponse.deleteMany({
        where: {
          id: areaResponse.id,
        },
      });
      await tx.workOrderFlow.update({
        where: {
          id: flow?.id,
        },
        data: {
          status: 'Listo',
        },
      });
      return { message: 'Respuesta guardada con exito' };
    });
  }

  async inconformitySerigrafia(areaResponseId: number) {
    return this.prisma.$transaction(async (tx) => {
      const areaResponse = await tx.areasResponse.findFirst({
        where: {
          work_order_flow_id: Number(areaResponseId),
        },
      });
      const flow = await tx.workOrderFlow.findUnique({
        where: {
          id: Number(areaResponseId),
        },
      });
      const flowParcial = await tx.partialRelease.findMany({
        where: {
          work_order_flow_id: flow?.id,
        },
      });
      if (!areaResponse || (areaResponse && flowParcial)) {
        if (flowParcial) {
          await tx.partialRelease.deleteMany({
            where: {
              work_order_flow_id: flow?.id,
              validated: false,
            },
          });
          await tx.areasResponse.deleteMany({
            where: {
              work_order_flow_id: flow?.id,
            },
          });
          await tx.workOrderFlow.update({
            where: {
              id: flow?.id,
            },
            data: {
              status: 'Listo',
            },
          });
        }
        return { message: 'Respuesta guardada con exito' };
      }
      // Eliminar el registro serigrafia asociado a ese AreasResponse
      await tx.serigrafiaResponse.deleteMany({
        where: {
          areas_response_id: areaResponse.id,
        },
      });
      await tx.areasResponse.deleteMany({
        where: {
          id: areaResponse.id,
        },
      });
      await tx.workOrderFlow.update({
        where: {
          id: flow?.id,
        },
        data: {
          status: 'Listo',
        },
      });
      return { message: 'Respuesta guardada con exito' };
    });
  }

  async inconformityEmpalme(areaResponseId: number) {
    return this.prisma.$transaction(async (tx) => {
      const areaResponse = await tx.areasResponse.findFirst({
        where: {
          work_order_flow_id: Number(areaResponseId),
        },
      });
      const flow = await tx.workOrderFlow.findUnique({
        where: {
          id: Number(areaResponseId),
        },
      });
      const flowParcial = await tx.partialRelease.findFirst({
        where: {
          work_order_flow_id: flow?.id,
          validated: false,
        },
        select: { id: true },
      });
      if (!areaResponse || (areaResponse && flowParcial)) {
        if (flowParcial) {
          await tx.inconformities.updateMany({
            where: {
              partial_release_id: flowParcial.id,
              OR: [{ reviewed: false }, { reviewed: null }],
            },
            data: { reviewed: true },
          });
          await tx.partialRelease.deleteMany({
            where: {
              work_order_flow_id: flow?.id,
              validated: false,
            },
          });
          await tx.areasResponse.deleteMany({
            where: {
              work_order_flow_id: flow?.id,
            },
          });
          await tx.workOrderFlow.update({
            where: {
              id: flow?.id,
            },
            data: {
              status: 'Listo',
            },
          });
        }
        return { message: 'Respuesta guardada con exito' };
      }
      await tx.inconformities.updateMany({
        where: {
          areas_response_id: areaResponse.id,
          OR: [{ reviewed: false }, { reviewed: null }],
        },
        data: { reviewed: true },
      });
      // Eliminar el registro serigrafia asociado a ese AreasResponse
      await tx.empalmeResponse.deleteMany({
        where: {
          areas_response_id: areaResponse.id,
        },
      });
      await tx.areasResponse.deleteMany({
        where: {
          id: areaResponse.id,
        },
      });
      await tx.workOrderFlow.update({
        where: {
          id: flow?.id,
        },
        data: {
          status: 'Listo',
        },
      });
      return { message: 'Respuesta guardada con exito' };
    });
  }

  async inconformityLaminacion(areaResponseId: number) {
    return this.prisma.$transaction(async (tx) => {
      const areaResponse = await tx.areasResponse.findFirst({
        where: {
          work_order_flow_id: Number(areaResponseId),
        },
      });
      const flow = await tx.workOrderFlow.findUnique({
        where: {
          id: Number(areaResponseId),
        },
      });
      const flowParcial = await tx.partialRelease.findFirst({
        where: {
          work_order_flow_id: flow?.id,
          validated: false,
        },
        select: { id: true },
      });
      if (!areaResponse || (areaResponse && flowParcial)) {
        if (flowParcial) {
          await tx.inconformities.updateMany({
            where: {
              partial_release_id: flowParcial.id,
              OR: [{ reviewed: false }, { reviewed: null }],
            },
            data: { reviewed: true },
          });
          await tx.partialRelease.deleteMany({
            where: {
              work_order_flow_id: flow?.id,
              validated: false,
            },
          });
          await tx.areasResponse.deleteMany({
            where: {
              work_order_flow_id: flow?.id,
            },
          });
          await tx.workOrderFlow.update({
            where: {
              id: flow?.id,
            },
            data: {
              status: 'Listo',
            },
          });
        }
        return { message: 'Respuesta guardada con exito' };
      }
      await tx.inconformities.updateMany({
        where: {
          areas_response_id: areaResponse.id,
          OR: [{ reviewed: false }, { reviewed: null }],
        },
        data: { reviewed: true },
      });
      // Eliminar el registro empalme asociado a ese AreasResponse
      await tx.laminacionResponse.deleteMany({
        where: {
          areas_response_id: areaResponse.id,
        },
      });
      await tx.areasResponse.deleteMany({
        where: {
          id: areaResponse.id,
        },
      });
      await tx.workOrderFlow.update({
        where: {
          id: flow?.id,
        },
        data: {
          status: 'Listo',
        },
      });
      return { message: 'Respuesta guardada con exito' };
    });
  }

  async inconformityCorte(areaResponseFlowId: number) {
    return this.prisma.$transaction(async (tx) => {
      const flow = await tx.workOrderFlow.findUnique({
        where: { id: Number(areaResponseFlowId) },
        select: { id: true, area_id: true, work_order_id: true },
      });
      if (!flow) throw new Error('Flujo no encontrado');

      // Para escribir en bloques acumulables
      const EARLY_AREA_TO_BLOCK: Record<number, EarlyBlockKey> = {
        2: 'impression',
        3: 'serigrafia',
        4: 'empalme',
        5: 'laminacion',
      };
      const EARLY_AREAS = Object.keys(EARLY_AREA_TO_BLOCK).map(Number);

      // Helper: RESYNC absolutas en bloques 2..5 (impression/serigrafia/empalme/laminacion)
      const resyncEarlyBlocks = async () => {
        // Suma por target_area_id de lo que QUEDA en badQuantityDetail
        const groups = await tx.badQuantityDetail.groupBy({
          by: ['target_area_id'],
          where: {
            work_order_id: flow.work_order_id,
            source_work_order_flow_id: flow.id,
            source_area_id: flow.area_id,
            target_area_id: { in: EARLY_AREAS },
          },
          _sum: { bad_quantity: true },
        });

        const totalsByArea = new Map<number, number>(
          EARLY_AREAS.map((id) => [id, 0]),
        );
        for (const g of groups) {
          totalsByArea.set(
            Number(g.target_area_id),
            Math.max(0, Number(g._sum.bad_quantity ?? 0)),
          );
        }

        for (const [areaId, total] of totalsByArea.entries()) {
          const blockKey = EARLY_AREA_TO_BLOCK[areaId];
          if (!blockKey) continue;

          // Último flow de ESA área en la OT
          const targetFlow = await tx.workOrderFlow.findFirst({
            where: { work_order_id: flow.work_order_id, area_id: areaId },
            orderBy: { id: 'desc' },
            select: { id: true },
          });
          if (!targetFlow) continue;

          // Su areas_response
          const areaResp = await tx.areasResponse.findFirst({
            where: { work_order_flow_id: targetFlow.id, area_id: areaId },
            select: { id: true },
          });
          if (!areaResp) continue;

          const cfg = EARLY_BLOCK_CONFIG[blockKey];
          const delegate = (tx as any)[cfg.delegate];

          // Solo estos bloques (2..5) llevan bad_quantity, no material
          const current = await delegate.findFirst({
            where: { areas_response_id: areaResp.id },
            select: { id: true, bad_quantity: true },
          });
          if (!current) continue;

          const prev = Number(current.bad_quantity ?? 0);
          if (prev !== total) {
            await delegate.update({
              where: { id: current.id },
              data: { bad_quantity: total },
            });
            console.log('🔄 [RESYNC acumulables] ', {
              target_area_id: areaId,
              blockKey,
              areas_response_id: areaResp.id,
              prev,
              total,
            });
          } else {
            console.log('ℹ️ [RESYNC acumulables] ya coincide', {
              target_area_id: areaId,
              blockKey,
              total,
            });
          }
        }
      };

      // Datos de contexto para decidir qué borrar
      const areaResponse = await tx.areasResponse.findFirst({
        where: { work_order_flow_id: flow.id },
        include: { inconformities: true },
      });
      const flowParcial = await tx.partialRelease.findFirst({
        where: { work_order_flow_id: flow.id, validated: false },
        select: { id: true },
      });

      // ── CASO 1: Hay parciales sin validar (reinicio de liberación parcial)
      if (flowParcial) {
        // Marcar inconformidades del parcial como revisadas
        await tx.inconformities.updateMany({
          where: {
            partial_release_id: flowParcial.id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // 🔥 BORRAR detalles del parcial
        await tx.badQuantityDetail.deleteMany({
          where: {
            source_work_order_flow_id: flow.id,
            partial_release_id: flowParcial.id,
          },
        });

        // BORRAR el parcial y cualquier areas_response de ese flow
        await tx.partialRelease.deleteMany({
          where: { work_order_flow_id: flow.id, validated: false },
        });
        await tx.areasResponse.deleteMany({
          where: { work_order_flow_id: flow.id },
        });

        // Poner el flow listo
        await tx.workOrderFlow.update({
          where: { id: flow.id },
          data: { status: 'Listo' },
        });

        // 🧮 RESYNC absolutas en acumulables 2..5 tras la limpieza
        await resyncEarlyBlocks();

        return { message: 'Liberación parcial reiniciada con éxito' };
      }

      // ── CASO 2: No hay parcial sin validar, pero sí areaResponse con inconformidad
      if (areaResponse) {
        // ✔️ Marcar inconformidades como revisadas
        await tx.inconformities.updateMany({
          where: {
            areas_response_id: areaResponse.id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // Borrar auditoría asociada a corte si existe
        const corteResponse = await tx.corteResponse.findUnique({
          where: { areas_response_id: areaResponse.id },
          select: { id: true, form_auditory_id: true },
        });
        if (corteResponse?.form_auditory_id) {
          await tx.formAuditory.deleteMany({
            where: { id: corteResponse.form_auditory_id },
          });
        }

        // 🔥 Si el caso corresponde a remanente (partial_release_id = null), borra esos detalles
        await tx.badQuantityDetail.deleteMany({
          where: {
            source_work_order_flow_id: flow.id,
            partial_release_id: null,
          },
        });

        // Limpia el corte + areaResponse del flow
        await tx.corteResponse.deleteMany({
          where: { areas_response_id: areaResponse.id },
        });
        await tx.areasResponse.deleteMany({
          where: { id: areaResponse.id },
        });

        await tx.workOrderFlow.update({
          where: { id: flow.id },
          data: { status: 'Listo' },
        });

        // 🧮 RESYNC absolutas en acumulables 2..5 tras la limpieza
        await resyncEarlyBlocks();

        return {
          message: 'Corte limpiado y la inconformidad marcada como revisada',
        };
      }

      return { message: 'No se encontró información para procesar' };
    });
  }

  async inconformityCorteAuditory(workOrderFlowId: number) {
    return this.prisma.$transaction(async (tx) => {
      // Buscar el flujo (obligatorio)
      const flow = await tx.workOrderFlow.findUnique({
        where: {
          id: Number(workOrderFlowId),
        },
      });

      if (!flow) {
        throw new Error('No se encontró el flujo');
      }

      // Buscar areaResponse (puede no existir)
      const areaResponse = await tx.areasResponse.findFirst({
        where: {
          WorkOrderFlow: {
            id: Number(workOrderFlowId),
          },
        },
      });

      if (areaResponse) {
        // Buscar corteResponse asociado
        const corteResponse = await tx.corteResponse.findUnique({
          where: {
            areas_response_id: areaResponse.id,
          },
          include: {
            formAuditory: {
              include: {
                inconformities: true,
              },
            },
          },
        });
        await tx.inconformities.updateMany({
          where: {
            form_answer_id: corteResponse?.form_auditory_id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // Desvincular solo si NO hay inconformidades registradas
        if (
          corteResponse?.form_auditory_id &&
          corteResponse.formAuditory?.inconformities.length === 0
        ) {
          await tx.corteResponse.update({
            where: { id: corteResponse.id },
            data: { form_auditory_id: null },
          });
        }
      } else {
        // Caso: flujo con partialRelease (sin areaResponse)
        const lastValidatedPartial = await tx.partialRelease.findFirst({
          where: {
            work_order_flow_id: flow.id,
            validated: true,
          },
          orderBy: { id: 'desc' },
          include: {
            formAuditory: {
              include: { inconformities: true },
            },
          },
        });

        if (lastValidatedPartial) {
          const inconformity = await tx.inconformities.findFirst({
            where: {
              form_auditory_id: lastValidatedPartial.form_auditory_id,
              OR: [{ reviewed: false }, { reviewed: null }],
            },
            select: { id: true },
          });

          if (inconformity) {
            await tx.inconformities.update({
              where: { id: inconformity.id },
              data: { reviewed: true },
            });
          }
          await tx.partialRelease.update({
            where: { id: lastValidatedPartial.id },
            data: {
              validated: false,
              form_auditory_id: null,
            },
          });
        }
      }

      // Verifica si queda alguna parcial no validada
      const hasPartial = await tx.partialRelease.findFirst({
        where: {
          work_order_flow_id: flow.id,
          validated: false,
        },
      });
      await tx.workOrderFlow.update({
        where: { id: flow.id },
        data: {
          status: hasPartial
            ? 'Enviado a auditoria parcial'
            : 'Enviado a Auditoria',
        },
      });
      return { message: 'Respuesta devuelta a auditoría correctamente' };
    });
  }

  async inconformityColorEdge(areaResponseId: number) {
    return this.prisma.$transaction(async (tx) => {
      const flow = await tx.workOrderFlow.findUnique({
        where: { id: Number(areaResponseId) },
      });
      if (!flow) throw new Error('Flujo no encontrado');

      // Para escribir en bloques acumulables
      const EARLY_AREA_TO_BLOCK: Record<number, EarlyBlockKey> = {
        2: 'impression',
        3: 'serigrafia',
        4: 'empalme',
        5: 'laminacion',
      };
      const EARLY_AREAS = Object.keys(EARLY_AREA_TO_BLOCK).map(Number);

      // Helper: RESYNC absolutas en bloques 2..5 (impression/serigrafia/empalme/laminacion)
      const resyncEarlyBlocks = async () => {
        // Suma por target_area_id de lo que QUEDA en badQuantityDetail
        const groups = await tx.badQuantityDetail.groupBy({
          by: ['target_area_id'],
          where: {
            work_order_id: flow.work_order_id,
            source_work_order_flow_id: flow.id,
            source_area_id: flow.area_id,
            target_area_id: { in: EARLY_AREAS },
          },
          _sum: { bad_quantity: true },
        });

        const totalsByArea = new Map<number, number>(
          EARLY_AREAS.map((id) => [id, 0]),
        );
        for (const g of groups) {
          totalsByArea.set(
            Number(g.target_area_id),
            Math.max(0, Number(g._sum.bad_quantity ?? 0)),
          );
        }

        for (const [areaId, total] of totalsByArea.entries()) {
          const blockKey = EARLY_AREA_TO_BLOCK[areaId];
          if (!blockKey) continue;

          // Último flow de ESA área en la OT
          const targetFlow = await tx.workOrderFlow.findFirst({
            where: { work_order_id: flow.work_order_id, area_id: areaId },
            orderBy: { id: 'desc' },
            select: { id: true },
          });
          if (!targetFlow) continue;

          // Su areas_response
          const areaResp = await tx.areasResponse.findFirst({
            where: { work_order_flow_id: targetFlow.id, area_id: areaId },
            select: { id: true },
          });
          if (!areaResp) continue;

          const cfg = EARLY_BLOCK_CONFIG[blockKey];
          const delegate = (tx as any)[cfg.delegate];

          // Solo estos bloques (2..5) llevan bad_quantity, no material
          const current = await delegate.findFirst({
            where: { areas_response_id: areaResp.id },
            select: { id: true, bad_quantity: true },
          });
          if (!current) continue;

          const prev = Number(current.bad_quantity ?? 0);
          if (prev !== total) {
            await delegate.update({
              where: { id: current.id },
              data: { bad_quantity: total },
            });
            console.log('🔄 [RESYNC acumulables] ', {
              target_area_id: areaId,
              blockKey,
              areas_response_id: areaResp.id,
              prev,
              total,
            });
          } else {
            console.log('ℹ️ [RESYNC acumulables] ya coincide', {
              target_area_id: areaId,
              blockKey,
              total,
            });
          }
        }
      };

      const areaResponse = await tx.areasResponse.findFirst({
        where: { work_order_flow_id: flow.id },
        include: { inconformities: true },
      });
      const flowParcial = await tx.partialRelease.findFirst({
        where: {
          work_order_flow_id: flow?.id,
          validated: false,
        },
        select: { id: true },
      });

      // ── CASO 1: Hay parciales sin validar (reinicio de liberación parcial)
      if (flowParcial) {
        // Marcar inconformidades del parcial como revisadas
        await tx.inconformities.updateMany({
          where: {
            partial_release_id: flowParcial.id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // 🔥 BORRAR detalles del parcial
        await tx.badQuantityDetail.deleteMany({
          where: {
            source_work_order_flow_id: flow.id,
            partial_release_id: flowParcial.id,
          },
        });

        // BORRAR el parcial y cualquier areas_response de ese flow
        await tx.partialRelease.deleteMany({
          where: { work_order_flow_id: flow.id, validated: false },
        });
        await tx.areasResponse.deleteMany({
          where: { work_order_flow_id: flow.id },
        });

        // Poner el flow listo
        await tx.workOrderFlow.update({
          where: { id: flow.id },
          data: { status: 'Listo' },
        });

        // 🧮 RESYNC absolutas en acumulables 2..5 tras la limpieza
        await resyncEarlyBlocks();

        return { message: 'Liberación parcial reiniciada con éxito' };
      }

      // ── CASO 2: No hay parcial sin validar, pero sí areaResponse con inconformidad
      if (areaResponse) {
        // ✔️ Marcar inconformidades como revisadas
        await tx.inconformities.updateMany({
          where: {
            areas_response_id: areaResponse.id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // Borrar auditoría asociada a corte si existe
        const colorEdgeResponse = await tx.colorEdgeResponse.findUnique({
          where: { areas_response_id: areaResponse.id },
          select: { id: true, form_auditory_id: true },
        });
        if (colorEdgeResponse?.form_auditory_id) {
          await tx.formAuditory.deleteMany({
            where: { id: colorEdgeResponse.form_auditory_id },
          });
        }

        // 🔥 Si el caso corresponde a remanente (partial_release_id = null), borra esos detalles
        await tx.badQuantityDetail.deleteMany({
          where: {
            source_work_order_flow_id: flow.id,
            partial_release_id: null,
          },
        });

        // Limpia el corte + areaResponse del flow
        await tx.colorEdgeResponse.deleteMany({
          where: { areas_response_id: areaResponse.id },
        });
        await tx.areasResponse.deleteMany({
          where: { id: areaResponse.id },
        });

        await tx.workOrderFlow.update({
          where: { id: flow.id },
          data: { status: 'Listo' },
        });

        // 🧮 RESYNC absolutas en acumulables 2..5 tras la limpieza
        await resyncEarlyBlocks();

        return {
          message: 'colorEdgeResponse limpiado y la inconformidad marcada como revisada',
        };
      }
      return { message: 'Respuesta guardada con exito' };
    });
  }

  async inconformityColorEdgeAuditory(workOrderFlowId: number) {
    return this.prisma.$transaction(async (tx) => {
      // Buscar el flujo (obligatorio)
      const flow = await tx.workOrderFlow.findUnique({
        where: {
          id: Number(workOrderFlowId),
        },
      });
      if (!flow) {
        throw new Error('No se encontró el flujo');
      }

      // Buscar areaResponse (puede no existir)
      const areaResponse = await tx.areasResponse.findFirst({
        where: {
          WorkOrderFlow: {
            id: Number(workOrderFlowId),
          },
        },
      });

      if (areaResponse) {
        // Buscar colorEdgeResponse asociado
        const colorEdgeResponse = await tx.colorEdgeResponse.findUnique({
          where: {
            areas_response_id: areaResponse.id,
          },
          include: {
            formAuditory: {
              include: {
                inconformities: true,
              },
            },
          },
        });
        await tx.inconformities.updateMany({
          where: {
            form_answer_id: colorEdgeResponse?.form_auditory_id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // Desvincular solo si NO hay inconformidades registradas
        if (
          colorEdgeResponse?.form_auditory_id &&
          colorEdgeResponse.formAuditory?.inconformities.length === 0
        ) {
          await tx.colorEdgeResponse.update({
            where: { id: colorEdgeResponse.id },
            data: { form_auditory_id: null },
          });
        }
      } else {
        // Caso: flujo con partialRelease (sin areaResponse)
        const lastValidatedPartial = await tx.partialRelease.findFirst({
          where: {
            work_order_flow_id: flow.id,
            validated: true,
          },
          orderBy: { id: 'desc' },
          include: {
            formAuditory: {
              include: { inconformities: true },
            },
          },
        });

        if (lastValidatedPartial) {
          const inconformity = await tx.inconformities.findFirst({
            where: {
              form_auditory_id: lastValidatedPartial.form_auditory_id,
              OR: [{ reviewed: false }, { reviewed: null }],
            },
            select: { id: true },
          });

          if (inconformity) {
            await tx.inconformities.update({
              where: { id: inconformity.id },
              data: { reviewed: true },
            });
          }
          await tx.partialRelease.update({
            where: { id: lastValidatedPartial.id },
            data: {
              validated: false,
              form_auditory_id: null,
            },
          });
        }
      }

      // Verifica si queda alguna parcial no validada
      const hasPartial = await tx.partialRelease.findFirst({
        where: {
          work_order_flow_id: flow.id,
          validated: false,
        },
      });

      await tx.workOrderFlow.update({
        where: { id: flow.id },
        data: {
          status: hasPartial
            ? 'Enviado a auditoria parcial'
            : 'Enviado a Auditoria',
        },
      });

      return { message: 'Respuesta devuelta a auditoría correctamente' };
    });
  }

  async inconformityHotStamping(areaResponseId: number) {
    return this.prisma.$transaction(async (tx) => {
      const flow = await tx.workOrderFlow.findUnique({
        where: { id: Number(areaResponseId) },
      });
      if (!flow) throw new Error('Flujo no encontrado');

      // Para escribir en bloques acumulables
      const EARLY_AREA_TO_BLOCK: Record<number, EarlyBlockKey> = {
        2: 'impression',
        3: 'serigrafia',
        4: 'empalme',
        5: 'laminacion',
      };
      const EARLY_AREAS = Object.keys(EARLY_AREA_TO_BLOCK).map(Number);

      // Helper: RESYNC absolutas en bloques 2..5 (impression/serigrafia/empalme/laminacion)
      const resyncEarlyBlocks = async () => {
        // Suma por target_area_id de lo que QUEDA en badQuantityDetail
        const groups = await tx.badQuantityDetail.groupBy({
          by: ['target_area_id'],
          where: {
            work_order_id: flow.work_order_id,
            source_work_order_flow_id: flow.id,
            source_area_id: flow.area_id,
            target_area_id: { in: EARLY_AREAS },
          },
          _sum: { bad_quantity: true },
        });

        const totalsByArea = new Map<number, number>(
          EARLY_AREAS.map((id) => [id, 0]),
        );
        for (const g of groups) {
          totalsByArea.set(
            Number(g.target_area_id),
            Math.max(0, Number(g._sum.bad_quantity ?? 0)),
          );
        }

        for (const [areaId, total] of totalsByArea.entries()) {
          const blockKey = EARLY_AREA_TO_BLOCK[areaId];
          if (!blockKey) continue;

          // Último flow de ESA área en la OT
          const targetFlow = await tx.workOrderFlow.findFirst({
            where: { work_order_id: flow.work_order_id, area_id: areaId },
            orderBy: { id: 'desc' },
            select: { id: true },
          });
          if (!targetFlow) continue;

          // Su areas_response
          const areaResp = await tx.areasResponse.findFirst({
            where: { work_order_flow_id: targetFlow.id, area_id: areaId },
            select: { id: true },
          });
          if (!areaResp) continue;

          const cfg = EARLY_BLOCK_CONFIG[blockKey];
          const delegate = (tx as any)[cfg.delegate];

          // Solo estos bloques (2..5) llevan bad_quantity, no material
          const current = await delegate.findFirst({
            where: { areas_response_id: areaResp.id },
            select: { id: true, bad_quantity: true },
          });
          if (!current) continue;

          const prev = Number(current.bad_quantity ?? 0);
          if (prev !== total) {
            await delegate.update({
              where: { id: current.id },
              data: { bad_quantity: total },
            });
            console.log('🔄 [RESYNC acumulables] ', {
              target_area_id: areaId,
              blockKey,
              areas_response_id: areaResp.id,
              prev,
              total,
            });
          } else {
            console.log('ℹ️ [RESYNC acumulables] ya coincide', {
              target_area_id: areaId,
              blockKey,
              total,
            });
          }
        }
      };

      const areaResponse = await tx.areasResponse.findFirst({
        where: { work_order_flow_id: flow.id },
        include: { inconformities: true },
      });

      const flowParcial = await tx.partialRelease.findFirst({
        where: {
          work_order_flow_id: flow.id,
          validated: false,
        },
        select: { id: true },
      });

      // ── CASO 1: Hay parciales sin validar (reinicio de liberación parcial)
      if (flowParcial) {
        // Marcar inconformidades del parcial como revisadas
        await tx.inconformities.updateMany({
          where: {
            partial_release_id: flowParcial.id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // 🔥 BORRAR detalles del parcial
        await tx.badQuantityDetail.deleteMany({
          where: {
            source_work_order_flow_id: flow.id,
            partial_release_id: flowParcial.id,
          },
        });

        // BORRAR el parcial y cualquier areas_response de ese flow
        await tx.partialRelease.deleteMany({
          where: { work_order_flow_id: flow.id, validated: false },
        });
        await tx.areasResponse.deleteMany({
          where: { work_order_flow_id: flow.id },
        });

        // Poner el flow listo
        await tx.workOrderFlow.update({
          where: { id: flow.id },
          data: { status: 'Listo' },
        });

        // 🧮 RESYNC absolutas en acumulables 2..5 tras la limpieza
        await resyncEarlyBlocks();

        return { message: 'Liberación parcial reiniciada con éxito' };
      }

      // ── CASO 2: No hay parcial sin validar, pero sí areaResponse con inconformidad
      if (areaResponse) {
        // ✔️ Marcar inconformidades como revisadas
        await tx.inconformities.updateMany({
          where: {
            areas_response_id: areaResponse.id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // Borrar auditoría asociada a corte si existe
        const hotStampingResponse = await tx.hotStampingResponse.findUnique({
          where: { areas_response_id: areaResponse.id },
          select: { id: true, form_auditory_id: true },
        });
        if (hotStampingResponse?.form_auditory_id) {
          await tx.formAuditory.deleteMany({
            where: { id: hotStampingResponse.form_auditory_id },
          });
        }

        // 🔥 Si el caso corresponde a remanente (partial_release_id = null), borra esos detalles
        await tx.badQuantityDetail.deleteMany({
          where: {
            source_work_order_flow_id: flow.id,
            partial_release_id: null,
          },
        });

        // Limpia el hotStampingResponse + areaResponse del flow
        await tx.hotStampingResponse.deleteMany({
          where: { areas_response_id: areaResponse.id },
        });
        await tx.areasResponse.deleteMany({
          where: { id: areaResponse.id },
        });

        await tx.workOrderFlow.update({
          where: { id: flow.id },
          data: { status: 'Listo' },
        });

        // 🧮 RESYNC absolutas en acumulables 2..5 tras la limpieza
        await resyncEarlyBlocks();

        return {
          message: 'Corte limpiado y la inconformidad marcada como revisada',
        };
      }
      return { message: 'No se encontró información para procesar' };
    });
  }

  async inconformityHotStampingAuditory(workOrderFlowId: number) {
    return this.prisma.$transaction(async (tx) => {
      // Buscar el flujo (obligatorio)
      const flow = await tx.workOrderFlow.findUnique({
        where: {
          id: Number(workOrderFlowId),
        },
      });
      if (!flow) {
        throw new Error('No se encontró el flujo');
      }

      // Buscar areaResponse (puede no existir)
      const areaResponse = await tx.areasResponse.findFirst({
        where: {
          WorkOrderFlow: {
            id: Number(workOrderFlowId),
          },
        },
      });

      if (areaResponse) {
        // Buscar hotStampingResponse asociado
        const hotStampingResponse = await tx.hotStampingResponse.findUnique({
          where: {
            areas_response_id: areaResponse.id,
          },
          include: {
            formAuditory: {
              include: {
                inconformities: true,
              },
            },
          },
        });
        await tx.inconformities.updateMany({
          where: {
            form_answer_id: hotStampingResponse?.form_auditory_id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // Desvincular solo si NO hay inconformidades registradas
        if (
          hotStampingResponse?.form_auditory_id &&
          hotStampingResponse.formAuditory?.inconformities.length === 0
        ) {
          await tx.hotStampingResponse.update({
            where: { id: hotStampingResponse.id },
            data: { form_auditory_id: null },
          });
        }
      } else {
        // Caso: flujo con partialRelease (sin areaResponse)
        const lastValidatedPartial = await tx.partialRelease.findFirst({
          where: {
            work_order_flow_id: flow.id,
            validated: true,
          },
          orderBy: { id: 'desc' },
          include: {
            formAuditory: {
              include: { inconformities: true },
            },
          },
        });

        if (lastValidatedPartial) {
          const inconformity = await tx.inconformities.findFirst({
            where: {
              form_auditory_id: lastValidatedPartial.form_auditory_id,
              OR: [{ reviewed: false }, { reviewed: null }],
            },
            select: { id: true },
          });

          if (inconformity) {
            await tx.inconformities.update({
              where: { id: inconformity.id },
              data: { reviewed: true },
            });
          }
          await tx.partialRelease.update({
            where: { id: lastValidatedPartial.id },
            data: {
              validated: false,
              form_auditory_id: null,
            },
          });
        }
      }

      // Verifica si queda alguna parcial no validada
      const hasPartial = await tx.partialRelease.findFirst({
        where: {
          work_order_flow_id: flow.id,
          validated: false,
        },
      });

      await tx.workOrderFlow.update({
        where: { id: flow.id },
        data: {
          status: hasPartial
            ? 'Enviado a auditoria parcial'
            : 'Enviado a Auditoria',
        },
      });

      return { message: 'Respuesta devuelta a auditoría correctamente' };
    });
  }

  async inconformityMillingChip(areaResponseId: number) {
    return this.prisma.$transaction(async (tx) => {
      const flow = await tx.workOrderFlow.findUnique({
        where: { id: Number(areaResponseId) },
      });
      if (!flow) throw new Error('Flujo no encontrado');

      // Para escribir en bloques acumulables
      const EARLY_AREA_TO_BLOCK: Record<number, EarlyBlockKey> = {
        2: 'impression',
        3: 'serigrafia',
        4: 'empalme',
        5: 'laminacion',
      };
      const EARLY_AREAS = Object.keys(EARLY_AREA_TO_BLOCK).map(Number);

      // Helper: RESYNC absolutas en bloques 2..5 (impression/serigrafia/empalme/laminacion)
      const resyncEarlyBlocks = async () => {
        // Suma por target_area_id de lo que QUEDA en badQuantityDetail
        const groups = await tx.badQuantityDetail.groupBy({
          by: ['target_area_id'],
          where: {
            work_order_id: flow.work_order_id,
            source_work_order_flow_id: flow.id,
            source_area_id: flow.area_id,
            target_area_id: { in: EARLY_AREAS },
          },
          _sum: { bad_quantity: true },
        });

        const totalsByArea = new Map<number, number>(
          EARLY_AREAS.map((id) => [id, 0]),
        );
        for (const g of groups) {
          totalsByArea.set(
            Number(g.target_area_id),
            Math.max(0, Number(g._sum.bad_quantity ?? 0)),
          );
        }

        for (const [areaId, total] of totalsByArea.entries()) {
          const blockKey = EARLY_AREA_TO_BLOCK[areaId];
          if (!blockKey) continue;

          // Último flow de ESA área en la OT
          const targetFlow = await tx.workOrderFlow.findFirst({
            where: { work_order_id: flow.work_order_id, area_id: areaId },
            orderBy: { id: 'desc' },
            select: { id: true },
          });
          if (!targetFlow) continue;

          // Su areas_response
          const areaResp = await tx.areasResponse.findFirst({
            where: { work_order_flow_id: targetFlow.id, area_id: areaId },
            select: { id: true },
          });
          if (!areaResp) continue;

          const cfg = EARLY_BLOCK_CONFIG[blockKey];
          const delegate = (tx as any)[cfg.delegate];

          // Solo estos bloques (2..5) llevan bad_quantity, no material
          const current = await delegate.findFirst({
            where: { areas_response_id: areaResp.id },
            select: { id: true, bad_quantity: true },
          });
          if (!current) continue;

          const prev = Number(current.bad_quantity ?? 0);
          if (prev !== total) {
            await delegate.update({
              where: { id: current.id },
              data: { bad_quantity: total },
            });
            console.log('🔄 [RESYNC acumulables] ', {
              target_area_id: areaId,
              blockKey,
              areas_response_id: areaResp.id,
              prev,
              total,
            });
          } else {
            console.log('ℹ️ [RESYNC acumulables] ya coincide', {
              target_area_id: areaId,
              blockKey,
              total,
            });
          }
        }
      };

      const areaResponse = await tx.areasResponse.findFirst({
        where: { work_order_flow_id: flow.id },
        include: { inconformities: true },
      });

      const flowParcial = await tx.partialRelease.findFirst({
        where: {
          work_order_flow_id: flow?.id,
          validated: false,
        },
        select: { id: true },
      });

      // ── CASO 1: Hay parciales sin validar (reinicio de liberación parcial)
      if (flowParcial) {
        // Marcar inconformidades del parcial como revisadas
        await tx.inconformities.updateMany({
          where: {
            partial_release_id: flowParcial.id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // 🔥 BORRAR detalles del parcial
        await tx.badQuantityDetail.deleteMany({
          where: {
            source_work_order_flow_id: flow.id,
            partial_release_id: flowParcial.id,
          },
        });

        // BORRAR el parcial y cualquier areas_response de ese flow
        await tx.partialRelease.deleteMany({
          where: { work_order_flow_id: flow.id, validated: false },
        });
        await tx.areasResponse.deleteMany({
          where: { work_order_flow_id: flow.id },
        });

        // Poner el flow listo
        await tx.workOrderFlow.update({
          where: { id: flow.id },
          data: { status: 'Listo' },
        });

        // 🧮 RESYNC absolutas en acumulables 2..5 tras la limpieza
        await resyncEarlyBlocks();

        return { message: 'Liberación parcial reiniciada con éxito' };
      }

      // ── CASO 2: No hay parcial sin validar, pero sí areaResponse con inconformidad
      if (areaResponse) {
        // ✔️ Marcar inconformidades como revisadas
        await tx.inconformities.updateMany({
          where: {
            areas_response_id: areaResponse.id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // Borrar auditoría asociada a corte si existe
        const millingChipResponse = await tx.millingChipResponse.findUnique({
          where: { areas_response_id: areaResponse.id },
          select: { id: true, form_auditory_id: true },
        });
        if (millingChipResponse?.form_auditory_id) {
          await tx.formAuditory.deleteMany({
            where: { id: millingChipResponse.form_auditory_id },
          });
        }

        // 🔥 Si el caso corresponde a remanente (partial_release_id = null), borra esos detalles
        await tx.badQuantityDetail.deleteMany({
          where: {
            source_work_order_flow_id: flow.id,
            partial_release_id: null,
          },
        });

        // Limpia el corte + areaResponse del flow
        await tx.millingChipResponse.deleteMany({
          where: { areas_response_id: areaResponse.id },
        });
        await tx.areasResponse.deleteMany({
          where: { id: areaResponse.id },
        });

        await tx.workOrderFlow.update({
          where: { id: flow.id },
          data: { status: 'Listo' },
        });

        // 🧮 RESYNC absolutas en acumulables 2..5 tras la limpieza
        await resyncEarlyBlocks();

        return {
          message: 'Corte limpiado y la inconformidad marcada como revisada',
        };
      }

      return { message: 'No se encontró información para procesar' };
    });
  }

  async inconformityMillingChipAuditory(workOrderFlowId: number) {
    return this.prisma.$transaction(async (tx) => {
      // Buscar el flujo (obligatorio)
      const flow = await tx.workOrderFlow.findUnique({
        where: {
          id: Number(workOrderFlowId),
        },
      });
      if (!flow) {
        throw new Error('No se encontró el flujo');
      }

      // Buscar areaResponse (puede no existir)
      const areaResponse = await tx.areasResponse.findFirst({
        where: {
          WorkOrderFlow: {
            id: Number(workOrderFlowId),
          },
        },
      });

      if (areaResponse) {
        // Buscar millingChipResponse asociado
        const millingChipResponse = await tx.millingChipResponse.findUnique({
          where: {
            areas_response_id: areaResponse.id,
          },
          include: {
            formAuditory: {
              include: {
                inconformities: true,
              },
            },
          },
        });
        await tx.inconformities.updateMany({
          where: {
            form_answer_id: millingChipResponse?.form_auditory_id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // Desvincular solo si NO hay inconformidades registradas
        if (
          millingChipResponse?.form_auditory_id &&
          millingChipResponse.formAuditory?.inconformities.length === 0
        ) {
          await tx.millingChipResponse.update({
            where: { id: millingChipResponse.id },
            data: { form_auditory_id: null },
          });
        }
      } else {
        // Caso: flujo con partialRelease (sin areaResponse)
        const lastValidatedPartial = await tx.partialRelease.findFirst({
          where: {
            work_order_flow_id: flow.id,
            validated: true,
          },
          orderBy: { id: 'desc' },
          include: {
            formAuditory: {
              include: { inconformities: true },
            },
          },
        });

        if (lastValidatedPartial) {
          const inconformity = await tx.inconformities.findFirst({
            where: {
              form_auditory_id: lastValidatedPartial.form_auditory_id,
              OR: [{ reviewed: false }, { reviewed: null }],
            },
            select: { id: true },
          });

          if (inconformity) {
            await tx.inconformities.update({
              where: { id: inconformity.id },
              data: { reviewed: true },
            });
          }
          await tx.partialRelease.update({
            where: { id: lastValidatedPartial.id },
            data: {
              validated: false,
              form_auditory_id: null,
            },
          });
        }
      }

      // Verifica si queda alguna parcial no validada
      const hasPartial = await tx.partialRelease.findFirst({
        where: {
          work_order_flow_id: flow.id,
          validated: false,
        },
      });

      await tx.workOrderFlow.update({
        where: { id: flow.id },
        data: {
          status: hasPartial
            ? 'Enviado a auditoria parcial'
            : 'Enviado a Auditoria',
        },
      });

      return { message: 'Respuesta devuelta a auditoría correctamente' };
    });
  }

  async inconformityPersonalizacion(areaResponseId: number) {
    return this.prisma.$transaction(async (tx) => {
      const flow = await tx.workOrderFlow.findUnique({
        where: { id: Number(areaResponseId) },
      });
      if (!flow) throw new Error('Flujo no encontrado');

      // Para escribir en bloques acumulables
      const EARLY_AREA_TO_BLOCK: Record<number, EarlyBlockKey> = {
        2: 'impression',
        3: 'serigrafia',
        4: 'empalme',
        5: 'laminacion',
      };
      const EARLY_AREAS = Object.keys(EARLY_AREA_TO_BLOCK).map(Number);

      // Helper: RESYNC absolutas en bloques 2..5 (impression/serigrafia/empalme/laminacion)
      const resyncEarlyBlocks = async () => {
        // Suma por target_area_id de lo que QUEDA en badQuantityDetail
        const groups = await tx.badQuantityDetail.groupBy({
          by: ['target_area_id'],
          where: {
            work_order_id: flow.work_order_id,
            source_work_order_flow_id: flow.id,
            source_area_id: flow.area_id,
            target_area_id: { in: EARLY_AREAS },
          },
          _sum: { bad_quantity: true },
        });

        const totalsByArea = new Map<number, number>(
          EARLY_AREAS.map((id) => [id, 0]),
        );
        for (const g of groups) {
          totalsByArea.set(
            Number(g.target_area_id),
            Math.max(0, Number(g._sum.bad_quantity ?? 0)),
          );
        }

        for (const [areaId, total] of totalsByArea.entries()) {
          const blockKey = EARLY_AREA_TO_BLOCK[areaId];
          if (!blockKey) continue;

          // Último flow de ESA área en la OT
          const targetFlow = await tx.workOrderFlow.findFirst({
            where: { work_order_id: flow.work_order_id, area_id: areaId },
            orderBy: { id: 'desc' },
            select: { id: true },
          });
          if (!targetFlow) continue;

          // Su areas_response
          const areaResp = await tx.areasResponse.findFirst({
            where: { work_order_flow_id: targetFlow.id, area_id: areaId },
            select: { id: true },
          });
          if (!areaResp) continue;

          const cfg = EARLY_BLOCK_CONFIG[blockKey];
          const delegate = (tx as any)[cfg.delegate];

          // Solo estos bloques (2..5) llevan bad_quantity, no material
          const current = await delegate.findFirst({
            where: { areas_response_id: areaResp.id },
            select: { id: true, bad_quantity: true },
          });
          if (!current) continue;

          const prev = Number(current.bad_quantity ?? 0);
          if (prev !== total) {
            await delegate.update({
              where: { id: current.id },
              data: { bad_quantity: total },
            });
            console.log('🔄 [RESYNC acumulables] ', {
              target_area_id: areaId,
              blockKey,
              areas_response_id: areaResp.id,
              prev,
              total,
            });
          } else {
            console.log('ℹ️ [RESYNC acumulables] ya coincide', {
              target_area_id: areaId,
              blockKey,
              total,
            });
          }
        }
      };

      const areaResponse = await tx.areasResponse.findFirst({
        where: { work_order_flow_id: flow.id },
        include: { inconformities: true },
      });

      const flowParcial = await tx.partialRelease.findFirst({
        where: {
          work_order_flow_id: flow?.id,
          validated: false,
        },
        select: { id: true },
      });

      // ── CASO 1: Hay parciales sin validar (reinicio de liberación parcial)
      if (flowParcial) {
        // Marcar inconformidades del parcial como revisadas
        await tx.inconformities.updateMany({
          where: {
            partial_release_id: flowParcial.id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // 🔥 BORRAR detalles del parcial
        await tx.badQuantityDetail.deleteMany({
          where: {
            source_work_order_flow_id: flow.id,
            partial_release_id: flowParcial.id,
          },
        });

        // BORRAR el parcial y cualquier areas_response de ese flow
        await tx.partialRelease.deleteMany({
          where: { work_order_flow_id: flow.id, validated: false },
        });
        await tx.areasResponse.deleteMany({
          where: { work_order_flow_id: flow.id },
        });

        // Poner el flow listo
        await tx.workOrderFlow.update({
          where: { id: flow.id },
          data: { status: 'Listo' },
        });

        // 🧮 RESYNC absolutas en acumulables 2..5 tras la limpieza
        await resyncEarlyBlocks();

        return { message: 'Liberación parcial reiniciada con éxito' };
      }

      // ── CASO 2: No hay parcial sin validar, pero sí areaResponse con inconformidad
      if (areaResponse) {
        // ✔️ Marcar inconformidades como revisadas
        await tx.inconformities.updateMany({
          where: {
            areas_response_id: areaResponse.id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // Borrar auditoría asociada a corte si existe
        const personalizacionResponse = await tx.personalizacionResponse.findUnique({
          where: { areas_response_id: areaResponse.id },
          select: { id: true, form_auditory_id: true },
        });
        if (personalizacionResponse?.form_auditory_id) {
          await tx.formAuditory.deleteMany({
            where: { id: personalizacionResponse.form_auditory_id },
          });
        }

        // 🔥 Si el caso corresponde a remanente (partial_release_id = null), borra esos detalles
        await tx.badQuantityDetail.deleteMany({
          where: {
            source_work_order_flow_id: flow.id,
            partial_release_id: null,
          },
        });

        // Limpia el personalizacionResponse + areaResponse del flow
        await tx.personalizacionResponse.deleteMany({
          where: { areas_response_id: areaResponse.id },
        });
        await tx.areasResponse.deleteMany({
          where: { id: areaResponse.id },
        });

        await tx.workOrderFlow.update({
          where: { id: flow.id },
          data: { status: 'Listo' },
        });

        // 🧮 RESYNC absolutas en acumulables 2..5 tras la limpieza
        await resyncEarlyBlocks();

        return {
          message: 'Corte limpiado y la inconformidad marcada como revisada',
        };
      }

      return { message: 'No se encontró información para procesar' };
    });
  }

  async inconformityCQM(areaResponseId: number) {
    return this.prisma.$transaction(async (tx) => {
      const answer = await tx.formAnswer.findUnique({
        where: {
          id: Number(areaResponseId),
        },
      });
      if (!answer) {
        throw new Error('No se encontró las respuestas del formulario');
      }
      await tx.inconformities.updateMany({
        where: {
          form_answer_id: answer.id,
          OR: [{ reviewed: false }, { reviewed: null }],
        },
        data: { reviewed: true },
      });
      const flow = await tx.workOrderFlow.findUnique({
        where: {
          id: answer?.work_order_flow_id,
        },
        include: {
          partialReleases: true,
        },
      });
      await tx.formAnswerResponse.deleteMany({
        where: {
          form_answer_id: answer?.id,
        },
      });
      await tx.formAnswer.delete({
        where: {
          id: answer?.id,
        },
      });

      await tx.workOrderFlow.update({
        where: {
          id: flow?.id,
        },
        data: {
          status: 'En proceso',
        },
      });
      return { message: 'Respuesta guardada con exito' };
    });
  }

  async inconformityPersonalizacionAuditory(workOrderFlowId: number) {
    return this.prisma.$transaction(async (tx) => {
      // Buscar el flujo (obligatorio)
      const flow = await tx.workOrderFlow.findUnique({
        where: {
          id: Number(workOrderFlowId),
        },
      });
      if (!flow) {
        throw new Error('No se encontró el flujo');
      }

      // Buscar areaResponse (puede no existir)
      const areaResponse = await tx.areasResponse.findFirst({
        where: {
          WorkOrderFlow: {
            id: Number(workOrderFlowId),
          },
        },
      });

      if (areaResponse) {
        // Buscar personalizacionResponse asociado
        await tx.inconformities.updateMany({
          where: {
            areas_response_id: areaResponse.id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });
        const personalizacionResponse =
          await tx.personalizacionResponse.findUnique({
            where: {
              areas_response_id: areaResponse.id,
            },
            include: {
              formAuditory: {
                include: {
                  inconformities: true,
                },
              },
            },
          });
        await tx.inconformities.updateMany({
          where: {
            form_auditory_id: personalizacionResponse?.form_auditory_id,
            OR: [{ reviewed: false }, { reviewed: null }],
          },
          data: { reviewed: true },
        });

        // Desvincular solo si NO hay inconformidades registradas
        if (
          personalizacionResponse?.form_auditory_id &&
          personalizacionResponse.formAuditory?.inconformities.length === 0
        ) {
          await tx.personalizacionResponse.update({
            where: { id: personalizacionResponse.id },
            data: { form_auditory_id: null },
          });
        }
      } else {
        // Caso: flujo con partialRelease (sin areaResponse)
        const lastValidatedPartial = await tx.partialRelease.findFirst({
          where: {
            work_order_flow_id: flow.id,
            validated: true,
          },
          orderBy: { id: 'desc' },
          include: {
            formAuditory: {
              include: { inconformities: true },
            },
          },
        });
        if (lastValidatedPartial) {
          const inconformity = await tx.inconformities.findFirst({
            where: {
              form_auditory_id: lastValidatedPartial.form_auditory_id,
              OR: [{ reviewed: false }, { reviewed: null }],
            },
            select: { id: true },
          });

          if (inconformity) {
            await tx.inconformities.update({
              where: { id: inconformity.id },
              data: { reviewed: true },
            });
          }
          await tx.partialRelease.update({
            where: { id: lastValidatedPartial.id },
            data: {
              validated: false,
              form_auditory_id: null,
            },
          });
        }
      }

      // Verifica si queda alguna parcial no validada
      const hasPartial = await tx.partialRelease.findFirst({
        where: {
          work_order_flow_id: flow.id,
          validated: false,
        },
      });

      await tx.workOrderFlow.update({
        where: { id: flow.id },
        data: {
          status: hasPartial
            ? 'Enviado a auditoria parcial'
            : 'Enviado a Auditoria',
        },
      });

      return { message: 'Respuesta devuelta a auditoría correctamente' };
    });
  }
}
