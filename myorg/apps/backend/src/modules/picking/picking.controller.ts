import { Controller, Get } from '@nestjs/common';
import { PickingService } from './picking.service';

@Controller('picking')
export class PickingController {
  constructor(private readonly pickingService: PickingService) {}

  @Get()
  getDemo() {
    return this.pickingService.getDemo();
  }
}
