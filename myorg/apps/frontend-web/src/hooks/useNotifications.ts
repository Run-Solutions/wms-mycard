import { useEffect, useState, useContext } from 'react';
import { SocketContext } from '../context/socketContext';

export interface Notification {
  message: string;
  timestamp: number;
  type: 'success' | 'info' | 'warning' | 'error';
}

export function useNotifications(): Notification[] {
  const { socket } = useContext(SocketContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!socket) {
      console.log('[useNotifications] Socket no disponible');
      return;
    }

    const handleNotification = (notification: Notification) => {
      console.log('[useNotifications] Evento "notification" recibido:', notification);
      setNotifications((prev) => [...prev, notification]);

      // Mantén la notificación 10 segundos para verla
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.timestamp !== notification.timestamp)
        );
      }, 10000);
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  return notifications;
}
