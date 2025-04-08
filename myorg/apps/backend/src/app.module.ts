import { Module } from '@nestjs/common';
import { RolesGuard } from './auth/roles/roles.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';
import { PickingModule } from './modules/picking/picking.module';
import { AcceptWorkOrderModule } from './modules/accept-work-order/accept-work-order.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { PackingModule } from './modules/packing/packing.module';
import { LocationsModule } from './modules/locations/locations.module';
import { WorkOrderModule } from './modules/work-order/work-order.module';
import { FreeWorkOrderModule } from './modules/free-work-order/free-work-order.module';
import { ItemsModule } from './modules/items/items.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [
    AuthModule,
    DashboardModule,
    NotificationsModule,
    UsersModule,
    PickingModule,
    AcceptWorkOrderModule,
    DashboardsModule,
    PackingModule,
    LocationsModule,
    WorkOrderModule,
    FreeWorkOrderModule,
    ItemsModule,
    PermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, RolesGuard],
})
export class AppModule {}
