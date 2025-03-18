// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesGuard } from './roles/roles.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [NotificationsModule], // Importamos NotificationsModule para disponer de NotificationsService
  controllers: [AuthController],
  providers: [
    AuthService,
    RolesGuard,
    PrismaService,
  ],
  exports: [AuthService, PrismaService],
})
export class AuthModule {}
