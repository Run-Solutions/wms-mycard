import { Controller, Get } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';

@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get()
  getDemo() {
    return this.dashboardsService.getDemo();
  }
}
