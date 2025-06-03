// src/app/protected/seguimientoOts/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import WorkOrderList from '../../../components/SeguimientoDeOts/WorkOrderList'; // importa el componente
import { Platform } from 'react-native';
import { fetchWorkOrdersInProgress } from '../../../api/seguimientoDeOts';

interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  status: string;
  validated: boolean;
  createdAt: string;
  user: { username: string };
  flow: {
    area_id: number;
    status: string;
    area?: { name?: string };
  }[];
}

const SeguimientoDeOtsPage: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchWorkOrdersInProgress();
        setOrders(data);
      } catch (error) {
        console.error('Error al obtener las órdenes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Seguimiento de OTs</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0038A8" />
      ) : (
        <WorkOrderList orders={orders} />
      )}
    </View>
  );
};
export default SeguimientoDeOtsPage;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: '#fdfaf6' },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: 'black',
    padding: Platform.OS === 'ios' ? 14 : 0,
  },
});