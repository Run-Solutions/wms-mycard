// myorg/apps/backend/src/modules/work-order/controllers/work-order.controller.ts
import { Body, Get, ForbiddenException, Controller, Post, Param, UploadedFiles, Query, UseGuards, UseInterceptors, Req, Patch } from "@nestjs/common";
import { WorkOrderService } from "./work-order.service";
import { CreateWorkOrderDto } from "./dto/create-work-order.dto";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Request } from 'express';
import { diskStorage } from "multer";
import { extname } from "path";

interface AuthenticatedUser {
    id: number;
    role_id: number;
    areas_operator_id: number;
}
// Definir una interfaz extendida para incluir `user`
interface AuthenticatedRequest extends Request {
    user?:  AuthenticatedUser; // Ajusta según lo que tu JWT contenga
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
            callback(null, newFilename)
        }
    }),
    limits: { fileSize: 20 * 1024 * 1024 }, // Para poner uhn limite de 5MB por archivo
};

@Controller('work-orders')
@UseGuards(JwtAuthGuard)
export class WorkOrderController {
    constructor(private readonly workOrderService: WorkOrderService) {}

    @Post()
    @UseInterceptors(FileFieldsInterceptor([ { name: 'ot', maxCount: 1 }, { name: 'sku', maxCount: 1 }, { name: 'op', maxCount: 1 }, ], multerOptions)) // Para recibir hasta 3 archivos
    async create(
        @Req() req: AuthenticatedRequest,  // Ahora reconoce `user`
        @Body() createWorkOrderDto: CreateWorkOrderDto, 
        @UploadedFiles() files: { ot?: Express.Multer.File[]; sku?: Express.Multer.File[]; op?: Express.Multer.File[] }
    ) {
        console.log('Request Body:', createWorkOrderDto);
        console.log('Usuario autenticado:', req.user?.id);

        const userId = req.user?.id; // Obtener el ID del usuario autenticado
        if (!userId) {
            throw new Error('No se pudo obtener el usuario autenticado.');
        }

        // Paso de los archivos al servicio
        const workOrder = await this.workOrderService.createWorkOrder(
            createWorkOrderDto, 
            {
                ot: files.ot ? files.ot[0] : null,
                sku: files.sku ? files.sku[0] : null,
                op: files.op ? files.op[0] : null,
            }, 
            userId
        );

        return { message: 'Orden de trabajo creada correctamente', workOrder };
    }

    // Para obtener los WorkOrderFlowPendientes
    @Get('in-progress')
    async getInProgressWorkOrders(@Req() req: AuthenticatedRequest, @Query('statuses') statusesRaw?: string) {
        if(!req.user){
            throw new Error('Usuario no autenticado');
            throw new ForbiddenException('Usuario no autenticado')
          }
          const { user } = req;
          console.log("📌 ID del usuario:", user.id);
          console.log("📌 Rol del usuario:", user.role_id);
          console.log("📌 Áreas asignadas:", user.areas_operator_id);
          const statuses = statusesRaw ? statusesRaw.split(',').map(status => decodeURIComponent(status.trim())) : ['En proceso'];
        return await this.workOrderService.getInProgressWorkOrders(user.id, statuses);
    }
    
    // Para obtener los WorkOrder por Id
    @Get(':id')
    async getInProgressWorkOrdersById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
        const user = req.user;
        if(!user){
            throw new ForbiddenException('Usuario no autenticado.');
        }
        return await this.workOrderService.getInProgressWorkOrdersById(id);
    }
    
    @Patch('cerrar-work-order')
    async closeWorkOrderById(@Req() req: AuthenticatedRequest, @Body() dto: CreateWorkOrderDto) {
        const user = req.user;
        if(!user){
            throw new ForbiddenException('Usuario no autenticado.');
        }
        return await this.workOrderService.closeWorkOrderById(dto, user.id);
    }
}