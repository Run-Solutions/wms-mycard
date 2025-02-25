import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  getKPIs() {
    return this.dashboardService.getKPIs();
  }

  @Get('notifications')
  getNotifications() {
    return this.dashboardService.getNotifications();
  }
}
