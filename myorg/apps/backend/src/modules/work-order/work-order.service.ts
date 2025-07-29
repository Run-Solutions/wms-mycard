/* myorg\apps\backend\src\modules\work-order\work-order.service.ts */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateWorkOrderDto,
  UpdateAreaDataDto,
} from './dto/create-work-order.dto';

@Injectable()
export class WorkOrderService {
  constructor(private prisma: PrismaService) {}

  async createWorkOrder(
    dto: CreateWorkOrderDto,
    files: {
      ot: Express.Multer.File | null;
      sku: Express.Multer.File | null;
      op: Express.Multer.File | null;
    },
    userId: number,
  ) {
    const { ot_id, mycard_id, areasOperatorIds, comments } = dto;
    const quantity = Number(dto.quantity); // Se debe asegurar de que llegue como numero
    // Asegurarse de que priority sea un booleano
    let priority = false; // Valor por defecto
    if (dto.priority === 'true') {
      priority = true;
    } else if (dto.priority === 'false') {
      priority = false;
    } else if (typeof dto.priority === 'boolean') {
      priority = dto.priority;
    }
    // Para guardar la OT en la BD
    const workOrder = await this.prisma.workOrder.create({
      data: {
        ot_id,
        mycard_id,
        quantity,
        status: 'En proceso',
        priority,
        comments,
        created_by: userId,
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
          console.log(`Guardando archivo (${type}): ${file.filename}`);
          await this.prisma.workOrderFiles.create({
            data: {
              work_order_id: workOrder.id,
              type,
              file_path: file.filename,
            },
          });
        }
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

  // Para obtener una Orden de Trabajo En Proceso por ID
  async getInProgressWorkOrdersById(id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: {
        ot_id: id,
      },
      include: {
        user: true,
        flow: {
          include: {
            user: true,
            partialReleases: {
              include: {
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

  async updateWorkOrderAreas(
    workOrderOtId: string,
    areas: UpdateAreaDataDto[],
    userId: number,
  ) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { ot_id: workOrderOtId },
      select: { id: true },
    });
    
    if (!workOrder) {
      throw new BadRequestException(`No se encontró la orden de trabajo con ot_id: ${workOrderOtId}`);
    }
    
    const workOrderId = workOrder.id;
    for (const area of areas) {
      const { block, blockId, data, sample_data, formId, cqmId } = area;

      if (!block || !blockId) {
        throw new BadRequestException(
          `Faltan datos en el área: ${JSON.stringify(area)}`,
        );
      }

      // Inicializar valores anteriores con tipos correctos
      let prevBlock: Record<string, any> | null = null;
      let prevAnswer: import('@prisma/client').FormAnswer | null = null;
      let prevAuditory: import('@prisma/client').FormAuditory | null = null;


      switch (block) {
        case 'prepress':
          prevBlock = await this.prisma.prepressResponse.findUnique({
            where: { id: blockId },
          });
          await this.prisma.prepressResponse.update({
            where: { id: blockId },
            data: { ...data },
          });
          break;

        case 'impression':
          prevBlock = await this.prisma.impressionResponse.findUnique({
            where: { id: blockId },
          });
          await this.prisma.impressionResponse.update({
            where: { id: blockId },
            data: { ...data },
          });
          break;

        case 'serigrafia':
          prevBlock = await this.prisma.serigrafiaResponse.findUnique({
            where: { id: blockId },
          });
          await this.prisma.serigrafiaResponse.update({
            where: { id: blockId },
            data: { ...data },
          });
          break;

        case 'empalme':
          prevBlock = await this.prisma.empalmeResponse.findUnique({
            where: { id: blockId },
          });
          await this.prisma.empalmeResponse.update({
            where: { id: blockId },
            data: { ...data },
          });
          break;

        case 'laminacion':
          prevBlock = await this.prisma.laminacionResponse.findUnique({
            where: { id: blockId },
          });
          await this.prisma.laminacionResponse.update({
            where: { id: blockId },
            data: { ...data },
          });
          break;

        case 'corte':
          prevBlock = await this.prisma.corteResponse.findUnique({
            where: { id: blockId },
          });
          await this.prisma.corteResponse.update({
            where: { id: blockId },
            data: { ...data },
          });
          break;

        case 'colorEdge':
          prevBlock = await this.prisma.colorEdgeResponse.findUnique({
            where: { id: blockId },
          });
          await this.prisma.colorEdgeResponse.update({
            where: { id: blockId },
            data: { ...data },
          });
          break;

        case 'millingChip':
          prevBlock = await this.prisma.millingChipResponse.findUnique({
            where: { id: blockId },
          });
          await this.prisma.millingChipResponse.update({
            where: { id: blockId },
            data: { ...data },
          });
          break;

        case 'hotStamping':
          prevBlock = await this.prisma.hotStampingResponse.findUnique({
            where: { id: blockId },
          });
          await this.prisma.hotStampingResponse.update({
            where: { id: blockId },
            data: { ...data },
          });
          break;

        case 'personalizacion':
          prevBlock = await this.prisma.personalizacionResponse.findUnique({
            where: { id: blockId },
          });
          await this.prisma.personalizacionResponse.update({
            where: { id: blockId },
            data: { ...data },
          });
          break;

        default:
          throw new BadRequestException(`Bloque no reconocido: ${block}`);
      }

      // Actualizar sample_quantity
      if (cqmId && sample_data?.sample_quantity !== undefined) {
        prevAnswer = await this.prisma.formAnswer.findUnique({
          where: { id: cqmId },
        });

        await this.prisma.formAnswer.update({
          where: { id: cqmId },
          data: { sample_quantity: sample_data.sample_quantity },
        });
      }

      // Actualizar sample_auditory
      if (formId && sample_data?.sample_auditory !== undefined) {
        prevAuditory = await this.prisma.formAuditory.findUnique({
          where: { id: formId },
        });

        await this.prisma.formAuditory.update({
          where: { id: formId },
          data: { sample_auditory: sample_data.sample_auditory },
        });
      }

      // Logs de cambios en el bloque
      if (prevBlock) {
        for (const key of Object.keys(data)) {
          const oldVal: unknown = prevBlock[key];
          const newVal: unknown = data[key];

          if (oldVal !== newVal) {
            await this.prisma.logAreaDataUpdate.create({
              data: {
                work_order_id: Number(workOrderId),
                area_id: area.areaId,
                area_name: block,
                block,
                field: key,
                old_value: stringifyValue(oldVal),
                new_value: stringifyValue(newVal),
                user_id: userId,
              },
            });
          }
        }
      }

      // Logs sample_quantity
      if (prevAnswer && sample_data?.sample_quantity !== undefined) {
        const oldVal = prevAnswer.sample_quantity;
        const newVal = sample_data.sample_quantity;

        if (oldVal !== newVal) {
          await this.prisma.logAreaDataUpdate.create({
            data: {
              work_order_id: Number(workOrderId),
              area_id: area.areaId,
              area_name: block,
              block,
              field: 'sample_quantity',
              old_value: stringifyValue(oldVal),
              new_value: stringifyValue(newVal),
              user_id: userId,
            },
          });
        }
      }

      // Logs sample_auditory
      if (prevAuditory && sample_data?.sample_auditory !== undefined) {
        const oldVal = prevAuditory.sample_auditory;
        const newVal = sample_data.sample_auditory;

        if (oldVal !== newVal) {
          await this.prisma.logAreaDataUpdate.create({
            data: {
              work_order_id: Number(workOrderId),
              area_id: area.areaId,
              area_name: block,
              block,
              field: 'sample_auditory',
              old_value: stringifyValue(oldVal),
              new_value: stringifyValue(newVal),
              user_id: userId,
            },
          });
        }
      }
    }

    return { success: true, message: 'Cambios aplicados correctamente' };
  }
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
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value.toString();
  }
  // Si llegara a ser otro tipo (símbolo o función), conviértelo de forma explícita
  return JSON.stringify(value);
}
