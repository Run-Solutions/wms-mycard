// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesGuard } from './roles/roles.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule], // Importamos NotificationsModule para disponer de NotificationsService
  controllers: [AuthController],
  providers: [AuthService, RolesGuard],
})
export class AuthModule {}
