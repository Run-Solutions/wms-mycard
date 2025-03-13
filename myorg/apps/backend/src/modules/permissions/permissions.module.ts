// myorg\apps\backend\src\modules\permissions\permissions.module.ts
// agrupar y registrar el controlador y el servicio en el módulo.

import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { RolesGuard } from '../../auth/roles/roles.guard';
// Si ya usas NotificationsModule en otros módulos, puedes importarlo así:
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [NotificationsModule], // Importa aquí otros módulos que necesites
  controllers: [PermissionsController],
  providers: [PermissionsService, RolesGuard],
})
export class PermissionsModule {}