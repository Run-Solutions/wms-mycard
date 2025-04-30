import { Controller, UseGuards, Patch, Req, Param, ForbiddenException } from '@nestjs/common';
import { InconformitiesService } from './inconformities.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';


interface AuthenticatedUser {
  id: number;
  role_id: number;
  areas_operator_id: number;
}
// Definir una interfaz extendida para incluir `user`
interface AuthenticatedRequest extends Request {
  user?:  AuthenticatedUser; // Ajusta según lo que tu JWT contenga
}

@Controller('inconformities')
@UseGuards(JwtAuthGuard)
export class InconformitiesController {
  constructor(private readonly InconformitiesService: InconformitiesService) {}

  @Patch(':areaResponse/prepress')
  async inconformityPrepress(@Req() req: AuthenticatedRequest, @Param('areaResponse') areaResponseId: number,) {
    console.log('LLOEGA');
    const user = req.user;
      if(!user){
        throw new ForbiddenException('Usuario no autenticado.');
      }
      return await this.InconformitiesService.inconformityPrepress(areaResponseId);
  };

  @Patch(':areaResponse/impresion')
  async inconformityImpresion(@Req() req: AuthenticatedRequest, @Param('areaResponse') areaResponseId: number,) {
    console.log('LLOEGA');
    const user = req.user;
      if(!user){
        throw new ForbiddenException('Usuario no autenticado.');
      }
      return await this.InconformitiesService.inconformityImpresion(areaResponseId);
  };

  @Patch(':areaResponse/serigrafia')
  async inconformitySerigrafia(@Req() req: AuthenticatedRequest, @Param('areaResponse') areaResponseId: number,) {
    console.log('LLOEGA');
    const user = req.user;
      if(!user){
        throw new ForbiddenException('Usuario no autenticado.');
      }
      return await this.InconformitiesService.inconformitySerigrafia(areaResponseId);
  };
  
  @Patch(':areaResponse/empalme')
  async inconformityEmpalme(@Req() req: AuthenticatedRequest, @Param('areaResponse') areaResponseId: number,) {
    console.log('LLOEGA');
    const user = req.user;
      if(!user){
        throw new ForbiddenException('Usuario no autenticado.');
      }
      return await this.InconformitiesService.inconformityEmpalme(areaResponseId);
  };
  
  @Patch(':areaResponse/laminacion')
  async inconformityLaminacion(@Req() req: AuthenticatedRequest, @Param('areaResponse') areaResponseId: number,) {
    console.log('LLOEGA');
    const user = req.user;
      if(!user){
        throw new ForbiddenException('Usuario no autenticado.');
      }
      return await this.InconformitiesService.inconformityLaminacion(areaResponseId);
  };
  
  @Patch(':areaResponse/corte')
  async inconformityCorte(@Req() req: AuthenticatedRequest, @Param('areaResponse') areaResponseId: number,) {
    console.log('LLOEGA');
    const user = req.user;
      if(!user){
        throw new ForbiddenException('Usuario no autenticado.');
      }
      return await this.InconformitiesService.inconformityCorte(areaResponseId);
  };
  
  @Patch(':areaResponse/hot-stamping')
  async inconformityHotStamping(@Req() req: AuthenticatedRequest, @Param('areaResponse') areaResponseId: number,) {
    console.log('LLOEGA');
    const user = req.user;
      if(!user){
        throw new ForbiddenException('Usuario no autenticado.');
      }
      return await this.InconformitiesService.inconformityHotStamping(areaResponseId);
  };
  
  @Patch(':areaResponse/personalizacion')
  async inconformityPersonalizacion(@Req() req: AuthenticatedRequest, @Param('areaResponse') areaResponseId: number,) {
    console.log('LLOEGA');
    const user = req.user;
      if(!user){
        throw new ForbiddenException('Usuario no autenticado.');
      }
      return await this.InconformitiesService.inconformityPersonalizacion(areaResponseId);
  };
 
  @Patch(':areaResponse/cqm')
  async inconformityCQM(@Req() req: AuthenticatedRequest, @Param('areaResponse') areaResponseId: number,) {
    console.log('LLOEGA');
    const user = req.user;
      if(!user){
        throw new ForbiddenException('Usuario no autenticado.');
      }
      return await this.InconformitiesService.inconformityCQM(areaResponseId);
  };

}
