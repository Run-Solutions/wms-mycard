import {
  BadRequestException,
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseInterceptors,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { WorkOrderFileService } from './work-order-file.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

const multerOptions = {
  storage: diskStorage({
    destination: './uploads',
    filename: (_req: any, file: Express.Multer.File, cb: Function) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${unique}${extname(file.originalname)}`);
    },
  }),
};

@Controller('work-order-file')
@UseGuards(JwtAuthGuard) // opcional
export class WorkOrderFileController {
  constructor(private readonly service: WorkOrderFileService) {}

  @Post(':orderId')
  @UseInterceptors(FilesInterceptor('files', 20, multerOptions))
  async upload(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body('type') type: string | null,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes enviar al menos un archivo.');
    }

    // Si no quieres usar el usuario, pásalo como undefined y listo
    const userId = req.user?.id as number | undefined;

    const rows = await this.service.addFilesToOrder(orderId, type ?? null, files, userId);
    return {
      message: 'Archivos guardados',
      orderId,
      type: type ?? 'ATTACHMENT',
      count: rows.length,
      files: rows,
    };
  }
}