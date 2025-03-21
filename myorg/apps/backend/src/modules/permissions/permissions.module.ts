// myorg\apps\backend\src\modules\permissions\permissions.module.ts
// agrupar y registrar el controlador y el servicio en el módulo.

import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PrismaService } from 'prisma/prisma.service';
import { PermissionGuard } from 'src/auth/roles/permission.guard';
import { NotificationsModule } from '../../notifications/notifications.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [NotificationsModule, AuthModule], 
  controllers: [PermissionsController],
  providers: [PermissionsService, PrismaService, PermissionGuard],
  exports: [PermissionsService],
})
export class PermissionsModule {}