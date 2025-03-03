import { Injectable } from '@nestjs/common';

@Injectable()
export class PickingService {
  getDemo() {
    return { message: 'Módulo Picking funcionando correctamente' };
  }
}
