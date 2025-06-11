'use client';

import React, { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import WorkOrderList from '../../../components/SeguimientoDeOts/WorkOrderList';
import { fetchWorkOrdersInProgress } from '../../../api/seguimientoDeOts';
import { useFocusEffect } from '@react-navigation/native';

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
  files: File[];
}

interface File {
  id: number;
  type: string;
  file_path: string;
}

const SeguimientoDeOtsPage: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchWorkOrdersInProgress();
      setOrders(data);
    } catch (error) {
      console.error('Error al obtener las órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Seguimiento de OTs</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0038A8" />
      ) : (
        <WorkOrderList orders={orders} filter='En proceso' />
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