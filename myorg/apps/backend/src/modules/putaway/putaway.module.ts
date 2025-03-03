import { Module } from '@nestjs/common';
import { PutawayController } from './putaway.controller';
import { PutawayService } from './putaway.service';

@Module({
  controllers: [PutawayController],
  providers: [PutawayService],
})
export class PutawayModule {}
