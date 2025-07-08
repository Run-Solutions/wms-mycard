// myorg/apps/backend/src/notifications/device-tokens.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DeviceTokensService {
  constructor(private prisma: PrismaService) {}

  /**
   * Guarda o actualiza un token de dispositivo para un usuario.
   */
  async saveDeviceToken(userId: number, token: string) {
    // Verificar si ya existe ese token para este usuario
    const existing = await this.prisma.deviceToken.findFirst({
      where: { userId, token },
    });
    if (existing) {
      return { message: 'Token ya estaba registrado para este usuario' };
    }
    // Si no existe, crear nuevo
    const saved = await this.prisma.deviceToken.create({
      data: {
        userId,
        token,
      },
    });
    return { message: 'Token registrado correctamente', token: saved };
  }

  /**
   * Obtiene todos los tokens asociados a un usuario.
   */
  async getTokensByUser(userId: number) {
    return await this.prisma.deviceToken.findMany({
      where: { userId },
    });
  }
}