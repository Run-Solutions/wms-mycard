import { Module } from '@nestjs/common';
import { ArrivalsController } from './arrivals.controller';
import { ArrivalsService } from './arrivals.service';

@Module({
  controllers: [ArrivalsController],
  providers: [ArrivalsService],
})
export class ArrivalsModule {}
