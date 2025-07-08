// myorg/apps/backend/src/notifications/expo-push.service.ts
import { Injectable, Logger } from '@nestjs/common';
import fetch, { Response } from 'cross-fetch';

interface ExpoPushResponse {
  data?: unknown;
  errors?: any[];
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  /**
   * Envía una notificación push usando el API de Expo.
   * @param expoPushToken Token de Expo del dispositivo destino.
   * @param title Título de la notificación.
   * @param body Cuerpo de la notificación.
   * @param data Objeto de datos adicionales.
   */
  async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<ExpoPushResponse> {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const response: Response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = (await response.json()) as ExpoPushResponse;

      this.logger.debug(`Expo response: ${JSON.stringify(result)}`);

      if (result.errors && Array.isArray(result.errors)) {
        this.logger.error(`Expo push error: ${JSON.stringify(result.errors)}`);
      }

      return result;
    } catch (error) {
      this.logger.error('Error sending push notification:', error);
      throw error;
    }
  }
}