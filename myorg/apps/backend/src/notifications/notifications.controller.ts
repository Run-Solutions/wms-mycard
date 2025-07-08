import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Obtener historial de notificaciones de un usuario.
   */
  @Get(':userId')
  async getUserNotifications(@Param('userId') userId: string) {
    return this.notificationsService.getUserNotifications(Number(userId));
  }

  /**
   * Marcar una notificación como leída.
   */
  @Patch(':id/read')
  async markAsRead(@Param('id') notificationId: string) {
    return this.notificationsService.markAsRead(notificationId);
  }

  /**
   * Obtener el contador de notificaciones no leídas.
   */
  @Get(':userId/unread-count')
  async getUnreadCount(@Param('userId') userId: string) {
    return this.notificationsService.getUnreadCount(Number(userId));
  }
}