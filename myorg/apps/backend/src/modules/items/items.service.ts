import { Injectable } from '@nestjs/common';

@Injectable()
export class ItemsService {
  getDemo() {
    return { message: 'Módulo Items funcionando correctamente' };
  }
}
