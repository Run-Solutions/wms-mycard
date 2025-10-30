/* myorg\apps\backend\src\modules\work-order\work-order.service.ts */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateWorkOrderDto,
  BadQuantitySummaryDto,
  UpdateAreaResponseDataDto,
  UpdateAreaResponseEntryDto,
} from './dto/create-work-order.dto';

type BlockKey =
  | 'prepress'
  | 'impression'
  | 'serigrafia'
  | 'empalme'
  | 'laminacion'
  | 'corte'
  | 'colorEdge'
  | 'hotStamping'
  | 'millingChip'
  | 'personalizacion';

type UpdatableField = 'bad_quantity' | 'material_quantity';

type BadQuantityDetailSnapshot = {
  id: number;
  bad_quantity: number | Prisma.Decimal | null;
  material_quantity: number | Prisma.Decimal | null;
  values: Prisma.JsonValue | null;
};

type DelegateKey =
  | 'prepressResponse'
  | 'impressionResponse'
  | 'serigrafiaResponse'
  | 'empalmeResponse'
  | 'laminacionResponse'
  | 'corteResponse'
  | 'colorEdgeResponse'
  | 'hotStampingResponse'
  | 'millingChipResponse'
  | 'personalizacionResponse';

type ResultBlockKey = BlockKey | 'partialRelease';

type DetailSnapshot = {
  id: number;
  bad_quantity: number | Prisma.Decimal | null;
  material_quantity: number | Prisma.Decimal | null;
  values: Prisma.JsonValue | null;
};

type DetailPersistenceContext = {
  partialReleaseId: number | null;
  sourceWorkOrderFlowId: number;
  sourceAreaId: number;
  existing: DetailSnapshot | null;
};

const AREA_NAME_TO_BLOCK: Record<string, BlockKey> = {
  preprensa: 'prepress',
  prepress: 'prepress',
  impresion: 'impression',
  impression: 'impression',
  serigrafia: 'serigrafia',
  empalme: 'empalme',
  laminacion: 'laminacion',
  lamination: 'laminacion',
  corte: 'corte',
  coloredge: 'colorEdge',
  color_edge: 'colorEdge',
  'color edge': 'colorEdge',
  'color-edge': 'colorEdge',
  hotstamping: 'hotStamping',
  'hot stamping': 'hotStamping',
  hot_stamping: 'hotStamping',
  millingchip: 'millingChip',
  'milling chip': 'millingChip',
  milling_chip: 'millingChip',
  personalizacion: 'personalizacion',
  personalization: 'personalizacion',
};

const ACCUMULATE_BLOCKS = new Set<ResultBlockKey>([
  'prepress',
  'impression',
  'serigrafia',
  'empalme',
  'laminacion',
]);

const CUT_AREA_ID = 6;
const AGGREGATE_INTO_CUT_AREA_IDS = new Set<number>([1, 2, 3, 4, 5]);

const BLOCK_CONFIG: Record<
  BlockKey,
  { delegate: DelegateKey; updatableFields: ReadonlyArray<UpdatableField> }
> = {
  prepress: { delegate: 'prepressResponse', updatableFields: ['bad_quantity'] },
  impression: {
    delegate: 'impressionResponse',
    updatableFields: ['bad_quantity'],
  },
  serigrafia: {
    delegate: 'serigrafiaResponse',
    updatableFields: ['bad_quantity'],
  },
  empalme: { delegate: 'empalmeResponse', updatableFields: ['bad_quantity'] },
  laminacion: {
    delegate: 'laminacionResponse',
    updatableFields: ['bad_quantity'],
  },
  corte: {
    delegate: 'corteResponse',
    updatableFields: ['bad_quantity', 'material_quantity'],
  },
  colorEdge: {
    delegate: 'colorEdgeResponse',
    updatableFields: ['bad_quantity', 'material_quantity'],
  },
  hotStamping: {
    delegate: 'hotStampingResponse',
    updatableFields: ['bad_quantity', 'material_quantity'],
  },
  millingChip: {
    delegate: 'millingChipResponse',
    updatableFields: ['bad_quantity', 'material_quantity'],
  },
  personalizacion: {
    delegate: 'personalizacionResponse',
    updatableFields: ['bad_quantity', 'material_quantity'],
  },
};

const BLOCK_DATA_FIELDS: Record<BlockKey, ReadonlyArray<string>> = {
  prepress: ['plates', 'positives', 'bad_quantity', 'excess_quantity'],
  impression: ['release_quantity', 'bad_quantity', 'excess_quantity'],
  serigrafia: ['release_quantity', 'bad_quantity', 'excess_quantity'],
  empalme: ['release_quantity', 'bad_quantity', 'excess_quantity'],
  laminacion: ['release_quantity', 'bad_quantity', 'excess_quantity'],
  corte: [
    'good_quantity',
    'bad_quantity',
    'excess_quantity',
    'noprocess_quantity',
    'material_quantity',
  ],
  colorEdge: [
    'good_quantity',
    'bad_quantity',
    'excess_quantity',
    'noprocess_quantity',
    'material_quantity',
  ],
  hotStamping: [
    'good_quantity',
    'bad_quantity',
    'excess_quantity',
    'noprocess_quantity',
    'material_quantity',
  ],
  millingChip: [
    'good_quantity',
    'bad_quantity',
    'excess_quantity',
    'noprocess_quantity',
    'material_quantity',
  ],
  personalizacion: [
    'good_quantity',
    'bad_quantity',
    'excess_quantity',
    'noprocess_quantity',
    'material_quantity',
  ],
};

const PARTIAL_RELEASE_FIELDS: ReadonlyArray<UpdatableField> = [
  'bad_quantity',
  'material_quantity',
];

@Injectable()
export class WorkOrderService {
  constructor(private prisma: PrismaService) { }

  async createWorkOrder(
    dto: CreateWorkOrderDto,
    files: {
      ot: Express.Multer.File | null;
      sku: Express.Multer.File | null;
      op: Express.Multer.File | null;
      cardImage: Express.Multer.File | null;
      attachments?: Express.Multer.File[];
    },
    userId: number,
  ) {
    const { ot_id, mycard_id, areasOperatorIds, comments } = dto;
    const quantity = Number(dto.quantity); // Se debe asegurar de que llegue como numero
    const quantity_contacts = Number(dto.quantity_contacts); // Se debe asegurar de que llegue como numero
    const total_sheets = Number(dto.total_sheets); // Se debe asegurar de que llegue como numero
    const isCollator = dto.isCollator === '1' ? true : false;
    // Asegurarse de que priority sea un booleano
    let priority = false; // Valor por defecto
    if (dto.priority === 'true') {
      priority = true;
    } else if (dto.priority === 'false') {
      priority = false;
    } else if (typeof dto.priority === 'boolean') {
      priority = dto.priority;
    }

    const extras = files.attachments || [];
    const MAX_FILES = 9;
    const total =
      (files.ot ? 1 : 0) +
      (files.sku ? 1 : 0) +
      (files.op ? 1 : 0) +
      (files.cardImage ? 1 : 0) +
      extras.length;
    if (total > MAX_FILES) {
      throw new BadRequestException(`Máximo ${MAX_FILES} archivos por orden.`);
    }
    // Para guardar la OT en la BD
    console.log('LLega');
    const workOrder = await this.prisma.workOrder.create({
      data: {
        ot_id,
        mycard_id,
        quantity,
        status: 'En proceso',
        priority,
        comments,
        quantity_contacts,
        created_by: userId,
        total_sheets,
        isCollator,
      },
    });

    // Subir los archivos
    const fileMappings = [
      { key: 'ot', file: files.ot, type: 'OT' },
      { key: 'sku', file: files.sku, type: 'SKU' },
      { key: 'op', file: files.op, type: 'OP' },
    ];

    // Para subir los archivos
    try {
      for (const { file, type } of fileMappings) {
        if (file) {
          await this.prisma.workOrderFiles.create({
            data: {
              work_order_id: workOrder.id,
              type, // 'OT' | 'SKU' | 'OP'
              file_path: file.filename,
            },
          });
        }
      }
      if (files.cardImage) {
        await this.prisma.workOrderFiles.create({
          data: {
            work_order_id: workOrder.id,
            type: 'CARD_IMAGE', // 👈 usa un tipo claro y consistente
            file_path: files.cardImage.filename,
          },
        });
      }

      // Guardar adjuntos adicionales
      for (const f of extras) {
        await this.prisma.workOrderFiles.create({
          data: {
            work_order_id: workOrder.id,
            type: 'ATTACHMENT', // etiqueta homogénea para adjuntos
            file_path: f.filename,
          },
        });
      }
    } catch (error) {
      console.error('Error al guardar los archivos:', error);
    }

    // Para asignar las areas, debe ser un array de numeros
    let areasArray: number[] = [];
    if (areasOperatorIds) {
      areasArray = Array.isArray(areasOperatorIds)
        ? areasOperatorIds.map(Number)
        : [];
    }
    console.log('Tipo de areasOperatorIds:', typeof areasArray);
    console.log('Contenido de areasOperatorIds:', areasArray);

    try {
      for (let i = 0; i < areasArray.length; i++) {
        const areaId = areasArray[i];
        const status = i === 0 ? 'Pendiente' : 'En espera';
        console.log(
          `Creando WorkOrderFlow para area_id: ${areaId}, status: ${status}`,
        );
        await this.prisma.workOrderFlow.create({
          data: {
            work_order_id: workOrder.id,
            area_id: areaId,
            status: status,
          },
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al asignar áreas:', error.message);
      }
    }

    return workOrder;
  }

  // Para obtener los WorkOrders en proceso
  async getInProgressWorkOrders(userId: number, statuses: string[]) {
    console.log('Buscando ordenes', statuses);
    if (!userId) {
      throw new Error('No se proporcionan areas validas');
    }
    const inProgressWorkOrders = await this.prisma.workOrder.findMany({
      where: {
        status: {
          in: statuses,
        },
      },
      include: {
        user: true,
        flow: {
          include: {
            area: true,
            areaResponse: true,
          },
        },
        files: true,
        formAnswers: true,
      },
    });
    if (inProgressWorkOrders.length === 0) {
      return { message: 'No hay ordenes pendientes para esta area.' };
    }
    console.log(
      'Ordenes pendientes desde work-orders services',
      inProgressWorkOrders,
    );
    return inProgressWorkOrders;
  }

  async getUsers(userId: number) {
    console.log('Buscando usuarios');
    if (!userId) {
      throw new Error('No se proporcionan areas validas');
    }
    const users = await this.prisma.user.findMany({
      where: {
        role: { name: 'operador' }, // relación Role -> campo name
      },
      select: {
        id: true,
        username: true,
        areasOperator: {
          // relación a AreasOperator
          select: { name: true, id: true },
        },
      },
    });

    return users;
  }
  // service.ts
  async updateFlowAssignedUser(
    flowId: number,
    userId: number,
    changedByUserId: number,
    note?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1) Flow previo (con info para el log)
      const prev = await tx.workOrderFlow.findUnique({
        where: { id: flowId },
        select: {
          id: true,
          work_order_id: true,
          area_id: true,
          assigned_user: true,
          user: { select: { id: true, username: true } }, // usuario asignado previo
          area: { select: { id: true, name: true } }, // si tienes relación area
        },
      });
      if (!prev) throw new NotFoundException(`Flow ${flowId} no encontrado`);

      // 2) Validar nuevo usuario
      const newUser = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, areas_operator_id: true },
      });
      if (!newUser)
        throw new NotFoundException(`Usuario ${userId} no encontrado`);

      // 3) (Opcional) validar que el actor existe
      const actor = await tx.user.findUnique({
        where: { id: changedByUserId },
        select: { id: true, username: true },
      });
      if (!actor)
        throw new NotFoundException(`Actor ${changedByUserId} no encontrado`);

      // 4) Evitar log inútil si no hay cambio
      if (prev.assigned_user === userId) {
        // Puedes retornar el estado actual o forzar un log "no-op" si lo deseas
        return tx.workOrderFlow.update({
          where: { id: flowId },
          data: { assigned_at: new Date() }, // opcional refrescar timestamp
          include: { user: { select: { id: true, username: true } } },
        });
      }

      // 5) Actualizar el encargado del flow
      const updated = await tx.workOrderFlow.update({
        where: { id: flowId },
        data: {
          assigned_user: userId,
          assigned_at: new Date(),
        },
        include: {
          user: { select: { id: true, username: true } }, // nuevo asignado
        },
      });

      // 6) Crear log dedicado
      await tx.flowAssigneeChangeLog.create({
        data: {
          flowId: flowId,
          workOrderId: prev.work_order_id, // asegura que existe en tu modelo
          areaId: prev.area_id,
          areaName: prev.area?.name ?? 'Desconocida', // snapshot

          oldAssigneeId: prev.assigned_user ?? null,
          oldAssigneeUsername: prev.user?.username ?? null,

          newAssigneeId: newUser.id,
          newAssigneeUsername: newUser.username,

          changedByUserId: actor.id,
          changedByUsername: actor.username,

          note: note ?? null,
        },
      });

      return updated;
    });
  }
  // Para obtener una Orden de Trabajo En Proceso por ID
  async getInProgressWorkOrdersById(id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: {
        ot_id: id,
      },
      include: {
        user: true,
        files: true,
        flow: {
          include: {
            user: true,
            badQuantityDetails: {
              include: {
                targetArea: true,
              },
            },
            workOrder: {
              include: {
                user: true,
                files: true,
                flow: {
                  include: {
                    badQuantityDetails: {
                      include: {
                        targetArea: true,
                      },
                    },
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
            partialReleases: {
              include: {
                user: true,
                badQuantityDetails: {
                  include: {
                    targetArea: true,
                  }
                },
                formAuditory: {
                  include: {
                    user: true,
                    inconformities: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
                inconformities: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            area: {
              include: {
                formQuestions: true,
              },
            },
            areaResponse: {
              include: {
                user: true,
                prepress: true,
                inconformities: {
                  include: {
                    user: true,
                  },
                },
                impression: {
                  include: {
                    form_answer: true,
                  },
                },
                serigrafia: {
                  include: {
                    form_answer: true,
                  },
                },
                empalme: {
                  include: {
                    form_answer: true,
                  },
                },
                laminacion: {
                  include: {
                    form_answer: true,
                  },
                },
                corte: {
                  include: {
                    form_answer: true,
                    formAuditory: {
                      include: {
                        user: true,
                        inconformities: {
                          include: {
                            user: true,
                          },
                        },
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
                        inconformities: {
                          include: {
                            user: true,
                          },
                        },
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
                        inconformities: {
                          include: {
                            user: true,
                          },
                        },
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
                        inconformities: {
                          include: {
                            user: true,
                          },
                        },
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
                        inconformities: {
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
            answers: {
              include: {
                reviewer: true,
                FormAnswerResponse: true,
                inconformities: {
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
    if (!workOrder) {
      return { message: 'No se encontró una orden para esta área.' };
    }
    return workOrder;
  }

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
                    corte: {
                      include: {
                        form_answer: true,
                        formAuditory: true,
                      },
                    },
                  },
                },
              },
            },
            areasResponses: {
              include: {
                corte: true,
              },
            },
            formAnswers: {
              include: {
                corteResponse: true,
                colorEdgeResponse: true,
                hotStampingResponse: true,
                millingChipResponse: true,
                personalizacionResponse: true,
              },
            },
          },
        },
        answers: {
          include: {
            corteResponse: true,
          },
        },
      },
    });
    if (!workOrderFlow) {
      return { message: 'No se encontró una orden para esta área.' };
    }
    return workOrderFlow;
  }

  async closeWorkOrderById(dto: CreateWorkOrderDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: {
          ot_id: dto.ot_id,
        },
        data: {
          status: 'Cerrado',
          closed_by: userId,
        },
      });
      const WorkOrder = await tx.workOrder.findUnique({
        where: {
          ot_id: dto.ot_id,
        },
        select: {
          id: true,
        },
      });
      if (!WorkOrder) {
        throw new Error('Orden de trabajo no encontrada');
      }
      await tx.workOrderFlow.updateMany({
        where: {
          work_order_id: WorkOrder.id,
          NOT: {
            status: 'Completado',
          },
        },
        data: {
          status: 'Cerrado',
        },
      });
      return { message: 'Respuesta guardada con exito' };
    });
  }

  async updateAreaResponseData(
    workOrderOtId: string,
    _userId: number,
    dto: UpdateAreaResponseDataDto,
  ) {
    const incomingAreas = Array.isArray(dto?.areas) ? dto.areas : [];

    if (incomingAreas.length === 0) {
      return {
        success: true,
        message: 'No se enviaron áreas para actualizar.',
        updatedAreas: [],
      };
    }

    const workOrder = await this.prisma.workOrder.findUnique({
      where: { ot_id: workOrderOtId },
      select: { id: true },
    });

    if (!workOrder) {
      throw new NotFoundException(
        `No se encontró la orden de trabajo con ot_id: ${workOrderOtId}`,
      );
    }

    const validEntries = incomingAreas.filter((entry) => {
      if (!entry) return false;
      const blockKey = entry.block as BlockKey;
      if (!BLOCK_DATA_FIELDS[blockKey]) return false;
      const areaId = Number(entry.areaId);
      const blockId = Number(entry.blockId);
      return Number.isFinite(areaId) && Number.isFinite(blockId) && blockId > 0;
    }) as UpdateAreaResponseEntryDto[];

    if (validEntries.length === 0) {
      return {
        success: true,
        message: 'No se encontraron áreas válidas para actualizar.',
        updatedAreas: [],
      };
    }

    const updatedAreas: Array<{
      areaId: number;
      block: BlockKey;
      blockId: number;
      data: Record<string, number>;
      sample_data?: Record<string, number>;
      formId: number | null;
      cqmId: number | null;
    }> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const area of validEntries) {
        const blockKey = area.block as BlockKey;
        const fields = BLOCK_DATA_FIELDS[blockKey];
        if (!fields) {
          continue;
        }

        const blockConfig = BLOCK_CONFIG[blockKey];
        if (!blockConfig) {
          continue;
        }

        const areaId = Number(area.areaId);
        const blockId = Number(area.blockId);

        const delegate = (tx as Record<string, any>)[blockConfig.delegate];
        if (!delegate?.findUnique || !delegate?.update) {
          continue;
        }

        const blockRecord = (await delegate.findUnique({
          where: { id: blockId },
          include: {
            areas_response: {
              select: {
                id: true,
                area_id: true,
                work_order_id: true,
                work_order_flow_id: true,
              },
            },
          },
        })) as any;

        if (!blockRecord) {
          throw new BadRequestException(
            `No se encontró el bloque ${blockKey} con id ${blockId}.`,
          );
        }

        const areaResponse = blockRecord.areas_response;
        if (!areaResponse || areaResponse.work_order_id !== workOrder.id) {
          throw new BadRequestException(
            'El bloque no pertenece a la orden de trabajo indicada.',
          );
        }

        if (areaResponse.area_id !== areaId) {
          throw new BadRequestException(
            'El bloque no coincide con el área proporcionada.',
          );
        }

        const sanitizedData: Record<string, number> = {};
        for (const field of fields) {
          if (
            area.data &&
            Object.prototype.hasOwnProperty.call(area.data, field)
          ) {
            const numeric = Number((area.data as Record<string, any>)[field]);
            if (Number.isFinite(numeric)) {
              const rounded = Math.round(numeric);
              sanitizedData[field] = Math.max(0, rounded);
            }
          }
        }

        if (Object.keys(sanitizedData).length > 0) {
          await delegate.update({
            where: { id: blockId },
            data: sanitizedData,
          });
        }

        const sampleDataResult: Record<string, number> = {};
        const payloadSample = area.sample_data ?? {};

        if (
          payloadSample.sample_quantity !== undefined &&
          payloadSample.sample_quantity !== null &&
          area.cqmId
        ) {
          const blockFormAnswerId =
            typeof blockRecord.form_answer_id === 'number'
              ? blockRecord.form_answer_id
              : null;

          if (blockFormAnswerId && blockFormAnswerId !== area.cqmId) {
            throw new BadRequestException(
              'El formulario de CQM no coincide con el bloque indicado.',
            );
          }

          const formAnswerRecord = await tx.formAnswer.findUnique({
            where: { id: area.cqmId },
            select: { id: true, work_order_flow_id: true },
          });

          if (!formAnswerRecord) {
            throw new BadRequestException('Formulario de CQM no encontrado.');
          }

          if (
            formAnswerRecord.work_order_flow_id !==
            areaResponse.work_order_flow_id
          ) {
            throw new BadRequestException(
              'El formulario de CQM no pertenece al flujo indicado.',
            );
          }

          const normalized = Number(payloadSample.sample_quantity);
          if (Number.isFinite(normalized)) {
            const rounded = Math.round(normalized);
            await tx.formAnswer.update({
              where: { id: formAnswerRecord.id },
              data: { sample_quantity: rounded },
            });
            sampleDataResult.sample_quantity = rounded;
          }
        }

        if (
          payloadSample.sample_auditory !== undefined &&
          payloadSample.sample_auditory !== null &&
          area.formId
        ) {
          const blockFormAuditoryId =
            typeof blockRecord.form_auditory_id === 'number'
              ? blockRecord.form_auditory_id
              : null;

          if (blockFormAuditoryId && blockFormAuditoryId !== area.formId) {
            throw new BadRequestException(
              'El registro de auditoría no coincide con el bloque indicado.',
            );
          }

          const formAuditoryRecord = await tx.formAuditory.findUnique({
            where: { id: area.formId },
            select: { id: true, work_order_flow_id: true },
          });

          if (!formAuditoryRecord) {
            throw new BadRequestException(
              'Registro de auditoría no encontrado.',
            );
          }

          if (
            formAuditoryRecord.work_order_flow_id !==
            areaResponse.work_order_flow_id
          ) {
            throw new BadRequestException(
              'El registro de auditoría no pertenece al flujo indicado.',
            );
          }

          const normalized = Number(payloadSample.sample_auditory);
          if (Number.isFinite(normalized)) {
            const rounded = Math.round(normalized);
            await tx.formAuditory.update({
              where: { id: formAuditoryRecord.id },
              data: { sample_auditory: rounded },
            });
            sampleDataResult.sample_auditory = rounded;
          }
        }

        const hasBadUpdate = Object.prototype.hasOwnProperty.call(
          sanitizedData,
          'bad_quantity',
        );
        const hasMaterialUpdate = Object.prototype.hasOwnProperty.call(
          sanitizedData,
          'material_quantity',
        );

        if ((hasBadUpdate || hasMaterialUpdate) && blockKey) {
          const aggregateIntoCut = AGGREGATE_INTO_CUT_AREA_IDS.has(areaId);
          const targetAreaIdForRemainder = aggregateIntoCut ? CUT_AREA_ID : areaId;
          const blockForRemainder: ResultBlockKey | null = aggregateIntoCut
            ? 'corte'
            : blockKey;

          if (!blockForRemainder) {
            continue;
          }

          // Limpia cualquier detalle previo que haya quedado con el target opuesto
          await tx.badQuantityDetail.deleteMany({
            where: {
              partial_release_id: null,
              source_work_order_flow_id: areaResponse.work_order_flow_id,
              target_area_id: aggregateIntoCut ? areaId : CUT_AREA_ID,
            },
          });

          const partialStats = await tx.partialRelease.aggregate({
            where: { work_order_flow_id: areaResponse.work_order_flow_id },
            _sum: { bad_quantity: true, material_quantity: true },
            _count: true,
          });

          const partialCount =
            typeof partialStats._count === 'number'
              ? partialStats._count
              : (partialStats._count as any)?._all ?? 0;

          const existingDetail = await tx.badQuantityDetail.findFirst({
            where: {
              partial_release_id: null,
              source_work_order_flow_id: areaResponse.work_order_flow_id,
              target_area_id: targetAreaIdForRemainder,
              block: blockForRemainder,
            },
          });

          if (partialCount === 0) {
            if (existingDetail) {
              await tx.badQuantityDetail.delete({ where: { id: existingDetail.id } });
            }
            continue;
          }

          const totalBad = hasBadUpdate
            ? Number(sanitizedData.bad_quantity ?? 0)
            : coerceToNumber(blockRecord?.bad_quantity ?? null) ?? 0;
          const totalMaterial = hasMaterialUpdate
            ? Number(sanitizedData.material_quantity ?? 0)
            : coerceToNumber(blockRecord?.material_quantity ?? null) ?? 0;

          const partialBadSum =
            coerceToNumber(partialStats._sum?.bad_quantity ?? null) ?? 0;
          const partialMaterialSum =
            coerceToNumber(partialStats._sum?.material_quantity ?? null) ?? 0;

          const remainderBad = Math.max(totalBad - partialBadSum, 0);
          const remainderMaterial = Math.max(totalMaterial - partialMaterialSum, 0);

          if (remainderBad === 0 && remainderMaterial === 0) {
            if (existingDetail) {
              await tx.badQuantityDetail.delete({ where: { id: existingDetail.id } });
            }
            continue;
          }

          if (existingDetail) {
            await tx.badQuantityDetail.update({
              where: { id: existingDetail.id },
              data: {
                block: blockForRemainder,
                bad_quantity: remainderBad,
                material_quantity: remainderMaterial,
                updated_at: new Date(),
              },
            });
          } else {
            await tx.badQuantityDetail.create({
              data: {
                work_order_id: workOrder.id,
                source_work_order_flow_id: areaResponse.work_order_flow_id,
                source_area_id: areaId,
                target_area_id: targetAreaIdForRemainder,
                block: blockForRemainder,
                bad_quantity: remainderBad,
                material_quantity: remainderMaterial,
                partial_release_id: null,
                created_by: _userId,
              },
            });
          }
        }

        if (
          Object.keys(sanitizedData).length > 0 ||
          Object.keys(sampleDataResult).length > 0
        ) {
          updatedAreas.push({
            areaId,
            block: blockKey,
            blockId,
            data: sanitizedData,
            sample_data:
              Object.keys(sampleDataResult).length > 0
                ? sampleDataResult
                : undefined,
            formId:
              typeof blockRecord.form_auditory_id === 'number'
                ? blockRecord.form_auditory_id
                : area.formId ?? null,
            cqmId:
              typeof blockRecord.form_answer_id === 'number'
                ? blockRecord.form_answer_id
                : area.cqmId ?? null,
          });
        }
      }
    });

    return {
      success: true,
      message: 'Datos de áreas actualizados correctamente.',
      updatedAreas,
    };
  }

  async updateWorkOrderAreas(
    workOrderOtId: string,
    userId: number,
    sourceAreaId: number | null = null,
    sourceWorkOrderFlowId: number | null = null,
    badQuantitySummary: BadQuantitySummaryDto[] = [],
    partialReleaseId: number | null = null,
  ) {
    const normalizedSummary = (Array.isArray(badQuantitySummary)
      ? badQuantitySummary
      : [])
      .map((entry) => {
        const areaId = Number(entry?.areaId);
        if (!Number.isFinite(areaId) || areaId <= 0) return null;

        const areaName =
          typeof entry?.areaName === 'string' ? entry.areaName.trim() : '';

        const sanitizedValues = (Array.isArray(entry?.values)
          ? entry.values
          : [])
          .map((value) => {
            const label =
              typeof value?.label === 'string' ? value.label.trim() : '';
            if (!label) return null;

            const numeric = Number(value?.value ?? 0);
            if (!Number.isFinite(numeric)) return null;

            const rounded = Math.round(numeric);
            if (rounded === 0) return null;

            return {
              label,
              value: rounded,
            };
          })
          .filter((value): value is { label: string; value: number } => value !== null);

        if (sanitizedValues.length === 0) {
          return null;
        }

        return {
          areaId,
          areaName,
          values: sanitizedValues,
        };
      })
      .filter(
        (entry): entry is {
          areaId: number;
          areaName: string;
          values: Array<{ label: string; value: number }>;
        } => entry !== null,
      );

    if (normalizedSummary.length === 0) {
      return {
        success: true,
        message: 'No se enviaron datos de resumen para actualizar.',
        details: [],
      };
    }

    const workOrder = await this.prisma.workOrder.findUnique({
      where: { ot_id: workOrderOtId },
      select: { id: true },
    });

    if (!workOrder) {
      throw new NotFoundException(
        `No se encontró la orden de trabajo con ot_id: ${workOrderOtId}.`,
      );
    }

    if (sourceAreaId === null && sourceWorkOrderFlowId === null) {
      throw new BadRequestException(
        'Debe indicar el área o flujo de origen para registrar las cantidades malas.',
      );
    }

    let resolvedFlow = null as
      | {
        id: number;
        area_id: number;
        work_order_id: number;
      }
      | null;

    if (sourceWorkOrderFlowId !== null) {
      resolvedFlow = await this.prisma.workOrderFlow.findUnique({
        where: { id: sourceWorkOrderFlowId },
        select: {
          id: true,
          area_id: true,
          work_order_id: true,
        },
      });

      if (!resolvedFlow || resolvedFlow.work_order_id !== workOrder.id) {
        throw new BadRequestException(
          'El flujo indicado no pertenece a la orden de trabajo especificada.',
        );
      }

      if (
        sourceAreaId !== null &&
        Number(resolvedFlow.area_id) !== Number(sourceAreaId)
      ) {
        throw new BadRequestException(
          'El flujo indicado no corresponde al área de origen proporcionada.',
        );
      }
    }

    if (resolvedFlow === null) {
      if (sourceAreaId === null) {
        throw new BadRequestException(
          'No fue posible resolver el flujo de origen para la orden seleccionada.',
        );
      }

      resolvedFlow = await this.prisma.workOrderFlow.findFirst({
        where: {
          work_order_id: workOrder.id,
          area_id: Number(sourceAreaId),
        },
        orderBy: { id: 'desc' },
        select: {
          id: true,
          area_id: true,
          work_order_id: true,
        },
      });

      if (!resolvedFlow) {
        throw new BadRequestException(
          'No se encontró un flujo asociado al área indicada para esta orden.',
        );
      }
    }

    if (!resolvedFlow) {
      throw new BadRequestException(
        'No fue posible resolver el flujo de origen para el resumen enviado.',
      );
    }

    const resolvedSourceAreaId = Number(
      sourceAreaId !== null ? sourceAreaId : resolvedFlow.area_id,
    );

    if (!Number.isFinite(resolvedSourceAreaId) || resolvedSourceAreaId <= 0) {
      throw new BadRequestException(
        'No fue posible determinar el área de origen para registrar el resumen.',
      );
    }

    if (partialReleaseId !== null) {
      const partialRecord = await this.prisma.partialRelease.findUnique({
        where: { id: partialReleaseId },
        select: { id: true, work_order_flow_id: true },
      });

      if (!partialRecord) {
        throw new BadRequestException(
          'El parcial indicado no existe o fue eliminado.',
        );
      }

      if (partialRecord.work_order_flow_id !== resolvedFlow.id) {
        throw new BadRequestException(
          'El parcial indicado no pertenece al flujo de origen proporcionado.',
        );
      }
    }

    const uniqueTargetAreaIds = Array.from(
      new Set(normalizedSummary.map((entry) => entry.areaId)),
    );

    if (uniqueTargetAreaIds.length === 0) {
      return {
        success: true,
        message: 'No se encontraron áreas objetivo válidas para actualizar.',
        details: [],
      };
    }

    const resolvedFlowId = resolvedFlow.id;
    const effectivePartialReleaseId = partialReleaseId ?? null;

    const transactionResult = await this.prisma.$transaction(async (tx) => {
      const areas = await tx.areasOperator.findMany({
        where: { id: { in: uniqueTargetAreaIds } },
        select: { id: true, name: true },
      });

      const areaNameMap = new Map(areas.map((area) => [area.id, area.name]));

      if (areaNameMap.size !== uniqueTargetAreaIds.length) {
        throw new BadRequestException(
          'Se detectaron áreas objetivo inválidas dentro del resumen enviado.',
        );
      }

      const partialFilter =
        effectivePartialReleaseId === null
          ? { equals: null }
          : { equals: effectivePartialReleaseId };

      const existingDetails = await tx.badQuantityDetail.findMany({
        where: {
          work_order_id: workOrder.id,
          source_work_order_flow_id: resolvedFlowId,
          source_area_id: resolvedSourceAreaId,
          partial_release_id: partialFilter,
          target_area_id: { in: uniqueTargetAreaIds },
        },
      });

      const existingByTarget = new Map(
        existingDetails.map((detail) => [detail.target_area_id, detail]),
      );

      const detailResults: Array<{
        targetAreaId: number;
        block: ResultBlockKey;
        action: 'created' | 'updated' | 'deleted';
        totals: Partial<Record<UpdatableField, number>>;
      }> = [];

      for (const entry of normalizedSummary) {
        const effectiveAreaName =
          areaNameMap.get(entry.areaId) || entry.areaName || '';

        const blockKey =
          __resolveBlockKeyByIdOrName__(entry.areaId, effectiveAreaName) ??
          'partialRelease';

        const existingDetail = existingByTarget.get(entry.areaId) ?? null;
        const existingSnapshot: DetailSnapshot | null = existingDetail
          ? {
            id: existingDetail.id,
            bad_quantity: existingDetail.bad_quantity,
            material_quantity: existingDetail.material_quantity,
            values: existingDetail.values as Prisma.JsonValue | null,
          }
          : null;

        // Totales previos del detalle existente
        const previousTotals = extractDetailTotals(existingSnapshot) ?? {};

        // Totales ENTRANTES desde el modal (se interpretan como ABSOLUTOS, no deltas)
        const incomingTotals = aggregateSummaryValues(entry as BadQuantitySummaryDto);

        // Construye los "nextTotals" como ABSOLUTOS (no sumes a lo previo)
        const nextTotals: Partial<Record<UpdatableField, number>> = { ...previousTotals };
        let totalsChanged = false;

        for (const field of Object.keys(incomingTotals) as UpdatableField[]) {
          const incoming = Number(incomingTotals[field] ?? 0);
          if (!Number.isFinite(incoming)) continue;

          // Normaliza (>= 0 y entero)
          const normalizedIncoming = Math.max(0, Math.round(incoming));
          const current = Math.round(Number(previousTotals[field] ?? 0));

          if (normalizedIncoming !== current) {
            totalsChanged = true;
            nextTotals[field] = normalizedIncoming;
          }
        }

        // Reemplaza la lista de values con lo que trae el modal (no acumular etiquetas)
        const previousValues = extractDetailValuesList(existingSnapshot);
        const mergedValues = mergeDetailValues(previousValues, entry.values, {
          accumulate: false, // <<--- antes estaba en true; ahora REEMPLAZA
        });

        const valuesChanged =
          previousValues.length !== mergedValues.length ||
          JSON.stringify(sortDetailValues(previousValues)) !==
          JSON.stringify(sortDetailValues(mergedValues));

        // ¿Queda algo positivo?
        const hasValues = mergedValues.length > 0;
        const positiveTotals = Object.values(nextTotals).some(
          (value) => (value ?? 0) > 0,
        );

        // Determina el bloque destino (ya resuelto arriba en blockKey)
        const blockChanged = existingDetail?.block !== blockKey;

        // Normaliza totales finales para persistir
        const nextBadQuantity = Math.max(0, Math.round(nextTotals.bad_quantity ?? 0));
        const nextMaterialQuantity = Math.max(
          0,
          Math.round(nextTotals.material_quantity ?? 0),
        );

        const totalsForResult: Partial<Record<UpdatableField, number>> = {};
        if (
          nextTotals.bad_quantity !== undefined ||
          (existingDetail && existingDetail.bad_quantity !== null)
        ) {
          totalsForResult.bad_quantity = nextBadQuantity;
        }
        if (
          nextTotals.material_quantity !== undefined ||
          (existingDetail && existingDetail.material_quantity !== null)
        ) {
          totalsForResult.material_quantity = nextMaterialQuantity;
        }

        // Borrado si quedó en cero y sin values
        const shouldDelete = !!existingDetail && !positiveTotals && !hasValues;

        if (shouldDelete) {
          await tx.badQuantityDetail.delete({ where: { id: existingDetail!.id } });
          existingByTarget.delete(entry.areaId);
          detailResults.push({
            targetAreaId: entry.areaId,
            block: (existingDetail!.block as ResultBlockKey) ?? blockKey,
            action: 'deleted',
            totals: { bad_quantity: 0, material_quantity: 0 },
          });
          continue;
        }

        if (existingDetail) {
          if (totalsChanged || valuesChanged || blockChanged) {
            const updateData: Prisma.BadQuantityDetailUpdateInput = {
              block: blockKey,
              bad_quantity: nextBadQuantity,
              material_quantity: nextMaterialQuantity,
              updated_at: new Date(),
            };

            if (valuesChanged) {
              updateData.values = hasValues ? mergedValues : Prisma.JsonNull;
            }

            const updated = await tx.badQuantityDetail.update({
              where: { id: existingDetail.id },
              data: updateData,
            });

            existingByTarget.set(entry.areaId, updated);
            detailResults.push({
              targetAreaId: entry.areaId,
              block: blockKey,
              action: 'updated',
              totals: totalsForResult,
            });
          }
          continue;
        }

        if (!positiveTotals && !hasValues) {
          continue;
        }

        // Crear nuevo detalle (modo reemplazo con totales absolutos)
        const created = await tx.badQuantityDetail.create({
          data: {
            work_order_id: workOrder.id,
            source_work_order_flow_id: resolvedFlowId,
            source_area_id: resolvedSourceAreaId,
            target_area_id: entry.areaId,
            block: blockKey,
            bad_quantity: nextBadQuantity,
            material_quantity: nextMaterialQuantity,
            values: hasValues ? mergedValues : undefined,
            created_by: userId,
            partial_release_id: effectivePartialReleaseId,
          },
        });

        existingByTarget.set(entry.areaId, created);
        detailResults.push({
          targetAreaId: entry.areaId,
          block: blockKey,
          action: 'created',
          totals: totalsForResult,
        });
      }

      return detailResults;
    });

    return {
      success: true,
      message: 'Resumen de malas actualizado correctamente.',
      details: transactionResult,
    };
  }


  async updateWorkOrderAreasLiberar(
    workOrderOtId: string,
    userId: number,
    sourceAreaId: number | null = null,
    sourceWorkOrderFlowId: number | null = null,
    badQuantitySummary: BadQuantitySummaryDto[] = [],
    partialReleaseId: number | null = null,
  ) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { ot_id: workOrderOtId },
      select: { id: true },
    });

    if (!workOrder) {
      throw new BadRequestException(
        `No se encontró la orden de trabajo con ot_id: ${workOrderOtId}`,
      );
    }

    if (!badQuantitySummary || badQuantitySummary.length === 0) {
      return {
        success: true,
        message: 'No se enviaron datos para actualizar',
        updatedAreas: [],
        badQuantitySummary,
      };
    }

    const workOrderId = workOrder.id;

    let resolvedSourceAreaId = sourceAreaId ?? null;
    let resolvedSourceFlowId = sourceWorkOrderFlowId ?? null;

    if (resolvedSourceFlowId) {
      const sourceFlow = await this.prisma.workOrderFlow.findUnique({
        where: { id: resolvedSourceFlowId },
        select: { id: true, area_id: true, work_order_id: true },
      });

      if (!sourceFlow || sourceFlow.work_order_id !== workOrderId) {
        throw new BadRequestException(
          'El flujo de trabajo origen no pertenece a la orden proporcionada.',
        );
      }

      if (!resolvedSourceAreaId) {
        resolvedSourceAreaId = sourceFlow.area_id;
      }
    }

    const canPersistDetails =
      resolvedSourceFlowId !== null && resolvedSourceAreaId !== null;

    const areasResponses = await this.prisma.areasResponse.findMany({
      where: { work_order_id: workOrderId },
      include: {
        prepress: true,
        impression: true,
        serigrafia: true,
        empalme: true,
        laminacion: true,
        corte: true,
        colorEdge: true,
        hotStamping: true,
        millingChip: true,
        personalizacion: true,
      },
    });

    const areaResponseByAreaId = new Map(
      areasResponses.map((item) => [item.area_id, item]),
    );

    const partialReleases = await this.prisma.partialRelease.findMany({
      where: {
        WorkOrderFlow: { work_order_id: workOrderId },
      },
      include: {
        WorkOrderFlow: { select: { area_id: true } },
      },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    });

    const partialReleaseByAreaId = new Map<number, typeof partialReleases>();
    for (const partial of partialReleases) {
      const areaId = partial.WorkOrderFlow?.area_id;
      if (!areaId) continue;
      if (!partialReleaseByAreaId.has(areaId)) {
        partialReleaseByAreaId.set(areaId, []);
      }
      partialReleaseByAreaId.get(areaId)!.push(partial);
    }

    const updatedAreas: Array<{
      areaId: number;
      block: ResultBlockKey;
      blockId: number;
      data: Record<string, number>;
    }> = [];

    const logsBuffer: Prisma.LogAreaDataUpdateCreateManyInput[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const summary of badQuantitySummary) {
        const aggregated = aggregateSummaryValues(summary);
        if (Object.keys(aggregated).length === 0) continue;

        const areaRecord = areaResponseByAreaId.get(summary.areaId); // TARGET
        const blockKey = resolveBlockKey(summary.areaName);          // TARGET BLOCK

        let handledByAreaResponse = false;
        let detailBlock: ResultBlockKey | null = blockKey ?? null;

        // ===== Buscar detalle existente (parcial o final) para actualizar/mergear =====
        let existingDetail:
          | (BadQuantityDetailSnapshot & { id: number })
          | null = null;

        if (canPersistDetails) {
          if (partialReleaseId !== null) {
            // PARCIAL: findFirst por (source_flow, target_area, partial_release, block)
            existingDetail = (await tx.badQuantityDetail.findFirst({
              where: {
                source_work_order_flow_id: resolvedSourceFlowId!,
                target_area_id: summary.areaId,
                partial_release_id: partialReleaseId,
                block: detailBlock ?? undefined,
              },
              select: { id: true, bad_quantity: true, material_quantity: true, values: true },
            })) as any;
          } else {
            // FINAL: findFirst por (source_flow, target_area, partial_release=null)
            existingDetail = (await tx.badQuantityDetail.findFirst({
              where: {
                source_work_order_flow_id: resolvedSourceFlowId!,
                target_area_id: summary.areaId,
                partial_release_id: null,
                block: detailBlock ?? undefined,
              },
              select: { id: true, bad_quantity: true, material_quantity: true, values: true },
            })) as any;
          }
        }

        const detailTotals = extractDetailTotals(existingDetail ?? null);
        const { deltas: summaryDeltas, totals: normalizedTotals } =
          computeDetailAdjustments(aggregated, detailTotals);

        const hasAnyDelta = Object.keys(summaryDeltas).length > 0;
        const previousTotals =
          detailTotals ?? ({} as Partial<Record<UpdatableField, number>>);
        const hasDetailChange = Object.entries(normalizedTotals).some(
          ([field, nextValue]) => {
            const key = field as UpdatableField;
            const prevValue = previousTotals[key] ?? 0;
            const normalizedPrev = Math.round(Number(prevValue ?? 0));
            const normalizedNext = Math.round(Number(nextValue ?? 0));
            return normalizedPrev !== normalizedNext;
          },
        );

        if (!hasAnyDelta && !hasDetailChange) {
          continue;
        }

        // --------------------------
        // ACUMULAR EN BLOQUE TARGET (impression, serigrafia, laminacion, empalme)
        // - crea el bloque si no existe
        // - incrementa bad_quantity/material_quantity
        // --------------------------
        if (areaRecord && blockKey) {
          const targetAreaId = summary.areaId;

          const allowsAccumulation =
            typeof targetAreaId === 'number' &&
            Number.isFinite(targetAreaId) &&
            targetAreaId > 0 &&
            targetAreaId < CUT_AREA_ID;

          const shouldAccumulate =
            allowsAccumulation && ACCUMULATE_BLOCKS.has(blockKey);

          if (!shouldAccumulate) {
            // No acumulamos en bloque target; pero el detalle sigue persistiendo con su block real
            handledByAreaResponse = true;
            detailBlock = blockKey;
          } else {
            // 1) Delegate/config del bloque target
            const config = BLOCK_CONFIG[blockKey];
            const delegate = (tx as any)[config.delegate];
            if (delegate?.findUnique) {
              // 2) Asegura bloque (crea si falta)
              let blockId = Number(areaRecord[blockKey]?.id ?? 0);
              if (!Number.isFinite(blockId) || blockId <= 0) {
                const created = await delegate.create({
                  data: {
                    // Ajusta los campos mínimos requeridos en tu schema:
                    areas_response_id: areaRecord.id,
                    work_order_id: workOrderId,
                    bad_quantity: 0,
                    material_quantity: 0,
                  },
                });
                blockId = Number(created.id);
              }

              // 3) Lee y aplica increments
              const existing = await delegate.findUnique({ where: { id: blockId } });
              if (existing) {
                const incomingNext = {
                  bad_quantity: (coerceToNumber(existing?.bad_quantity) ?? 0) + (summaryDeltas.bad_quantity ?? 0),
                  material_quantity: (coerceToNumber(existing?.material_quantity) ?? 0) + (summaryDeltas.material_quantity ?? 0),
                };
                const { deltas, logs, nextValues } = buildNumericChanges(
                  existing,
                  incomingNext,             // deltas del summary para ESTE TARGET
                  config.updatableFields,
                );

                const updatePayload: Record<string, any> = {};

                if (summaryDeltas.bad_quantity !== undefined) {
                  const prevBad = coerceToNumber(existing?.bad_quantity);
                  if (prevBad === null) {
                    updatePayload.bad_quantity = Number(nextValues.bad_quantity ?? 0);
                  } else if (deltas.bad_quantity) {
                    updatePayload.bad_quantity = nextValues.bad_quantity;
                  }
                }

                if (summaryDeltas.material_quantity !== undefined) {
                  const prevMat = coerceToNumber(existing?.material_quantity);
                  if (prevMat === null) {
                    updatePayload.material_quantity = Number(nextValues.material_quantity ?? 0);
                  } else if (deltas.material_quantity) {
                    updatePayload.material_quantity = nextValues.material_quantity;
                  }
                }

                if (Object.keys(updatePayload).length > 0) {
                  await delegate.update({ where: { id: blockId }, data: updatePayload });

                  updatedAreas.push({
                    areaId: targetAreaId,
                    block: blockKey,
                    blockId,
                    data: nextValues,
                  });

                  for (const entry of logs) {
                    logsBuffer.push({
                      work_order_id: workOrderId,
                      area_id: targetAreaId,
                      area_name: summary.areaName ?? blockKey,
                      block: blockKey,
                      field: entry.field,
                      old_value: stringifyValue(entry.oldValue),
                      new_value: stringifyValue(entry.newValue),
                      user_id: userId,
                    });
                  }
                }

                handledByAreaResponse = true;
                detailBlock = blockKey; // el detalle queda marcado con el bloque del target
              }
            }
          }
        }

        // --------------------------
        // FALLBACK: partialRelease (si no se acumuló en bloque target)
        // --------------------------
        if (!handledByAreaResponse) {
          const partialList = partialReleaseByAreaId.get(summary.areaId);
          if (partialList && partialList.length > 0) {
            const targetPartial = partialList[partialList.length - 1];
            const existingPartial = await tx.partialRelease.findUnique({
              where: { id: targetPartial.id },
            });

            if (existingPartial) {
              const {
                deltas: partialDeltas,
                logs: partialLogs,
                nextValues: partialNextValues,
              } = buildNumericChanges(
                existingPartial,
                summaryDeltas,
                ['bad_quantity', 'material_quantity'],
              );

              const updatePayload: Record<string, any> = {};

              if (summaryDeltas.bad_quantity !== undefined) {
                const prevBad = coerceToNumber(existingPartial?.bad_quantity);
                if (prevBad === null) {
                  updatePayload.bad_quantity = Number(partialNextValues.bad_quantity ?? 0);
                } else if (partialDeltas.bad_quantity) {
                  updatePayload.bad_quantity = { increment: partialDeltas.bad_quantity };
                }
              }

              if (summaryDeltas.material_quantity !== undefined) {
                const prevMat = coerceToNumber(existingPartial?.material_quantity);
                if (prevMat === null) {
                  updatePayload.material_quantity = Number(partialNextValues.material_quantity ?? 0);
                } else if (partialDeltas.material_quantity) {
                  updatePayload.material_quantity = { increment: partialDeltas.material_quantity };
                }
              }

              if (Object.keys(updatePayload).length > 0) {
                await tx.partialRelease.update({
                  where: { id: targetPartial.id },
                  data: updatePayload,
                });

                updatedAreas.push({
                  areaId: summary.areaId,
                  block: 'partialRelease',
                  blockId: targetPartial.id,
                  data: partialNextValues,
                });

                for (const entry of partialLogs) {
                  logsBuffer.push({
                    work_order_id: workOrderId,
                    area_id: summary.areaId,
                    area_name: summary.areaName ?? 'partialRelease',
                    block: 'partialRelease',
                    field: entry.field,
                    old_value: stringifyValue(entry.oldValue),
                    new_value: stringifyValue(entry.newValue),
                    user_id: userId,
                  });
                }
              }

              detailBlock = 'partialRelease';
            }
          } else if (!blockKey) {
            detailBlock = null;
          }
        }

        // --------------------------
        // Persistencia de BadQuantityDetail (parcial/final)
        // --------------------------
        if (
          canPersistDetails &&
          detailBlock &&
          resolvedSourceFlowId !== null &&
          resolvedSourceAreaId !== null
        ) {
          const incomingValues =
            Array.isArray(summary.values)
              ? summary.values
                .map((entry) => ({
                  label: entry?.label ?? '',
                  value: Number(entry?.value ?? 0),
                }))
                .filter((x) => x.label && Number.isFinite(x.value))
              : [];

          const previousValues = Array.isArray(existingDetail?.values)
            ? (existingDetail!.values as Array<{ label: string; value: number }>)
            : [];

          const mergedValues =
            incomingValues.length > 0
              ? mergeDetailValues(previousValues, incomingValues)
              : null;

          if (existingDetail) {
            const updateData: Prisma.BadQuantityDetailUpdateInput = {
              block: detailBlock!,
              updated_at: new Date(),
            };

            if (normalizedTotals.bad_quantity !== undefined) {
              updateData.bad_quantity = Number(normalizedTotals.bad_quantity);
            }
            if (normalizedTotals.material_quantity !== undefined) {
              updateData.material_quantity = Number(normalizedTotals.material_quantity);
            }
            if (mergedValues) {
              updateData.values = mergedValues;
            }

            await tx.badQuantityDetail.update({
              where: { id: existingDetail.id },
              data: updateData,
            });
          } else {
            await tx.badQuantityDetail.create({
              data: {
                work_order_id: workOrderId,
                source_work_order_flow_id: resolvedSourceFlowId!,
                source_area_id: resolvedSourceAreaId!,
                target_area_id: summary.areaId,
                block: detailBlock!,
                bad_quantity:
                  normalizedTotals.bad_quantity !== undefined
                    ? Number(normalizedTotals.bad_quantity)
                    : undefined,
                material_quantity:
                  normalizedTotals.material_quantity !== undefined
                    ? Number(normalizedTotals.material_quantity)
                    : undefined,
                values: incomingValues,
                created_by: userId,
                partial_release_id: partialReleaseId ?? null,
              },
            });
          }
        }
      }

      if (logsBuffer.length > 0) {
        await tx.logAreaDataUpdate.createMany({ data: logsBuffer });
      }
    });

    return {
      success: true,
      message: 'Cambios aplicados correctamente',
      updatedAreas,
      badQuantitySummary,
    };
  }




}

// --------------------------
// Helpers (sin cambios funcionales)
// --------------------------




const AREA_BLOCK_BY_ID_MAP: Record<number, ResultBlockKey> = {
  1: 'prepress',
  2: 'impression',
  3: 'serigrafia',
  4: 'empalme',
  5: 'laminacion',
  6: 'corte',
  7: 'colorEdge',
  8: 'hotStamping',
  9: 'millingChip',
  10: 'personalizacion',
};

// Normalizador de etiquetas (case/acentos)
function __normLabel__(s: string) {
  return (s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

// Resolver blockKey primero por areaId y luego por nombre
function __resolveBlockKeyByIdOrName__(
  areaId: number,
  areaName?: string | null
): ResultBlockKey | null {
  const byId = AREA_BLOCK_BY_ID_MAP[Number(areaId)];
  if (byId) return byId;
  // fallback a tu resolveBlockKey existente, por nombre normalizado
  return resolveBlockKey(areaName ?? undefined) ?? null;
}

// Agregador robusto de valores del summary (Malas/Materia...)
function __aggregateSummaryValuesSafe__(summary: BadQuantitySummaryDto) {
  const out: Partial<Record<'bad_quantity' | 'material_quantity', number>> = {};
  const list = Array.isArray(summary.values) ? summary.values : [];
  for (const v of list) {
    const label = __normLabel__(String(v?.label ?? ''));
    const val = Number(v?.value ?? 0) || 0;
    if (label === 'malas' || label === 'mala') {
      out.bad_quantity = (out.bad_quantity ?? 0) + val;
    } else if (label.includes('materia') || label.includes('fabrica')) {
      out.material_quantity = (out.material_quantity ?? 0) + val;
    }
  }
  return out;
}

function resolveBlockKey(name: string | null | undefined): ResultBlockKey | null {
  const k = (name ?? '')
    .normalize('NFD').replace(/\u0300-\u036f/g, '')
    .trim().toLowerCase().replace(/\s+/g, '');
  const map: Record<string, ResultBlockKey> = {
    preprensa: 'prepress',
    impresion: 'impression',
    serigrafia: 'serigrafia',
    empalme: 'empalme',
    laminacion: 'laminacion',
    corte: 'corte',
    coloredge: 'colorEdge',
    hotstamping: 'hotStamping',
    millingchip: 'millingChip',
    personalizacion: 'personalizacion',
  };
  return map[k] ?? null;
}

function aggregateSummaryValues(summary: BadQuantitySummaryDto) {
  const totals: Partial<Record<UpdatableField, number>> = {};

  for (const entry of summary.values ?? []) {
    const field = resolveFieldFromLabel(entry.label);
    if (!field) continue;

    const numeric = Number(entry.value ?? 0);
    if (!Number.isFinite(numeric)) continue;

    const rounded = Math.round(numeric);
    totals[field] = (totals[field] ?? 0) + rounded;
  }

  return totals;
}

function buildNumericChanges(
  existing: Record<string, any>,
  aggregated: Partial<Record<UpdatableField, number>>,
  fields: ReadonlyArray<UpdatableField>,
) {
  const deltas: Partial<Record<UpdatableField, number>> = {};
  const nextValues: Partial<Record<UpdatableField, number>> = {};
  const logs: Array<{ field: string; oldValue: unknown; newValue: number }> =
    [];

  for (const field of fields) {
    const incrementValue = aggregated[field];
    if (incrementValue === undefined) continue;
    if (!Number.isFinite(incrementValue)) continue;

    const increment = Math.round(Number(incrementValue));
    if (increment === 0) continue;

    const previousRaw = existing?.[field];
    const previousNumeric = coerceToNumber(previousRaw) ?? 0;
    const nextTotal = previousNumeric + increment;

    deltas[field] = increment;
    nextValues[field] = nextTotal;
    logs.push({ field, oldValue: previousRaw, newValue: nextTotal });
  }

  return { deltas, logs, nextValues };
}

function coerceToNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (value instanceof Prisma.Decimal) {
    const numeric = value.toNumber();
    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
}

function extractDetailTotals(
  detail: DetailSnapshot | null,
): Partial<Record<UpdatableField, number>> | null {
  if (!detail) return null;

  const totals: Partial<Record<UpdatableField, number>> = {};

  const badQuantity = coerceToNumber(detail.bad_quantity);
  if (badQuantity !== null) {
    totals.bad_quantity = badQuantity;
  }

  const materialQuantity = coerceToNumber(detail.material_quantity);
  if (materialQuantity !== null) {
    totals.material_quantity = materialQuantity;
  }

  return totals;
}

function extractDetailValuesList(
  detail: DetailSnapshot | null,
): Array<{ label: string; value: number }> {
  if (!detail) return [];
  if (!Array.isArray(detail.values)) return [];

  const out: Array<{ label: string; value: number }> = [];
  for (const raw of detail.values as Array<any>) {
    const label = typeof raw?.label === 'string' ? raw.label : '';
    if (!label) continue;
    const numeric = Number(raw?.value ?? 0);
    if (!Number.isFinite(numeric)) continue;
    const rounded = Math.round(numeric);
    if (rounded === 0) continue;
    out.push({ label, value: rounded });
  }

  return out;
}

function sortDetailValues(
  values: Array<{ label: string; value: number }>,
) {
  return [...values].sort((a, b) =>
    normalizeLabel(a.label).localeCompare(normalizeLabel(b.label)),
  );
}

function computeDetailAdjustments(
  incomingTotals: Partial<Record<UpdatableField, number>>,
  existingTotals: Partial<Record<UpdatableField, number>> | null,
) {
  const deltas: Partial<Record<UpdatableField, number>> = {};
  const totals: Partial<Record<UpdatableField, number>> = {};

  for (const field of Object.keys(incomingTotals) as UpdatableField[]) {
    const nextValue = incomingTotals[field];
    if (nextValue === undefined) continue;

    const nextTotal = Math.round(Number(nextValue ?? 0));
    const previousTotal = existingTotals?.[field] ?? 0;
    const normalizedPrevious = Math.round(Number(previousTotal ?? 0));
    const difference = nextTotal - normalizedPrevious;

    totals[field] = nextTotal;

    if (difference !== 0) {
      deltas[field] = difference;
    }
  }

  return { deltas, totals };
}

function mergeDetailValues(
  previousValues: Array<{ label: string; value: number }>,
  incomingValues: Array<{ label: string; value: number }>,
  options?: { accumulate?: boolean },
) {
  const accumulate = options?.accumulate ?? false;
  const registry = new Map<string, { label: string; value: number }>();

  for (const entry of previousValues ?? []) {
    if (!entry?.label) continue;
    const numeric = Number(entry.value ?? 0);
    if (!Number.isFinite(numeric)) continue;
    const rounded = Math.round(numeric);
    if (rounded === 0) continue;
    registry.set(normalizeLabel(entry.label), {
      label: entry.label,
      value: rounded,
    });
  }

  for (const entry of incomingValues ?? []) {
    if (!entry?.label) continue;
    const numeric = Number(entry.value ?? 0);
    if (!Number.isFinite(numeric)) continue;
    const rounded = Math.round(numeric);
    if (rounded === 0) continue;

    const key = normalizeLabel(entry.label);
    if (accumulate) {
      const previous = registry.get(key);
      const nextValue = (previous?.value ?? 0) + rounded;

      if (nextValue <= 0) {
        if (previous) {
          registry.delete(key);
        }
        continue;
      }

      registry.set(key, {
        label: previous?.label ?? entry.label,
        value: nextValue,
      });
    } else {
      registry.set(key, {
        label: entry.label,
        value: rounded,
      });
    }
  }

  return Array.from(registry.values());
}

function resolveFieldFromLabel(
  label: string | undefined,
): UpdatableField | null {
  if (!label) return null;
  const normalized = normalizeLabel(label);

  const directMap: Record<string, UpdatableField> = {
    malas: 'bad_quantity',
    'total malas': 'bad_quantity',
    'malas totales': 'bad_quantity',
    'malas total': 'bad_quantity',
    'malo de fabrica': 'material_quantity',
    'malo de fábrica': 'material_quantity',
    'malo de fabrica total': 'material_quantity',
    'malo de fábrica total': 'material_quantity',
    'material malo': 'material_quantity',
  };

  if (directMap[normalized]) {
    return directMap[normalized];
  }

  if (normalized.includes('malo') && normalized.includes('fabrica')) {
    return 'material_quantity';
  }

  if (normalized.includes('mala')) {
    return 'bad_quantity';
  }

  return null;
}

function normalizeLabel(label: string) {
  return label.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

function stringifyValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return value.toString();
  }
  // Si llegara a ser otro tipo (símbolo o función), conviértelo de forma explícita
  return JSON.stringify(value);
}
