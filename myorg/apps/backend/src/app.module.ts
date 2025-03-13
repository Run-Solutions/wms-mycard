import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';
import { PickingModule } from './modules/picking/picking.module';
import { SlottingModule } from './modules/slotting/slotting.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { PackingModule } from './modules/packing/packing.module';
import { LocationsModule } from './modules/locations/locations.module';
import { ArrivalsModule } from './modules/arrivals/arrivals.module';
import { PutawayModule } from './modules/putaway/putaway.module';
import { ItemsModule } from './modules/items/items.module';
import { PermissionsModule } from './modules/permissions/permissions.module';

@Module({
  imports: [
    AuthModule,
    DashboardModule,
    NotificationsModule,
    UsersModule,
    PickingModule,
    SlottingModule,
    DashboardsModule,
    PackingModule,
    LocationsModule,
    ArrivalsModule,
    PutawayModule,
    ItemsModule,
    PermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
