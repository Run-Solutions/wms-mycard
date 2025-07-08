// myorg/apps/backend/src/notifications/device-tokens.controller.ts

import { Body, Controller, Post } from '@nestjs/common';
import { DeviceTokensService } from './device-tokens.service';

@Controller('device-tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post()
  async saveDeviceToken(
    @Body() body: { userId: number; token: string }
  ) {
    const { userId, token } = body;

    if (!userId || !token) {
      throw new Error('userId y token son requeridos');
    }

    const savedToken = await this.deviceTokensService.saveDeviceToken(userId, token);
    return {
      message: 'Token registrado correctamente',
      token: savedToken,
    };
  }
}