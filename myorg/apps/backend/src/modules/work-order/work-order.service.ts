
/* myorg\apps\backend\src\modules\work-order\work-order.service.ts */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';

@Injectable()
export class WorkOrderService {
  constructor(private prisma: PrismaService) {}

  async createWorkOrder(dto: CreateWorkOrderDto, files: Express.Multer.File[], userId: number) {
    const { ot_id, mycard_id, areasOperatorIds } = dto;
    const quantity = Number(dto.quantity); // Se debe asegurar de que llegue como numero
    
    console.log('created_by:', userId);

    // Para guardar la OT en la BD
    const workOrder = await this.prisma.workOrder.create({
        data: { ot_id, mycard_id, quantity, created_by: userId }
    });

    // Para subir los archivos
    if (files && files.length > 0) {
        try {
          await Promise.all(
            files.map(async (file) => {
              console.log(`Guardando archivo: ${file.filename}`);
              await this.prisma.workOrderFiles.create({
                data: {
                  work_order_id: workOrder.id,
                  type: "OT",
                  file_path: `uploads/${file.filename}`,
                },
              });
            })
          );
        } catch (error) {
          console.error('Error al guardar los archivos:', error);
        }
      } else {
        console.log('No se recibieron archivos para la OT.');
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

}
