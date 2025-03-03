import { Controller, Get } from '@nestjs/common';
import { PutawayService } from './putaway.service';

@Controller('putaway')
export class PutawayController {
  constructor(private readonly putawayService: PutawayService) {}

  @Get()
  getDemo() {
    return this.putawayService.getDemo();
  }
}
