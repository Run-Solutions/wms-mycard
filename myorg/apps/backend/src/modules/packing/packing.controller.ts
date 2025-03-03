import { Controller, Get } from '@nestjs/common';
import { PackingService } from './packing.service';

@Controller('packing')
export class PackingController {
  constructor(private readonly packingService: PackingService) {}

  @Get()
  getDemo() {
    return this.packingService.getDemo();
  }
}
