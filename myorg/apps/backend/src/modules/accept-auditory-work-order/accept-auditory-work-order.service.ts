import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AcceptAuditoryDto } from './dto/accept-workorder-response';

@Injectable()
export class AcceptAuditoryWorkOrderService {
  constructor(private prisma: PrismaService) {}

  // Para obtener los WorkOrderFLowEnviadoaAuditoria
  async getSentToAuditory() {
    const sentToAuditoryOrders = await this.prisma.workOrderFlow.findMany({
      where: {
        status: {
          in: ['Enviado a Auditoria', 'Enviado a Auditoria parcial'],
        }
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
              },
            },
          },
        },
        areaResponse: {
          include: {
            prepress: true,
            user: true,
          }
        },
      },
    });
    if(sentToAuditoryOrders.length === 0) {
      return { message: 'No hay ordenes pendientes para esta area.'}
    }
    return sentToAuditoryOrders;
  }

  // Para que el auditor acepte la orden de corte
  async acceptWorkOrderResponse(id: number, userId: number, dto: AcceptAuditoryDto) {
    const corte = await this.prisma.corteResponse.findUnique({
      where: { id },
      include: {
        formAuditory: true,
        areas_response: {
          include: {
            WorkOrderFlow: {
              include: {
                partialReleases: true,
                workOrder: true,
              },
            },
          },
        },
      },
    });
    // Si no hay corte, buscamos si el ID es el de un flujo con partial pendiente
    if (!corte) {
      const partial = await this.prisma.partialRelease.findFirst({
        where: { work_order_flow_id: id, validated: false },
      });
      if (!partial) {
        throw new Error('Corte not found y no hay partial pendiente');
      }
      const formAuditory = await this.prisma.formAuditory.upsert({
        where: { id: partial.id },
        update: {
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
        create: {
          id: partial.id,
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
      });
      await this.prisma.partialRelease.update({
        where: { id: partial.id },
        data: {
          validated: true,
          form_auditory_id: formAuditory.id,
        },
      });
      await this.prisma.workOrderFlow.update({
        where: { id: partial.work_order_flow_id },
        data: { status: 'Parcial' },
      });
      // Buscar next flow
      const currentFlow = await this.prisma.workOrderFlow.findUnique({
        where: { id: partial.work_order_flow_id },
      });
      const nextFlow = await this.prisma.workOrderFlow.findFirst({
        where: {
          work_order_id: currentFlow?.work_order_id,
          id: { gt: currentFlow?.id },
        },
        orderBy: { id: 'asc' },
      });
      if (nextFlow) {
        await this.prisma.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente parcial' },
        });
      }
      return formAuditory;
    }
    // Si hay corte, seguimos flujo normal
    const workOrderFlow = corte.areas_response?.WorkOrderFlow;
    if (!workOrderFlow) throw new Error('No hay WorkOrderFlow asociado al corte');
    const pendingPartial = workOrderFlow.partialReleases.find(p => !p.validated);
    if (pendingPartial) {
      await this.prisma.partialRelease.update({
        where: { id: pendingPartial.id },
        data: { validated: true },
      });
      await this.prisma.workOrderFlow.update({
        where: { id: pendingPartial.work_order_flow_id },
        data: { status: 'Completado' },
      });
      const formAuditory = await this.prisma.formAuditory.upsert({
        where: { id: pendingPartial.id },
        update: {
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
        create: {
          id: pendingPartial.id,
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
      });
      const nextFlow = await this.prisma.workOrderFlow.findFirst({
        where: {
          work_order_id: workOrderFlow.work_order_id,
          id: { gt: workOrderFlow.id },
        },
        orderBy: { id: 'asc' },
      });
      if (nextFlow) {
        await this.prisma.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente parcial' },
        });
      }
      return formAuditory;
    }
    // Si no hay parcial pendiente, se completa normalmente
    const formAuditory = await this.prisma.formAuditory.upsert({
      where: { id: corte.form_auditory_id },
      update: {
        reviewed_by_id: userId,
        sample_auditory: dto.sample_auditory,
      },
      create: {
        id: corte.id,
        reviewed_by_id: userId,
        sample_auditory: dto.sample_auditory,
      },
    });
    await this.prisma.workOrderFlow.update({
      where: { id: workOrderFlow.id },
      data: { status: 'Completado' },
    });
    const nextFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        work_order_id: workOrderFlow.work_order_id,
        id: { gt: workOrderFlow.id },
      },
      orderBy: { id: 'asc' },
    });
    if (nextFlow) {
      await this.prisma.workOrderFlow.update({
        where: { id: nextFlow.id },
        data: { status: 'Pendiente' },
      });
    } else {
      await this.prisma.workOrderFlow.update({
        where: { id: workOrderFlow.id },
        data: { status: 'En auditoria' },
      });
    }
    return formAuditory;
  }

  // Para que el auditor acepte la orden de color edge
  async acceptWorkOrderResponseColorEdge(id: number, userId: number, dto: AcceptAuditoryDto){
    const colorEdge = await this.prisma.colorEdgeResponse.findUnique({
      where: { id },
      include: { 
        formAuditory: true,
        areas_response: {
          include: {
            WorkOrderFlow: {
              include: {
                partialReleases: true,
                workOrder: true,
              },
            }
          },
        },
      },
    });
    if(!colorEdge){
      const partial = await this.prisma.partialRelease.findFirst({
        where: { work_order_flow_id: id, validated: false },
      });
      if(!partial) {
        throw new Error('Color Edge not found y no hay partial pendiente');
      }
      const formAuditory = await this.prisma.formAuditory.upsert({
        where: { id: partial?.id },
        update: {
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
        create: {
          id: partial?.id,
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
      });
      await this.prisma.partialRelease.update({
        where: { id: partial?.id },
        data: {
          validated: true,
          form_auditory_id: formAuditory.id,
        },
      });
      await this.prisma.workOrderFlow.update({
        where: { id: partial?.work_order_flow_id },
        data: { status: 'Parcial'},
      });
      // Buscar next flow
      const currentFlow = await this.prisma.workOrderFlow.findUnique({
        where: { id: partial?.work_order_flow_id },
      });
      const nextFlow = await this.prisma.workOrderFlow.findFirst({
        where: {
          work_order_id: currentFlow?.work_order_id,
          id: { gt: currentFlow?.id },
        },
        orderBy: { id: 'asc' },
      });
      if (nextFlow) {
        await this.prisma.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente parcial' },
        });
      }
        return formAuditory;
      }
      // Si hay colorEdge, seguimos flujo normal
      const workOrderFlow = colorEdge.areas_response?.WorkOrderFlow;
      if (!workOrderFlow) throw new Error('No hay WorkOrderFlow asociado al colorEdge');
      const pendingPartial = workOrderFlow.partialReleases.find(p => !p.validated);
      if (pendingPartial) {
        await this.prisma.partialRelease.update({
          where: { id: pendingPartial.id },
          data: { validated: true },
        });
        await this.prisma.workOrderFlow.update({
          where: { id: pendingPartial?.work_order_flow_id },
          data: { status: 'Completado' },
        });
        const formAuditory = await this.prisma.formAuditory.upsert({
          where: { id: pendingPartial?.id },
          update: {
            reviewed_by_id: userId,
            sample_auditory: dto.sample_auditory,
          },
          create: {
            id: pendingPartial?.id,
            reviewed_by_id: userId,
            sample_auditory: dto.sample_auditory,
          },
        });
        const nextFlow = await this.prisma.workOrderFlow.findFirst({
          where: {
            work_order_id: workOrderFlow?.work_order_id,
            id: { gt: workOrderFlow?.id },
          },
          orderBy: { id: 'asc' },
        });
        if (nextFlow) {
          await this.prisma.workOrderFlow.update({
            where: { id: nextFlow.id },
            data: { status: 'Pendiente parcial' },
          });
        }
        return formAuditory;
      }
    // Si no hay parcial pendiente, se completa normalmente
    const formAuditory = await this.prisma.formAuditory.upsert({
      where: { id: colorEdge.form_auditory_id },
      update: {
        reviewed_by_id: userId,
        sample_auditory: dto.sample_auditory,
      },
      create: {
        id: colorEdge.form_auditory_id,
        reviewed_by_id: userId,
        sample_auditory: dto.sample_auditory,
      },
    });
    await this.prisma.workOrderFlow.update({
      where: { id: workOrderFlow.id},
      data: { status: 'Completado' },
    });
    const nextFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        work_order_id: workOrderFlow.work_order_id,
        id: {  gt: workOrderFlow?.id },
      },
      orderBy: { id: 'asc' },
    });
    if (nextFlow) {
      await this.prisma.workOrderFlow.update({
        where: { id: nextFlow.id },
        data: { status: 'Pendiente' },
      });
    } else {
      await this.prisma.workOrderFlow.update({
        where: { id: workOrderFlow.id},
        data: { status: 'En auditoria' },
      });
    }
    return formAuditory;
  }
  
  // Para que el auditor acepte la orden de hot stamping
  async acceptWorkOrderResponseHotStamping(id: number, userId: number, dto: AcceptAuditoryDto){
    const hotStamping = await this.prisma.hotStampingResponse.findUnique({
      where: { id },
      include: { 
        formAuditory: true,
        areas_response: {
          include: {
            WorkOrderFlow: {
              include: {
                partialReleases: true,
                workOrder: true,
              },
            }
          },
        },
      },
    });
    if(!hotStamping){
      const partial = await this.prisma.partialRelease.findFirst({
        where: { work_order_flow_id: id, validated: false },
      });
      if (!partial) {
        throw new Error('Corte not found y no hay partial pendiente');
      }
      const formAuditory = await this.prisma.formAuditory.upsert({
        where: { id: partial.id },
        update: {
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
        create: {
          id: partial.id,
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
      });
      await this.prisma.partialRelease.update({
        where: { id: partial.id },
        data: {
          validated: true,
          form_auditory_id: formAuditory.id,
        },
      });
      await this.prisma.workOrderFlow.update({
        where: { id: partial.work_order_flow_id },
        data: {
          status: 'Parcial',
        },
      });
      // Buscar next flow
      const currentFlow = await this.prisma.workOrderFlow.findUnique({
        where: { id: partial.work_order_flow_id },
      });
      const nextFlow = await this.prisma.workOrderFlow.findFirst({
        where: {
          work_order_id: currentFlow?.work_order_id,
          id: {
            gt: currentFlow?.id,
          },
        },
        orderBy: { id: 'asc' },
      });
      if (nextFlow) {
        await this.prisma.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente parcial' },
        });
      }
      return formAuditory;
    }
    const workOrderFlow = hotStamping.areas_response?.WorkOrderFlow;
    if (!workOrderFlow) throw new Error('No hay WorkOrderFlow asociado al hotStamping');
    const pendingPartial = workOrderFlow.partialReleases.find(p => !p.validated);
    if (pendingPartial) {
      await this.prisma.partialRelease.update({ 
        where: { id: pendingPartial.id },
        data: { validated: true },
      });
      await this.prisma.workOrderFlow.update({
        where: { id: pendingPartial.work_order_flow_id },
        data: { status: 'Parcial' },
      });
      const formAuditory = await this.prisma.formAuditory.upsert({
        where: { id: pendingPartial.id },
        update: {
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
        create: {
          id: pendingPartial.id,
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
      });
      const nextFlow = await this.prisma.workOrderFlow.findFirst({
        where: {
          work_order_id: workOrderFlow?.work_order_id,
          id: { gt: workOrderFlow?.id, },
        },
        orderBy: { id: 'asc', },
      });
      if (nextFlow) {
        await this.prisma.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente parcial' },
        });
      }
      return formAuditory;
    }
    const formAuditory = await this.prisma.formAuditory.upsert({
      where: { id: hotStamping.form_auditory_id },
      update: {
        reviewed_by_id: userId,
        sample_auditory: dto.sample_auditory,
      },
      create: {
        id: hotStamping.id,
        reviewed_by_id: userId,
        sample_auditory: dto.sample_auditory,
      },
    });
    await this.prisma.workOrderFlow.update({
      where: { id: workOrderFlow.id },
      data: { status: 'Completado' },
    });
    const nextFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        work_order_id: workOrderFlow?.work_order_id,
        id: { gt: workOrderFlow?.id },
      },
      orderBy: { id: 'asc' },
    });
    if (nextFlow) {
      await this.prisma.workOrderFlow.update({
        where: { id: nextFlow.id },
        data: { status: 'Pendiente' },
      });
    } else {
      await this.prisma.workOrderFlow.update({
        where: { id: workOrderFlow.id },
        data: { status: 'En auditoria' },
      });
    }
    return formAuditory;
  }
  
  // Para que el auditor acepte la orden de milling chip
  async acceptWorkOrderResponseMillingChip(id: number, userId: number, dto: AcceptAuditoryDto){
    const millingChip = await this.prisma.millingChipResponse.findUnique({
      where: { id },
      include: { 
        formAuditory: true,
        areas_response: {
          include: {
            WorkOrderFlow: {
              include: {
                partialReleases: true,
                workOrder: true,
              },
            },
          },
        },
      },
    });
    if(!millingChip){
      const partial = await this.prisma.partialRelease.findFirst({
        where: { work_order_flow_id: id, validated: false },
      });
      if(!partial) {
        throw new Error('MillingChip not found y no hay partial pendiente');
      }
      const formAuditory = await this.prisma.formAuditory.upsert({
        where: { id: partial.id },
        update: {
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
        create: {
          id: partial.id,
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
      });
      await this.prisma.partialRelease.update({
        where: { id: partial.id },
        data: {
          validated: true,
          form_auditory_id: formAuditory.id,
        },
      });
      await this.prisma.workOrderFlow.update({
        where: { id: partial.work_order_flow_id },
        data: {
          status: 'Parcial',
        },
      });
      // Buscar next flow
      const currentFlow = await this.prisma.workOrderFlow.findUnique({
        where: { id: partial.work_order_flow_id },
      });
      const nextFlow = await this.prisma.workOrderFlow.findFirst({
        where: {
          work_order_id: currentFlow?.work_order_id,
          id: { gt: currentFlow?.id },
        },
        orderBy: { id: 'asc' },
      });
      if (nextFlow) {
        await this.prisma.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente parcial' },
        });
      }
      return formAuditory;
    }
    // Si hay millingChip, seguimos flujo normal
    const workOrderFlow = millingChip.areas_response?.WorkOrderFlow;
    if (!workOrderFlow) throw new Error('No hay WorkOrderFlow asociado al millingChip');
    const pendingPartial = workOrderFlow.partialReleases.find(p => !p.validated);
    if (pendingPartial) {
      await this.prisma.partialRelease.update({
        where: { id: pendingPartial.id },
        data: { validated: true },
      });
      await this.prisma.workOrderFlow.update({
        where: { id: pendingPartial.work_order_flow_id },
        data: { status: 'Completado' },
      });
      const formAuditory = await this.prisma.formAuditory.upsert({
        where: { id: pendingPartial.id },
        update: {
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
        create: {
          id: pendingPartial.id,
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
      });
      const nextFlow = await this.prisma.workOrderFlow.findFirst({
        where: {
          work_order_id: workOrderFlow?.work_order_id,
          id: { gt: workOrderFlow?.id },
        },
        orderBy: { id: 'asc' },
      });
      if (nextFlow) {
        await this.prisma.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente parcial' },
        });
      }
      return formAuditory;
    }
    const formAuditory = await this.prisma.formAuditory.upsert({
      where: { id: millingChip.form_auditory_id },
      update: {
        reviewed_by_id: userId,
        sample_auditory: dto.sample_auditory,
      },
      create: {
        id: millingChip.id,
        reviewed_by_id: userId,
        sample_auditory: dto.sample_auditory,
      },
    });
    await this.prisma.workOrderFlow.update({
      where: { id: workOrderFlow.id },
      data: { status: 'Completado' },
    });
    const nextFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        work_order_id: workOrderFlow.work_order_id,
        id: { gt: workOrderFlow.id },
      },
      orderBy: { id: 'asc' },
    });
    if (nextFlow) {
      await this.prisma.workOrderFlow.update({
        where: { id: nextFlow.id },
        data: { status: 'Pendiente' },
      });
    } else {
      await this.prisma.workOrderFlow.update({
        where: { id: workOrderFlow.id },
        data: { status: 'En auditoria' },
      });
    }
    return formAuditory;
  }
  
  // Para que el auditor acepte la orden de personalizacion
  async acceptWorkOrderResponsePersonalizacion(id: number, userId: number, dto: AcceptAuditoryDto){
    const personalizacion = await this.prisma.personalizacionResponse.findUnique({
      where: { id },
      include: { 
        formAuditory: true,
        areas_response: {
          include: {
            WorkOrderFlow: {
              include: {
                partialReleases: true,
                workOrder: true,
              },
            },
          },
        },
      },
    });
    if(!personalizacion){
      const partial = await this.prisma.partialRelease.findFirst({
        where: { work_order_flow_id: id, validated: false },
      });
      if (!partial) {
        throw new Error('Corte not found y no hay partial pendiente');
      }
      const formAuditory = await this.prisma.formAuditory.upsert({
        where: { id: partial.id },
        update: {
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
        create: {
          id: partial.id,
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
      });
      await this.prisma.partialRelease.update({
        where: { id: partial.id },
        data: {
          validated: true,
          form_auditory_id: formAuditory.id,
        },
      });
      await this.prisma.workOrderFlow.update({
        where: { id: partial.work_order_flow_id },
        data: { status: 'Parcial' },
      });
      // Buscar next flow
      const currentFlow = await this.prisma.workOrderFlow.findUnique({
        where: { id: partial.work_order_flow_id },
      });
      const nextFlow = await this.prisma.workOrderFlow.findFirst({
        where: {
          work_order_id: currentFlow?.work_order_id,
          id: { gt: currentFlow?.id },
        },
        orderBy: { id: 'asc' },
      });
      if (nextFlow) {
        await this.prisma.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente parcial' },
        });
      }
      return formAuditory;
    }
    // Si hay personalizacion, seguimos flujo normal
    const workOrderFlow = personalizacion.areas_response?.WorkOrderFlow;
    if (!workOrderFlow) throw new Error('No hay WorkOrderFlow asociado a la personalizacion');
    const pendingPartial = workOrderFlow.partialReleases.find(p => !p.validated);
    if (pendingPartial) {
      await this.prisma.partialRelease.update({
        where: { id: pendingPartial.id },
        data: { validated: true },
      });
      await this.prisma.workOrderFlow.update({
        where: { id: pendingPartial?.work_order_flow_id },
        data: { status: 'Completado' },
      });
      const formAuditory = await this.prisma.formAuditory.upsert({
        where: { id: pendingPartial.id },
        update: {
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
        create: {
          id: pendingPartial.id,
          reviewed_by_id: userId,
          sample_auditory: dto.sample_auditory,
        },
      });
      const nextFlow = await this.prisma.workOrderFlow.findFirst({
        where: {
          work_order_id: workOrderFlow?.work_order_id,
          id: { gt: workOrderFlow?.id },
        },
        orderBy: { id: 'asc' },
      });
      if (nextFlow) {
        await this.prisma.workOrderFlow.update({
          where: { id: nextFlow.id },
          data: { status: 'Pendiente parcial' },
        });
      }
      return formAuditory;
    }
    const formAuditory = await this.prisma.formAuditory.upsert({
      where: { id: personalizacion.form_auditory_id },
      update: {
        reviewed_by_id: userId,
        sample_auditory: dto.sample_auditory,
      },
      create: {
        id: personalizacion.id,
        reviewed_by_id: userId,
        sample_auditory: dto.sample_auditory,
      },
    });
    await this.prisma.workOrderFlow.update({
      where: { id: workOrderFlow.id },
      data: { status: 'Completado' },
    });
    const nextFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        work_order_id: workOrderFlow.work_order_id,
        id: { gt: workOrderFlow.id },
      },
      orderBy: { id: 'asc' },
    });
    if (nextFlow) {
      await this.prisma.workOrderFlow.update({
        where: { id: nextFlow.id },
        data: { status: 'Pendiente' },
      });
    } else {
      await this.prisma.workOrderFlow.update({
        where: { id: workOrderFlow.id },       
        data: { status: 'En auditoria' },
      });
    }
    return formAuditory;
  }
}