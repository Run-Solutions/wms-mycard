'use client';

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
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
  const StatusLegend = () => {
    const legendItems = [
      { label: 'Completado', color: '#22c55e' },
      { label: 'Enviado a CQM/En Calidad', color: '#facc15' },
      { label: 'Parcial', color: '#f5945c' },
      { label: 'En Proceso/Listo', color: '#4a90e2' },
      { label: 'En Espera', color: '#d1d5db' },
    ];

    return (
      <View style={styles.legendContainer}>
        {legendItems.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.circle, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Seguimiento de OTs</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0038A8" />
      ) : (
        <>
          <StatusLegend />
          <WorkOrderList orders={orders} filter="En proceso" />
        </>
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
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 1,
    marginBottom: 2,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 2,
  },
  legendText: {
    fontSize: 13,
    color: '#000',
  },
});
