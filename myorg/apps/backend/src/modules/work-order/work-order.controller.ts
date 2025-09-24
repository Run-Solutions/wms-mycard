// myorg/apps/backend/src/modules/work-order/controllers/work-order.controller.ts
import {
  Body,
  Get,
  ForbiddenException,
  Controller,
  Post,
  Param,
  UploadedFiles,
  Query,
  UseGuards,
  BadRequestException,
  UseInterceptors,
  Req,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderAreasDto,
} from './dto/create-work-order.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

interface AuthenticatedUser {
  id: number;
  role_id: number;
  areas_operator_id: number;
}
// Definir una interfaz extendida para incluir `user`
interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser; // Ajusta según lo que tu JWT contenga
}

// Configuracion para almacenamiento para Multer
const multerOptions = {
  storage: diskStorage({
    destination: './uploads', // Carpeta donde se guardan los files
    filename: (req, file, callback) => {
      // Generar un nombre único manteniendo la extension original
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const newFilename = `${file.fieldname}-${uniqueSuffix}${ext}`;
      callback(null, newFilename);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // Para poner uhn limite de 5MB por archivo
};

@Controller('work-orders')
@UseGuards(JwtAuthGuard)
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'ot', maxCount: 1 },
        { name: 'sku', maxCount: 1 },
        { name: 'op', maxCount: 1 },
        { name: 'cardImage', maxCount: 1 },
        { name: 'attachments', maxCount: 5 },
      ],
      multerOptions,
    ),
  ) // Para recibir hasta 3 archivos
  async create(
    @Req() req: AuthenticatedRequest, // Ahora reconoce `user`
    @Body() createWorkOrderDto: CreateWorkOrderDto,
    @UploadedFiles()
    files: {
      ot?: Express.Multer.File[];
      sku?: Express.Multer.File[];
      op?: Express.Multer.File[];
      cardImage?: Express.Multer.File[];
      attachments?: Express.Multer.File[];
    },
  ) {
    console.log('Request Body:', createWorkOrderDto);
    console.log('Usuario autenticado:', req.user?.id);

    const userId = req.user?.id; 
    if (!userId) {
      throw new Error('No se pudo obtener el usuario autenticado.');
    }
    // Validación mínima de obligatorios en el controller
    if (!files.ot?.[0] || !files.sku?.[0] || !files.op?.[0]) {
      throw new BadRequestException('OT, SKU y OP son obligatorios.');
    }

    // Límite total: 3 obligatorios + adjuntos
    const extras = files.attachments || [];
    const MAX_FILES = 9;
    const total = 3 + (files.cardImage?.length ? 1 : 0) + extras.length;
    if (total > MAX_FILES) {
      throw new BadRequestException(`Máximo ${MAX_FILES} archivos por orden.`);
    }

    // Paso de los archivos al servicio
    const workOrder = await this.workOrderService.createWorkOrder(
      createWorkOrderDto,
      {
        ot: files.ot ? files.ot[0] : null,
        sku: files.sku ? files.sku[0] : null,
        op: files.op ? files.op[0] : null,
        cardImage: files.cardImage?.[0] || null,
        attachments: extras,
      },
      userId,
    );

    return { message: 'Orden de trabajo creada correctamente', workOrder };
  }

  // Para obtener los WorkOrderFlowPendientes
  @Get('in-progress')
  async getInProgressWorkOrders(
    @Req() req: AuthenticatedRequest,
    @Query('statuses') statusesRaw?: string,
  ) {
    if (!req.user) {
      throw new Error('Usuario no autenticado');
      throw new ForbiddenException('Usuario no autenticado');
    }
    const { user } = req;
    console.log('📌 ID del usuario:', user.id);
    console.log('📌 Rol del usuario:', user.role_id);
    console.log('📌 Áreas asignadas:', user.areas_operator_id);
    const statuses = statusesRaw
      ? statusesRaw
          .split(',')
          .map((status) => decodeURIComponent(status.trim()))
      : ['En proceso'];
    return await this.workOrderService.getInProgressWorkOrders(
      user.id,
      statuses,
    );
  }

  // Para obtener los WorkOrderFlowPendientes
  @Get('users')
  async getUsers(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      throw new Error('Usuario no autenticado');
      throw new ForbiddenException('Usuario no autenticado');
    }
    const { user } = req;
    console.log('📌 ID del usuario:', user.id);
    console.log('📌 Rol del usuario:', user.role_id);
    console.log('📌 Áreas asignadas:', user.areas_operator_id);
    return await this.workOrderService.getUsers(user.id);
  }

  @Post(':flowId/assign')
  async assignFlowUser(
    @Param('flowId', ParseIntPipe) flowId: number,
    @Body('userId', ParseIntPipe) userId: number,
    @Body('note') note: string | undefined,
    @Req() req: AuthenticatedRequest, // donde tengas al usuario autenticado
  ) {
    if (!req.user) {
      throw new Error('Usuario no autenticado');
      throw new ForbiddenException('Usuario no autenticado');
    }
    const changedByUserId = req.user.id; // o de tu guard
    const updated = await this.workOrderService.updateFlowAssignedUser(
      flowId,
      userId,
      changedByUserId,
      note,
    );
    return updated;
  }

  // Para obtener los WorkOrder por Id
  @Get(':id')
  async getInProgressWorkOrdersById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }
    return await this.workOrderService.getInProgressWorkOrdersById(id);
  }

  @Patch('cerrar-work-order')
  async closeWorkOrderById(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateWorkOrderDto,
  ) {
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }
    return await this.workOrderService.closeWorkOrderById(dto, user.id);
  }

  @Patch(':id/areas')
  async updateWorkOrderAreas(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateWorkOrderAreasDto,
    @Param('id') id: string,
  ) {
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }
    return await this.workOrderService.updateWorkOrderAreas(
      id,
      body.areas,
      user.id,
    );
  }
}
