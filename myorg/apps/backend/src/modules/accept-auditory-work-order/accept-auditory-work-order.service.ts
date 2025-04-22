import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AcceptAuditoryWorkOrderService {
  constructor(private prisma: PrismaService) {}

  // Para obtener los WorkOrderFLowEnviadoaAuditoria
  async getSentToAuditory() {
    const sentToAuditoryOrders = await this.prisma.workOrderFlow.findMany({
      where: {
        status: 'Enviado a Auditoria'
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
  async acceptWorkOrderResponse(id: number, userId: number){
    const corte = await this.prisma.corteResponse.findUnique({
      where: { id },
      include: { 
        formAuditory: true,
        areas_response: {
          include: {
            WorkOrderFlow: true,
          },
        },
      },
    });
    if(!corte){
      throw new Error('CorteResponse not found');
    }
    const formAuditory = await this.prisma.formAuditory.upsert({
      where: { id: corte.form_auditory_id },
      update: {
        reviewed_by_id: userId,
      },
      create: {
        id: corte.id,
        reviewed_by_id: userId,
      },
    });

    await this.prisma.workOrderFlow.update({
      where: { id: corte.areas_response.work_order_flow_id},
      data: {
        status: 'En auditoria'
      },
    });
    return formAuditory;
  }

  // Para que el auditor acepte la orden de color edge
  async acceptWorkOrderResponseColorEdge(id: number, userId: number){
    const colorEdge = await this.prisma.colorEdgeResponse.findUnique({
      where: { id },
      include: { 
        formAuditory: true,
        areas_response: {
          include: {
            WorkOrderFlow: true,
          },
        },
      },
    });
    if(!colorEdge){
      throw new Error('ColorEdge not found');
    }
    const formAuditory = await this.prisma.formAuditory.upsert({
      where: { id: colorEdge.form_auditory_id },
      update: {
        reviewed_by_id: userId,
      },
      create: {
        id: colorEdge.form_auditory_id,
        reviewed_by_id: userId,
      },
    });

    await this.prisma.workOrderFlow.update({
      where: { id: colorEdge.areas_response.work_order_flow_id},
      data: {
        status: 'En auditoria'
      },
    });
    return formAuditory;
  }
  
  // Para que el auditor acepte la orden de hot stamping
  async acceptWorkOrderResponseHotStamping(id: number, userId: number){
    const hotStamping = await this.prisma.hotStampingResponse.findUnique({
      where: { id },
      include: { 
        formAuditory: true,
        areas_response: {
          include: {
            WorkOrderFlow: true,
          },
        },
      },
    });
    if(!hotStamping){
      throw new Error('ColorEdge not found');
    }
    const formAuditory = await this.prisma.formAuditory.upsert({
      where: { id: hotStamping.form_auditory_id },
      update: {
        reviewed_by_id: userId,
      },
      create: {
        id: hotStamping.form_auditory_id,
        reviewed_by_id: userId,
      },
    });

    await this.prisma.workOrderFlow.update({
      where: { id: hotStamping.areas_response.work_order_flow_id},
      data: {
        status: 'En auditoria'
      },
    });
    return formAuditory;
  }
  
  // Para que el auditor acepte la orden de milling chip
  async acceptWorkOrderResponseMillingChip(id: number, userId: number){
    const millingChip = await this.prisma.millingChipResponse.findUnique({
      where: { id },
      include: { 
        formAuditory: true,
        areas_response: {
          include: {
            WorkOrderFlow: true,
          },
        },
      },
    });
    if(!millingChip){
      throw new Error('ColorEdge not found');
    }
    const formAuditory = await this.prisma.formAuditory.upsert({
      where: { id: millingChip.form_auditory_id },
      update: {
        reviewed_by_id: userId,
      },
      create: {
        id: millingChip.form_auditory_id,
        reviewed_by_id: userId,
      },
    });

    await this.prisma.workOrderFlow.update({
      where: { id: millingChip.areas_response.work_order_flow_id},
      data: {
        status: 'En auditoria'
      },
    });
    return formAuditory;
  }
  
  // Para que el auditor acepte la orden de personalizacion
  async acceptWorkOrderResponsePersonalizacion(id: number, userId: number){
    const personalizacion = await this.prisma.personalizacionResponse.findUnique({
      where: { id },
      include: { 
        formAuditory: true,
        areas_response: {
          include: {
            WorkOrderFlow: true,
          },
        },
      },
    });
    if(!personalizacion){
      throw new Error('Personalizacion not found');
    }
    const formAuditory = await this.prisma.formAuditory.upsert({
      where: { id: personalizacion.form_auditory_id },
      update: {
        reviewed_by_id: userId,
      },
      create: {
        id: personalizacion.form_auditory_id,
        reviewed_by_id: userId,
      },
    });

    await this.prisma.workOrderFlow.update({
      where: { id: personalizacion.areas_response.work_order_flow_id},
      data: {
        status: 'En auditoria'
      },
    });
    return formAuditory;
  }
}
