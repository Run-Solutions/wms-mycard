import { Injectable } from '@nestjs/common';

@Injectable()
export class ArrivalsService {
  getDemo() {
    return { message: 'Módulo Arrivals funcionando correctamente' };
  }
}
