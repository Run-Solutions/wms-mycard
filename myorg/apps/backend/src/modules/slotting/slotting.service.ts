import { Injectable } from '@nestjs/common';

@Injectable()
export class SlottingService {
  getDemo() {
    return { message: 'Módulo Slotting funcionando correctamente' };
  }
}
