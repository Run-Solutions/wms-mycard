import { Controller, Post, ForbiddenException, Body, Param, Get, Query, Req, UseGuards } from '@nestjs/common';
import { FreeReviewsService } from './free-reviews.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateFormExtraDto } from './dto/create-form-extra.dto';
import { CreateFormExtraEmpalDto } from './dto/create-form-extra.dto';
import { CreateFormExtraMillingDto } from './dto/create-form-extra.dto';
import { CreateFormExtraPersonalizacionDto } from './dto/create-form-extra.dto';

interface AuthenticatedUser {
    id: number;
    role_id: number;
    areas_operator_id: number;
}
// Definir una interfaz extendida para incluir `user`
interface AuthenticatedRequest extends Request {
    user?:  AuthenticatedUser; // Ajusta según lo que tu JWT contenga
}

@Controller('free-order-cqm')
@UseGuards(JwtAuthGuard)
export class FreeReviewsController {
  constructor(private readonly FreeReviewsService: FreeReviewsService) {}

  // Para obtener los WorkOrders en Calidad
  @Get('in-progress')
  async getInCQMWorkOrders(@Req() req: AuthenticatedRequest, @Query('statuses') statusesRaw?: string) {
    if(!req.user){
      throw new Error('Usuario no autenticado');
      throw new ForbiddenException('Usuario no autenticado')
    }
    const { user } = req;
    console.log("📌 ID del usuario:", user.id);
    console.log("📌 Rol del usuario:", user.role_id);
    console.log("📌 Áreas asignadas:", user.areas_operator_id);
    const statuses = statusesRaw ? statusesRaw.split(',').map(status => decodeURIComponent(status.trim())) : ['En proceso'];
    return await this.FreeReviewsService.getInCQMWorkOrders(user.id, statuses);
  }

  // Para obtener una Orden de Trabajo En Calidad por ID
  @Get(':id')
  async getWorkOrderFlowById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const user = req.user;
    if(!user){
      throw new ForbiddenException('Usuario no autenticado.');
    }     
    return await this.FreeReviewsService.getWorkOrderFlowById(id);
  }
  
  // Para adjuntar las respuestas de calidad 
  @Post('form-extra')
  async postFormExtra(@Body() dto: CreateFormExtraDto) {
    return await this.FreeReviewsService.postFormExtra(dto);
  }
  
  @Post('form-extra-impresion')
  async postFormExtraImpresion(@Body() dto: CreateFormExtraDto) {
    return await this.FreeReviewsService.postFormExtraImpresion(dto);
  }
  
  // Para adjuntar las respuestas de calidad 
  @Post('form-extra-seri')
  async postFormExtraSeri(@Body() dto: CreateFormExtraDto) {
    return await this.FreeReviewsService.postFormExtraSeri(dto);
  }
  
  // Para adjuntar las respuestas de calidad 
  @Post('form-extra-color')
  async postFormExtraColorEdge(@Body() dto: CreateFormExtraDto) {
    return await this.FreeReviewsService.postFormExtraColorEdge(dto);
  }

  // Para adjuntar las respuestas de calidad 
  @Post('form-extra-empal')
  async postFormExtraEmpal(@Body() dto: CreateFormExtraEmpalDto) {
    return await this.FreeReviewsService.postFormExtraEmpal(dto);
  }
  
  // Para adjuntar las respuestas de calidad 
  @Post('form-extra-milling')
  async postFormExtraMilling(@Body() dto: CreateFormExtraMillingDto) {
    return await this.FreeReviewsService.postFormExtraMilling(dto);
  }

  // Para adjuntar las respuestas de calidad 
  @Post('form-extra-personalizacion')
  async postFormExtraPersonalizacion(@Body() dto: CreateFormExtraPersonalizacionDto) {
    return await this.FreeReviewsService.postFormExtraPersonalizacion(dto);
  }
}
