import { Controller, Get, Post, Param, UseGuards, Req, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AcceptAuditoryWorkOrderService } from './accept-auditory-work-order.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

interface AuthenticatedUser {
    id: number;
    role_id: number;
    areas_operator_id: number;
}
// Definir una interfaz extendida para incluir `user`
interface AuthenticatedRequest extends Request {
    user?:  AuthenticatedUser; // Ajusta según lo que tu JWT contenga
}

@Controller('work-order-flow-auditory')
@UseGuards(JwtAuthGuard)
export class AcceptAuditoryWorkOrderController {
  constructor(private readonly AcceptAuditoryWorkOrderService: AcceptAuditoryWorkOrderService) {}

  // Para obtener los WorkOrderFLowEnviadoaAuditoria
  @Get('pending-auditory')
  async getSentToAuditory(@Req() req: AuthenticatedRequest){
    if (!req.user){
      console.log('Usuario no autenticado');
      throw new ForbiddenException('Usuario no autenticado.')
    }
    const { user } = req;
    if (user.role_id !== 4) {
      throw new ForbiddenException('No tienes permiso para acceder a las ordenes.');
    };
    return await this.AcceptAuditoryWorkOrderService.getSentToAuditory();
  }

  // Para que el auditor acepte la orden de corte
  @Post(':corteResponseId')
  async acceptWorkOrderResponse(@Param('corteResponseId') corteResponseId: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException();
    
    const updated = await this.AcceptAuditoryWorkOrderService.acceptWorkOrderResponse(+corteResponseId, userId);
    return { message: 'Orden aceptada correctamente', flow: updated}
    
  }
  
  // Para que el auditor acepte la orden de color edge
  @Post('color-edge/:colorEdgeResponseId')
  async acceptWorkOrderResponseColorEdge(@Param('colorEdgeResponseId') colorEdgeResponseId: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException();
    
    const updated = await this.AcceptAuditoryWorkOrderService.acceptWorkOrderResponseColorEdge(+colorEdgeResponseId, userId);
    return { message: 'Orden aceptada correctamente', flow: updated}
    
  }
  
  // Para que el auditor acepte la orden de hot stamping
  @Post('hot-stamping/:hotStampingResponseId')
  async acceptWorkOrderResponseHotStamping(@Param('hotStampingResponseId') hotStampingResponseId: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException();
    
    const updated = await this.AcceptAuditoryWorkOrderService.acceptWorkOrderResponseHotStamping(+hotStampingResponseId, userId);
    return { message: 'Orden aceptada correctamente', flow: updated}
    
  }
  
  // Para que el auditor acepte la orden de milling chip
  @Post('milling-chip/:millingChipResponseId')
  async acceptWorkOrderResponseMillingChip(@Param('millingChipResponseId') millingChipResponseId: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException();
    
    const updated = await this.AcceptAuditoryWorkOrderService.acceptWorkOrderResponseMillingChip(+millingChipResponseId, userId);
    return { message: 'Orden aceptada correctamente', flow: updated}
    
  }
  
  // Para que el auditor acepte la orden de personalizacion
  @Post('personalizacion/:personalizacionResponseId')
  async acceptWorkOrderResponsePersonalizacion(@Param('personalizacionResponseId') personalizacionResponseId: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException();
    
    const updated = await this.AcceptAuditoryWorkOrderService.acceptWorkOrderResponsePersonalizacion(+personalizacionResponseId, userId);
    return { message: 'Orden aceptada correctamente', flow: updated}
    
  }
}
