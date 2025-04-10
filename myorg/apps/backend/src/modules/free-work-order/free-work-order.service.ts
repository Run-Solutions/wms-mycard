import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePrepressResponseDto } from './dto/response.dto';

@Injectable()
export class FreeWorkOrderService {
  constructor(private prisma: PrismaService) {}
  
  // Para obtener los WorkOrderFlowEnProceso
  async getInProgressWorkOrders(areasOperatorIds: number) {
    console.log('Buscando ordenes en Proceso...');
    if(!areasOperatorIds){
      throw new Error('No se proporcionan areas validas');
    }
    const inProgressOrders = await this.prisma.workOrderFlow.findMany({
      where: {
        status: 'En proceso',
        area_id: areasOperatorIds,
      },
      include: {
        workOrder: {
          include: {
            user: true,
            files: true,
            flow: {
              include: {
                area: true,
              }
            },
          },
        },
      },
    });
    if(inProgressOrders.length === 0) {
      return { message: 'No hay ordenes pendientes para esta area.'}
    }
    console.log('Ordenes pendientes desde work-orders services', inProgressOrders);
    return inProgressOrders;
  } 
  
  // Para obtener una Orden de Trabajo En Proceso por ID
  async getWorkOrderFlowById(id: string, areasOperatorIds: number) {
    const workOrderFlow = await this.prisma.workOrderFlow.findFirst({
      where: {
        workOrder: {
          is: {
            ot_id: id,
          }
        },
        area_id: areasOperatorIds,
      },
      include: {
        workOrder: {
          include: {
            user: true,
            files: true,
            flow: {
              include: {
                area: true,
              }
            },
          },
        },
      },
    });
    if(!workOrderFlow) {
      return { message: 'No se encontró una orden para esta área.'}
    }
    return workOrderFlow;
  } 
  
  // Para guardar respuesta de liberacion de Preprensa
  async createPrepressResponse(dto: CreatePrepressResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      // Crear AreasResponse
      const response = await tx.areasResponse.create({
        data: {
          work_order_id: dto.workOrderId,
          work_order_flow_id: dto.workOrderFlowId,
          area_id: dto.areaId,
          assigned_user: dto.assignedUser,
        },
      });

      // Crear PrepressResponse
      await tx.prepressResponse.create({
        data: {
          plates: dto.plates,
          positives: dto.positives,
          testType: dto.testType,
          comments: dto.comments,
          areas_response_id: response.id,
        },
      });
      
      // Actualizar el estado del WorkOrderFlow a Completado
      await tx.workOrderFlow.update({
        where: {
          id: dto.workOrderFlowId,
        },
        data: {
          status: 'Completado',
        },
      });
      return { message: 'Respuesta guardada con exito'};
    })
  } 
}
