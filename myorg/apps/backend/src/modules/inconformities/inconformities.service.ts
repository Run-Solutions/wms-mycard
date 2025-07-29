import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

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
      // Eliminar el registro serigrafia asociado a ese AreasResponse
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

  async inconformityCorte(areaResponseId: number) {
    return this.prisma.$transaction(async (tx) => {
      const flow = await tx.workOrderFlow.findUnique({
        where: { id: Number(areaResponseId) },
      });
      if (!flow) throw new Error('Flujo no encontrado');

      const areaResponse = await tx.areasResponse.findFirst({
        where: { work_order_flow_id: flow.id },
        include: { inconformities: true },
      });

      const unvalidatedPartials = await tx.partialRelease.findMany({
        where: {
          work_order_flow_id: flow.id,
          validated: false,
        },
      });

      // CASO 1: No hay respuesta de área pero hay parciales inválidos
      if (
        (!areaResponse && unvalidatedPartials.length > 0) ||
        (areaResponse && unvalidatedPartials.length > 0)
      ) {
        await tx.partialRelease.deleteMany({
          where: { work_order_flow_id: flow.id, validated: false },
        });

        await tx.areasResponse.deleteMany({
          where: { work_order_flow_id: flow.id },
        });

        await tx.workOrderFlow.update({
          where: { id: flow.id },
          data: { status: 'Listo' },
        });

        return { message: 'Liberación parcial reiniciada con éxito' };
      }

      // CASO 2: Hay respuesta de área con inconformidad
      if (areaResponse) {
        // ✔️ Marcar inconformidades como revisadas
        await tx.inconformities.updateMany({
          where: {
            areas_response_id: areaResponse.id,
            reviewed: false,
          },
          data: { reviewed: true },
        });

        const corteResponse = await tx.corteResponse.findUnique({
          where: { areas_response_id: areaResponse.id },
        });

        if (corteResponse?.form_auditory_id) {
          await tx.formAuditory.deleteMany({
            where: { id: corteResponse.form_auditory_id },
          });
        }

        // ❌ Se elimina solo el corte, NO la inconformidad
        await tx.corteResponse.deleteMany({
          where: { areas_response_id: areaResponse.id },
        });

        // ❌ No se elimina el áreaResponse (mantiene relación con la inconformidad)
        await tx.workOrderFlow.update({
          where: { id: flow.id },
          data: { status: 'Listo' },
        });

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
          await tx.partialRelease.update({
            where: { id: lastValidatedPartial.id },
            data: {
              validated: false,
              form_auditory_id: null, // ❌ Desvincular en vez de eliminar
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
      const colorEdgeResponse = await tx.colorEdgeResponse.findUnique({
        where: {
          areas_response_id: areaResponse.id,
        },
      });
      if (colorEdgeResponse) {
        // Si existe un form_auditory_id, eliminar el FormAuditory
        if (colorEdgeResponse.form_auditory_id) {
          await tx.formAuditory.deleteMany({
            where: {
              id: colorEdgeResponse.form_auditory_id,
            },
          });
        }
        // Eliminar el registro empalme asociado a ese AreasResponse
        await tx.areasResponse.deleteMany({
          where: {
            id: areaResponse.id,
          },
        });
        await tx.colorEdgeResponse.deleteMany({
          where: {
            areas_response_id: areaResponse.id,
          },
        });
      }
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
      const hotStampingResponse = await tx.hotStampingResponse.findUnique({
        where: {
          areas_response_id: areaResponse.id,
        },
      });
      if (hotStampingResponse) {
        // Si existe un form_auditory_id, eliminar el FormAuditory
        if (hotStampingResponse.form_auditory_id) {
          await tx.formAuditory.deleteMany({
            where: {
              id: hotStampingResponse.form_auditory_id,
            },
          });
        }
        // Eliminar el registro empalme asociado a ese AreasResponse
        await tx.hotStampingResponse.deleteMany({
          where: {
            areas_response_id: areaResponse.id,
          },
        });
      }
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
      const millingChipResponse = await tx.millingChipResponse.findUnique({
        where: {
          areas_response_id: areaResponse.id,
        },
      });
      if (millingChipResponse) {
        // Si existe un form_auditory_id, eliminar el FormAuditory
        if (millingChipResponse.form_auditory_id) {
          await tx.formAuditory.deleteMany({
            where: {
              id: millingChipResponse.form_auditory_id,
            },
          });
        }
        // Eliminar el registro empalme asociado a ese AreasResponse
        await tx.millingChipResponse.deleteMany({
          where: {
            areas_response_id: areaResponse.id,
          },
        });
      }
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
      const personalizacionResponse =
        await tx.personalizacionResponse.findUnique({
          where: {
            areas_response_id: areaResponse.id,
          },
        });
      if (personalizacionResponse) {
        // Si existe un form_auditory_id, eliminar el FormAuditory
        if (personalizacionResponse.form_auditory_id) {
          await tx.formAuditory.deleteMany({
            where: {
              id: personalizacionResponse.form_auditory_id,
            },
          });
        }
        // Eliminar el registro empalme asociado a ese AreasResponse
        await tx.personalizacionResponse.deleteMany({
          where: {
            areas_response_id: areaResponse.id,
          },
        });
        await tx.areasResponse.deleteMany({
          where: {
            id: areaResponse.id,
          },
        });
      }
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

  async inconformityCQM(areaResponseId: number) {
    return this.prisma.$transaction(async (tx) => {
      const answer = await tx.formAnswer.findUnique({
        where: {
          id: Number(areaResponseId),
        },
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
        const personalizacionResponse = await tx.personalizacionResponse.findUnique({
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
