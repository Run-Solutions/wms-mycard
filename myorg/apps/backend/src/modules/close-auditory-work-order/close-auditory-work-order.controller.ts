import { Controller, Get, Query, Body, Req, UseGuards, ForbiddenException, Param, Patch } from '@nestjs/common';
import { CloseAuditoryWorkOrderService } from './close-auditory-work-order.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateWorkFlowAuditoryDto } from './dto/response.dto';

interface AuthenticatedUser {
    id: number;
    role_id: number;
    areas_operator_id: number;
}
// Definir una interfaz extendida para incluir `user`
interface AuthenticatedRequest extends Request {
    user?:  AuthenticatedUser; // Ajusta según lo que tu JWT contenga
}

@Controller('free-work-order-auditory')
@UseGuards(JwtAuthGuard)
export class CloseAuditoryWorkOrderController {
  constructor(private readonly CloseAuditoryWorkOrderService: CloseAuditoryWorkOrderService) {}

  // Para obtener los WorkOrderFlowEnAuditoria
  @Get('in-auditory')
  async getInAuditoryWorkOrders(@Req() req: AuthenticatedRequest, @Query('statuses') statusesRaw?: string){
    if(!req.user){
      throw new Error('Usuario no autenticado');
      throw new ForbiddenException('Usuario no autenticado')
    }
    const { user } = req;
    if (user.role_id !== 4) {
      throw new ForbiddenException('No tienes permiso para acceder a las ordenes.');
    };
    const statuses = statusesRaw ? statusesRaw.split(',').map(status => decodeURIComponent(status.trim())) : ['En auditoria'];
    console.log('Statuses recibidos: ', statuses); 

    return await this.CloseAuditoryWorkOrderService.getInAuditoryWorkOrders(user.id, statuses);
  }
  
  // Para obtener los WorkOrder determinado EnAuditoria
  @Get(':id')
  async getInAuditoryWorkOrderById(@Param('id') id: string, @Req() req: AuthenticatedRequest){
    const user = req.user;
    if(!user){
      throw new ForbiddenException('Usuario no autenticado.');
    }
    return await this.CloseAuditoryWorkOrderService.getInAuditoryWorkOrderById(id);
  }

  // Para guardar respuesta de liberacion de auditor 
  @Patch('cerrar-auditoria')
  async updateWorkFlowAuditory(@Body() dto: UpdateWorkFlowAuditoryDto) {
    return await this.CloseAuditoryWorkOrderService.updateWorkFlowAuditory(dto);
  }
  
  
}
