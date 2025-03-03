import { Injectable } from '@nestjs/common';

@Injectable()
export class PackingService {
  getDemo() {
    return { message: 'Módulo Packing funcionando correctamente' };
  }
}
