import { Injectable } from '@nestjs/common';

@Injectable()
export class LocationsService {
  getDemo() {
    return { message: 'Módulo Locations funcionando correctamente' };
  }
}
