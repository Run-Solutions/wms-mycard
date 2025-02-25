import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  getKPIs() {
    return {
      stock: 150,
      orders: 20,
      incidents: 2,
      averageProcessingTime: '1h 30m',
    };
  }

  getNotifications() {
    return [
      {
        id: 1,
        message: 'Nuevo pedido recibido',
        timestamp: new Date(),
      },
      {
        id: 2,
        message: 'Incidencia reportada en recepción',
        timestamp: new Date(),
      },
    ];
  }
}
