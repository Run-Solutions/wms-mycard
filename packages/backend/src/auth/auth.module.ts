import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesGuard } from './roles/roles.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    // Se provee el RolesGuard; también podrías configurarlo globalmente usando APP_GUARD
    RolesGuard,
  ],
})
export class AuthModule {}
