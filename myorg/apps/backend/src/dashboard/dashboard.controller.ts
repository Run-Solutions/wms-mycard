import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { DashboardService } from './dashboard.service';
import { Request } from '@nestjs/common';

interface RequestWithUser extends Request {
  user: {
    id: number;
    role_id?: number;
    areas_operator_id?: number;
  };
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('modules')
  async getModules(@Req() req: RequestWithUser) {
    console.log('Request User: ', req.user);

    if (!req.user) {
      return { message: 'Usuario no autenticado', modules: [] };
    }

    return await this.dashboardService.getModulesByUser(req.user.id);
  }
}
