/* myorg\apps\backend\src\modules\work-order\work-order.service.ts */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';

@Injectable()
export class WorkOrderService {
  constructor(private prisma: PrismaService) {}

  async createWorkOrder(dto: CreateWorkOrderDto, files: { ot: Express.Multer.File | null; sku: Express.Multer.File | null; op: Express.Multer.File | null }, userId: number) {
    const { ot_id, mycard_id, areasOperatorIds } = dto;
    const quantity = Number(dto.quantity); // Se debe asegurar de que llegue como numero
    
    console.log('Orden de trabajo created by:', userId);

    // Para guardar la OT en la BD
    const workOrder = await this.prisma.workOrder.create({
        data: { ot_id, mycard_id, quantity, created_by: userId }
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
                        file_path: `uploads/${file.filename}`,
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

  // Para obtener los WorkOrderFlowPendientes
  async getPendingWorkOrders(areasOperatorIds: number) {
    console.log('Buscando órdenes pendientes...');
    if (!areasOperatorIds) {
        throw new Error('No se proporcionaron areas validas');
    }
    const pendingOrders = await this.prisma.workOrderFlow.findMany({
        where: {
            status: 'Pendiente',
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
                        },
                    },
                },
            },
        },
    });

    if (pendingOrders.length === 0) {
        return { message: 'No hay ordenes de trabajo pendientes para esta area.'}
    }
    console.log('Ordenes pendientes desde work-orders services', pendingOrders);
    return pendingOrders;
  }

}