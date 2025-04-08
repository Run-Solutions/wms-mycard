import { Controller, Param, ForbiddenException, Get, Req, Res, UseGuards } from '@nestjs/common';
import { FreeWorkOrderService } from './free-work-order.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { join } from 'path';
import * as fs from 'fs';

interface AuthenticatedUser {
    id: number;
    role_id: number;
    areas_operator_id: number;
}
// Definir una interfaz extendida para incluir `user`
interface AuthenticatedRequest extends Request {
    user?:  AuthenticatedUser; // Ajusta según lo que tu JWT contenga
}

@Controller('free-order-flow')
@UseGuards(JwtAuthGuard)
export class FreeWorkOrderController {
  constructor(private readonly FreeWorkOrderService: FreeWorkOrderService) {}

  // Para obtener los WorkOrderFlowEnProceso
  @Get('in-progress')
  async getInProgressWorkOrders(@Req() req: AuthenticatedRequest) {
    console.log('Usuario autenticado: ', req.user);
    if(!req.user){
      throw new Error('Usuario no autenticado');
      throw new ForbiddenException('Usuario no autenticado')
    }

    const { user } = req;
    console.log("📌 ID del usuario:", user.id);
    console.log("📌 Rol del usuario:", user.role_id);
    console.log("📌 Áreas asignadas:", user.areas_operator_id);
    if (user.role_id !== 2) {
      throw new ForbiddenException('No tienes permiso para acceder a las ordenes.');
    };
    return await this.FreeWorkOrderService.getInProgressWorkOrders(user.areas_operator_id);
  }

  // Para obtener los WorkOrderFiles
    @Get('file/:filename')
    serveWorkOrderFile(@Param('filename') filename: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
      console.log("🔐 Usuario:", req.user);
      const filePath = join(process.cwd(), 'uploads', filename);
            
      if (!fs.existsSync(filePath)) {
        throw new ForbiddenException('❌ Archivo no encontrado.')
      }
      res.sendFile(filePath);
    }
  
    // Para obtener una Orden de Trabajo En Proceso por ID
    @Get(':id')
    async getWorkOrderFlowById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
      const user = req.user;
      if(!user){
        throw new ForbiddenException('Usuario no autenticado.');
      }
            
      return await this.FreeWorkOrderService.getWorkOrderFlowById(id, user.areas_operator_id);
    }
}
