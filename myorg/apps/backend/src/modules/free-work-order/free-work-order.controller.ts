import { Controller, Param, Post, ForbiddenException, Get, Req, Res, UseGuards, Body, Query } from '@nestjs/common';
import { FreeWorkOrderService } from './free-work-order.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { join } from 'path';
import * as fs from 'fs';
import { CreateImpressResponseDto, CreateCorteResponseDto, CreateLaminacionResponseDto, CreatePrepressResponseDto, CreateEmpalmeResponseDto } from './dto/response.dto';
import { CreateFormAnswerImpressionDto } from './dto/form-answers.dto';

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
  async getInProgressWorkOrders(@Req() req: AuthenticatedRequest, @Query('statuses') statusesRaw?: string) {
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

    const statuses = statusesRaw ? statusesRaw.split(',').map(status => decodeURIComponent(status.trim())) : ['En proceso'];
    return await this.FreeWorkOrderService.getInProgressWorkOrders(user.id, statuses);
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
    
    // Para guardar respuesta de liberacion de Preprensa
    @Post('prepress')
    createPrepressResponse(@Body() dto: CreatePrepressResponseDto) {
      return this.FreeWorkOrderService.createPrepressResponse(dto);
    }
    
    // Para guardar respuesta de form cqm de impresion
    @Post('cqm-impression')
    async saveFormAnswers(@Body() dto: CreateFormAnswerImpressionDto) {
      const formAnswer = await this.FreeWorkOrderService.saveFormAnswers(dto);
      return formAnswer;
    }
    
    // Para guardar respuesta de form cqm de color edge
    @Post('cqm-color-edge')
    async saveFormAnswersColorEdge(@Body() dto: CreateFormAnswerImpressionDto) {
      const formAnswer = await this.FreeWorkOrderService.saveFormAnswers(dto);
      return formAnswer;
    }
    
    // Para guardar respuesta de form cqm de hot stamping
    @Post('cqm-hot-stamping')
    async saveFormAnswersHotStamping(@Body() dto: CreateFormAnswerImpressionDto) {
      const formAnswer = await this.FreeWorkOrderService.saveFormAnswersHotStamping(dto);
      return formAnswer;
    }
    
    // Para guardar respuesta de form cqm de hot stamping
    @Post('cqm-milling-chip')
    async saveFormAnswersMillingChip(@Body() dto: CreateFormAnswerImpressionDto) {
      const formAnswer = await this.FreeWorkOrderService.saveFormAnswersMillingChip(dto);
      return formAnswer;
    }
    
    // Para guardar respuesta de form cqm de hot stamping
    @Post('cqm-personalizacion')
    async saveFormAnswersPersonalizacion(@Body() dto: CreateFormAnswerImpressionDto) {
      const formAnswer = await this.FreeWorkOrderService.saveFormAnswersPersonalizacion(dto);
      return formAnswer;
    }
    
    // Para guardar respuesta de form cqm de laminacion
    @Post('cqm-laminacion')
    async saveFormAnswersLaminacion(@Body() dto: CreateFormAnswerImpressionDto) {
      const formAnswer = await this.FreeWorkOrderService.saveFormAnswersLaminacion(dto);
      return formAnswer;
    }

    // Para guardar respuesta de liberacion de Impresion
    @Post('impress')
    createImpressResponse(@Body() dto: CreateImpressResponseDto) {
      return this.FreeWorkOrderService.createImpressResponse(dto);
    }

    // Para guardar respuesta de form cqm de impresion
    @Post('empalme')
    async createEmpalmeResponse(@Body() dto: CreateEmpalmeResponseDto) {
      const formAnswer = await this.FreeWorkOrderService.createEmpalmeResponse(dto);
      return formAnswer;
    }
    
    // Para guardar respuesta de form cqm de impresion
    @Post('laminacion')
    async createLaminacionResponse(@Body() dto: CreateLaminacionResponseDto) {
      const formAnswer = await this.FreeWorkOrderService.createLaminacionResponse(dto);
      return formAnswer;
    }
    
    // Para guardar respuesta de form cqm de impresion
    @Post('corte')
    async createCorteResponse(@Body() dto: CreateCorteResponseDto) {
      const formAnswer = await this.FreeWorkOrderService.createCorteResponse(dto);
      return formAnswer;
    }
    
    // Para guardar respuesta de form cqm de impresion
    @Post('color-edge')
    async createColorEdgeResponse(@Body() dto: CreateCorteResponseDto) {
      const formAnswer = await this.FreeWorkOrderService.createColorEdgeResponse(dto);
      return formAnswer;
    }
    
    // Para guardar respuesta de form cqm de impresion
    @Post('hot-stamping')
    async createHotStampingResponse(@Body() dto: CreateCorteResponseDto) {
      const formAnswer = await this.FreeWorkOrderService.createHotStampingResponse(dto);
      return formAnswer;
    }
    
    // Para guardar respuesta de form cqm de impresion
    @Post('milling-chip')
    async createMillingChipResponse(@Body() dto: CreateCorteResponseDto) {
      const formAnswer = await this.FreeWorkOrderService.createMillingChipResponse(dto);
      return formAnswer;
    }
    
    // Para guardar respuesta de form cqm de impresion
    @Post('personalizacion')
    async createPersonalizacionResponse(@Body() dto: CreateCorteResponseDto) {
      const formAnswer = await this.FreeWorkOrderService.createPersonalizacionResponse(dto);
      return formAnswer;
    }
}
