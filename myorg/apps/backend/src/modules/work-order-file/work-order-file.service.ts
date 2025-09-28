// src/modules/work-order-file/work-order-file.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import type { Express } from 'express';
import { WorkOrderFiles } from '@prisma/client'; 

@Injectable()
export class WorkOrderFileService {
  constructor(private readonly prisma: PrismaService) {}

  async addFilesToOrder(
    orderId: number,
    type: string | null,
    files: Express.Multer.File[],
    userId?: number | null, // opcional si no quieres guardar el usuario
  ): Promise<WorkOrderFiles[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes enviar al menos un archivo.');
    }

    return this.prisma.$transaction(
      files.map((f) =>
        this.prisma.workOrderFiles.create({
          data: {
            work_order_id: orderId,
            type: type ?? 'ATTACHMENT',
            file_path: f.filename,

          },
        }),
      ),
    );
  }

  async addFileToOrder(
    orderId: number,
    type: string | null,
    file: Express.Multer.File,
    userId?: number | null,
  ): Promise<WorkOrderFiles> {
    const [row] = await this.addFilesToOrder(orderId, type, [file], userId);
    return row;
  }
}