import { Controller, Get, Res, Patch, Req, ForbiddenException, UseGuards, Param, UnauthorizedException } from '@nestjs/common';
import { AcceptReviewsService } from './accept-reviews.service';
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

@Controller('work-order-cqm')
@UseGuards(JwtAuthGuard)
export class AcceptReviewsController {
  constructor(private readonly AcceptReviewsService: AcceptReviewsService) {}

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
    return await this.AcceptReviewsService.getPendingWorkOrders();
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

  // Para que el operador calidad acepte la orden
  @Patch(':id/accept')
  async acceptWorkOrderFlowCQM(@Param('id') id: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if(!userId) throw new UnauthorizedException();
    const updatedFormAnswer = await this.AcceptReviewsService.acceptWorkOrderFlowCQM(+id, userId);
    return { message: 'Orden aceptada correctamente', flow: updatedFormAnswer}
  }
}
