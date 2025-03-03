import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardsService {
  getDemo() {
    return { message: 'Módulo Dashboards funcionando correctamente' };
  }
}
