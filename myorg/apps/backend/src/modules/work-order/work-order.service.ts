/* myorg\apps\backend\src\modules\work-order\work-order.service.ts */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';

@Injectable()
export class WorkOrderService {
  constructor(private prisma: PrismaService) {}

  async createWorkOrder(dto: CreateWorkOrderDto, files: { ot: Express.Multer.File | null; sku: Express.Multer.File | null; op: Express.Multer.File | null }, userId: number) {
    const { ot_id, mycard_id, areasOperatorIds, comments, } = dto;
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
          created_by: userId 
        }
    });

    // Subir los archivos
    const fileMappings = [
        { key: 'ot', file: files.ot, type: 'OT' },
        { key: 'sku', file: files.sku, type: 'SKU' },
        { key: 'op', file: files.op, type: 'OP' }
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
        areasArray = Array.isArray(areasOperatorIds) ? areasOperatorIds.map(Number) : [];
    }
    console.log('Tipo de areasOperatorIds:', typeof areasArray);
    console.log('Contenido de areasOperatorIds:', areasArray);

    try {
      for (let i = 0; i < areasArray.length; i++) {
        const areaId = areasArray[i];
        const status = i === 0 ? 'Pendiente' : 'En espera';
        console.log(`Creando WorkOrderFlow para area_id: ${areaId}, status: ${status}`);
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
  async getInProgressWorkOrders(userId: number, statuses: string[]){
    console.log('Buscando ordenes');
    if(!userId){
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
            }
        },
        files: true,
        formAnswers: true,
      },
    });
    if(inProgressWorkOrders.length === 0) {
      return { message: 'No hay ordenes pendientes para esta area.'}
    }
    console.log('Ordenes pendientes desde work-orders services', inProgressWorkOrders);
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
            area: {
              include: {
                formQuestions: true
              }
            },
            areaResponse: {
              include: {
                prepress: true,
                inconformities: {
                  include: {
                    user: true,
                  }
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
                    formAuditory: true,
                  },
                },
                colorEdge: {
                  include: {
                    form_answer: true,
                    formAuditory: true,
                  },
                },
                hotStamping: {
                  include: {
                    form_answer: true,
                    formAuditory: true,
                  },
                }, 
                millingChip: {
                  include: {
                    form_answer: true,
                    formAuditory: true,
                  },
                },
                personalizacion: {
                  include: {
                    form_answer: true,
                    formAuditory: true,
                  },
                },
              }
            },
            answers: {
              include:{
                FormAnswerResponse: true,
                inconformities: {
                  include: {
                    user: true,
                  }
                },
              }
            },
          },
        }
      },
    });
    if(!workOrder) {
      return { message: 'No se encontró una orden para esta área.'}
    }
    return workOrder;
  }

  async getInAuditoryWorkOrderById(id: string){
      const workOrderFlow = await this.prisma.workOrderFlow.findFirst({
        where: {
          workOrder:
          {
            is: {
              ot_id: id,
            }
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
                        }
                      }
                    },
                  },
                },
              },
              areasResponses: {
                include: {
                  corte: true,
                }
              },
              formAnswers: {
                include: {
                  corteResponse: true,
                  colorEdgeResponse: true,
                  hotStampingResponse: true,
                  millingChipResponse: true, 
                  personalizacionResponse: true,
                }
              }
            },
          },
          answers: {
            include: {
              corteResponse: true
            }
          }
        },
      });
      if(!workOrderFlow) {
        return { message: 'No se encontró una orden para esta área.'}
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
        return { message: 'Respuesta guardada con exito'};
      });
    }
}