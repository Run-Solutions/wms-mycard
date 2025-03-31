import { Body, Controller, Post, UploadedFiles, UseGuards, UseInterceptors, Req } from "@nestjs/common";
import { WorkOrderService } from "./work-order.service";
import { FilesInterceptor } from "@nestjs/platform-express";
import { CreateWorkOrderDto } from "./dto/create-work-order.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Request } from 'express';

// Definir una interfaz extendida para incluir `user`
interface AuthenticatedRequest extends Request {
    user?: { id: number }; // Ajusta según lo que tu JWT contenga
}

@Controller('work-orders')
export class WorkOrderController {
    constructor(private readonly workOrderService: WorkOrderService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @UseInterceptors(FilesInterceptor('files', 3)) // Para recibir hasta 3 archivos
    async create(
        @Req() req: AuthenticatedRequest,  // Ahora reconoce `user`
        @Body() createWorkOrderDto: CreateWorkOrderDto, 
        @UploadedFiles() files: Express.Multer.File[]
    ) {
        console.log('Request Body:', createWorkOrderDto);
        console.log('Usuario autenticado:', req.user?.id);

        const userId = req.user?.id; // Obtener el ID del usuario autenticado

        if (!userId) {
            throw new Error('No se pudo obtener el usuario autenticado.');
        }
        
        // Pasar userId al servicio en lugar de usar createWorkOrderDto.created_by
        const workOrder = await this.workOrderService.createWorkOrder(createWorkOrderDto, files, userId);

        return { message: 'Orden de trabajo creada correctamente', workOrder };
    }
}