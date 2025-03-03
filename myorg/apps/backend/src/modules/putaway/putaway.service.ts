import { Injectable } from '@nestjs/common';

@Injectable()
export class PutawayService {
  getDemo() {
    return { message: 'Módulo Putaway funcionando correctamente' };
  }
}
