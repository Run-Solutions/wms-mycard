"use client";

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Title, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

interface KPIs {
  stock: number;
  orders: number;
  incidents: number;
  averageProcessingTime: string;
}

const DashboardScreen: React.FC = () => {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    Promise.all([
      fetch('http://192.168.1.12:3000/dashboard/kpis').then(res => res.json()),
      fetch('http://192.168.1.12:3000/dashboard/notifications').then(res => res.json()),
    ])
      .then(([kpisData, notificationsData]) => {
        setKpis(kpisData);
        if (Array.isArray(notificationsData)) {
          setNotifications(notificationsData);
        } else {
          console.error("Notificaciones no es un array:", notificationsData);
          setNotifications([]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.loading} size="large" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Title style={styles.title}>Dashboard</Title>
      {kpis && (
        <View style={styles.kpiContainer}>
          <Surface style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Stock</Text>
            <Text style={styles.kpiValue}>{kpis.stock}</Text>
          </Surface>
          <Surface style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Pedidos</Text>
            <Text style={styles.kpiValue}>{kpis.orders}</Text>
          </Surface>
          <Surface style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Incidencias</Text>
            <Text style={styles.kpiValue}>{kpis.incidents}</Text>
          </Surface>
          <Surface style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Tiempo Promedio</Text>
            <Text style={styles.kpiValue}>{kpis.averageProcessingTime}</Text>
          </Surface>
        </View>
      )}
      <Title style={styles.subtitle}>Notificaciones</Title>
      {notifications.map((notif) => (
        <Surface key={notif.id} style={styles.notificationBox}>
          <Text>{notif.message}</Text>
          <Text style={styles.notificationTimestamp}>
            {new Date(notif.timestamp).toLocaleString()}
          </Text>
        </Surface>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    marginVertical: 16,
    color: '#000',
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiBox: {
    width: '45%',
    padding: 16,
    marginVertical: 8,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 16,
    color: '#555',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    marginVertical: 16,
    color: '#000',
  },
  notificationBox: {
    width: '100%',
    padding: 16,
    marginVertical: 8,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#777',
  },
});

export default DashboardScreen;

