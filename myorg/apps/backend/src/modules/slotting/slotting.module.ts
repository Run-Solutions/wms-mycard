import { Module } from '@nestjs/common';
import { SlottingController } from './slotting.controller';
import { SlottingService } from './slotting.service';

@Module({
  controllers: [SlottingController],
  providers: [SlottingService],
})
export class SlottingModule {}
