import { Controller, Patch, Param, Req, UseGuards, UnauthorizedException, Get, ForbiddenException, Res, ParseIntPipe } from '@nestjs/common';
import { AcceptWorkOrderService } from './accept-work-order.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request, Response } from 'express';
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

@Controller('work-order-flow')
@UseGuards(JwtAuthGuard)
export class AcceptWorkOrderController {
  constructor(private readonly AcceptWorkOrderService: AcceptWorkOrderService) {}

  // Para obtener los WorkOrderFlowPendientes
  @Get('pending')
  async getPendingWorkOrders(@Req() req: AuthenticatedRequest) {
    console.log('Usuario autenticado: ', req.user);
    if (!req.user){
      console.log('Usuario no autenticado');
      throw new ForbiddenException('Usuario no autenticado.')
    }

    const { user } = req;
    console.log("📌 ID del usuario:", user.id);
    console.log("📌 Rol del usuario:", user.role_id);
    console.log("📌 Áreas asignadas:", user.areas_operator_id);
    if (user.role_id !== 2) {
      throw new ForbiddenException('No tienes permiso para acceder a las ordenes.');
    };
    return await this.AcceptWorkOrderService.getPendingWorkOrders(user.areas_operator_id);
  
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

  // Para que el operador acepte la orden
  @Patch(':id/accept')
  async acceptWorkOrderFlow(@Param('id') id: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException();
  
    const updatedFlow = await this.AcceptWorkOrderService.acceptWorkOrderFlow(+id, userId);
    return { message: 'Orden aceptada correctamente', flow: updatedFlow}
  
  }

  // Para obtener una Orden de Trabajo En Proceso por ID
  @Get(':id')
  async getWorkOrderFlowById(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    const user = req.user;
    if(!user){
      throw new ForbiddenException('Usuario no autenticado.');
    }
              
    return await this.AcceptWorkOrderService.getWorkOrderFlowById(id, user.areas_operator_id);
  }
}
