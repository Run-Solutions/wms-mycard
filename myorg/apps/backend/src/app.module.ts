import { Module } from '@nestjs/common';
import { RolesGuard } from './auth/roles/roles.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';
import { CloseAuditoryWorkOrderModule } from './modules/close-auditory-work-order/close-auditory-work-order.module';
import { AcceptWorkOrderModule } from './modules/accept-work-order/accept-work-order.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { AcceptAuditoryWorkOrderModule } from './modules/accept-auditory-work-order/accept-auditory-work-order.module';
import { FreeReviewsModule } from './modules/free-reviews/free-reviews.module';
import { WorkOrderModule } from './modules/work-order/work-order.module';
import { FreeWorkOrderModule } from './modules/free-work-order/free-work-order.module';
import { AcceptReviewsModule } from './modules/accept-reviews/accept-reviews.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [
    AuthModule,
    DashboardModule,
    NotificationsModule,
    UsersModule,
    CloseAuditoryWorkOrderModule,
    AcceptWorkOrderModule,
    DashboardsModule,
    AcceptAuditoryWorkOrderModule,
    FreeReviewsModule,
    WorkOrderModule,
    FreeWorkOrderModule,
    AcceptReviewsModule,
    PermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, RolesGuard],
})
export class AppModule {}
