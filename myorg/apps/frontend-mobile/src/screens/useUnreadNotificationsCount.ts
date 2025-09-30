// src/hooks/useUnreadNotificationsCount.ts
import React, { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
// Ajusta la importación a tu capa de API móvil
import { getNotificationHistory } from '../api/notifications';
import { AuthContext } from '../contexts/AuthContext';

export function useUnreadNotificationsCount(pollMs = 0) {
  const [count, setCount] = useState(0);
  
  // Safe useAuth hook
  const authContext = React.useContext(AuthContext);
  const user = authContext?.user;

  const load = useCallback(async () => {
    if (!user) return;
    const userId = (user as any).sub ?? user.sub;
    const raw = await getNotificationHistory(userId);
    const arr = Array.isArray(raw) ? raw : [];
    const unread = arr.filter((n: any) => !(n.isRead ?? n.read ?? (n.status === 'READ'))).length;
    setCount(unread);
  }, [user]);

  // Carga al enfocar la pantalla que usa el header
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Carga cuando la app vuelve a primer plano
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') load();
    });
    return () => sub.remove();
  }, [load]);

  // (Opcional) Polling
  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { count, reload: load };
}