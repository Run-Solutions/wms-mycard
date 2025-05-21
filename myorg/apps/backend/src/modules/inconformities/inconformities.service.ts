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
          status: 'En proceso'
        }
      })
      return { message: 'Respuesta guardada con exito'};
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
      if (!areaResponse || areaResponse && flowParcial) {
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
              status: 'Listo'
            }
          });
        }
        return { message: 'Respuesta guardada con exito'};
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
          status: 'Listo'
        }
      })
      return { message: 'Respuesta guardada con exito'};
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
      if (!areaResponse || areaResponse && flowParcial) {
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
              status: 'Listo'
            }
          });
        }
        return { message: 'Respuesta guardada con exito'};
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
          status: 'Listo'
        }
      })
      return { message: 'Respuesta guardada con exito'};
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
      if (!areaResponse || areaResponse && flowParcial) {
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
              status: 'Listo'
            }
          });
        }
        return { message: 'Respuesta guardada con exito'};
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
          status: 'Listo'
        }
      })
      return { message: 'Respuesta guardada con exito'};
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
      if (!areaResponse || areaResponse && flowParcial) {
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
              status: 'Listo'
            }
          });
        }
        return { message: 'Respuesta guardada con exito'};
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
          status: 'Listo'
        }
      })
      return { message: 'Respuesta guardada con exito'};
    });
  }
  
  async inconformityCorte(areaResponseId: number) {
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
      if (!areaResponse || areaResponse && flowParcial) {
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
              status: 'Listo'
            }
          });
        }
        return { message: 'Respuesta guardada con exito'};
      }
      const corteResponse = await tx.corteResponse.findUnique({
        where: {
          areas_response_id: areaResponse.id,
        },
      });
      if (corteResponse) {
        // Si existe un form_auditory_id, eliminar el FormAuditory
        if (corteResponse.form_auditory_id) {
          await tx.formAuditory.deleteMany({
            where: {
              id: corteResponse.form_auditory_id,
            },
          });
        }
      // Eliminar el registro empalme asociado a ese AreasResponse
      await tx.corteResponse.deleteMany({
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
          status: 'Listo'
        }
      })
      return { message: 'Respuesta guardada con exito'};
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
      if (!areaResponse || areaResponse && flowParcial) {
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
              status: 'Listo'
            }
          });
        }
        return { message: 'Respuesta guardada con exito'};
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
          status: 'Listo'
        }
      })
      return { message: 'Respuesta guardada con exito'};
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
      if (!areaResponse || areaResponse && flowParcial) {
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
              status: 'Listo'
            }
          });
        }
        return { message: 'Respuesta guardada con exito'};
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
          status: 'Listo'
        }
      })
      return { message: 'Respuesta guardada con exito'};
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
      if (!areaResponse || areaResponse && flowParcial) {
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
              status: 'Listo'
            }
          });
        }
        return { message: 'Respuesta guardada con exito'};
      }
      const personalizacionResponse = await tx.personalizacionResponse.findUnique({
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
          status: 'Listo'
        }
      })
      return { message: 'Respuesta guardada con exito'};
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
      return { message: 'Respuesta guardada con exito'};
    });
  }

}
