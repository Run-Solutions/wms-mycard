import { Controller, Get } from '@nestjs/common';
import { SlottingService } from './slotting.service';

@Controller('slotting')
export class SlottingController {
  constructor(private readonly slottingService: SlottingService) {}

  @Get()
  getDemo() {
    return this.slottingService.getDemo();
  }
}
