'use client';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const NotificationItem = styled.div<{ type: string }>`
  padding: 10px 20px;
  border-radius: 4px;
  background-color: ${({ type }) => {
    switch (type) {
      case 'error':
        return 'rgba(255, 0, 0, 0.8)';
      case 'warning':
        return 'rgba(255, 165, 0, 0.8)';
      case 'success':
        return 'rgba(0, 128, 0, 0.8)';
      default:
        return 'rgba(0, 0, 255, 0.8)';
    }
  }};
  color: #fff;
`;

interface NotificationType {
  message: string;
  type: string;
  timestamp: number;
}

const Notification: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Este efecto se asegura de que el componente se renderice solo en cliente.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ejemplo: se simula agregar una notificación de éxito a los 2 segundos.
  useEffect(() => {
    const timer = setTimeout(() => {
      const newNotif: NotificationType = {
        message: 'Operación exitosa',
        type: 'success',
        timestamp: new Date().getTime(),
      };
      setNotifications(prev => [...prev, newNotif]);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Cada segundo se remueven las notificaciones que tengan más de 5 segundos.
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev =>
        prev.filter(notif => new Date().getTime() - notif.timestamp < 5000)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isMounted) return null;

  return ReactDOM.createPortal(
    <NotificationContainer>
      {notifications.map((notif, index) => (
        <NotificationItem key={index} type={notif.type}>
          {notif.message}
        </NotificationItem>
      ))}
    </NotificationContainer>,
    document.body
  );
};

export default Notification;
