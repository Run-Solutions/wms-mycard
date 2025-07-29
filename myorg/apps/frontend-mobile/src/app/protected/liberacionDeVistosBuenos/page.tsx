import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getOrdersInCalidad } from '../../../api/recepcionCQM';
import WorkOrderList from '../../../components/LiberacionDeVistosBuenos/WorkOrderList';

interface File {
  id: number;
  type: string;
  file_path: string;
}

interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  status: string;
  validated: boolean;
  createdAt: string;
  user: {
    username: string;
  };
  flow: {
    area_id: number;
    status: string;
    area?: { name?: string };
  }[];
  files: File[];
}

const LiberacionDeVistosBuenosScreen: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadOrders = async () => {
        try {
          const data = await getOrdersInCalidad();
          if (isActive) {
            setOrders(data);
          }
        } catch (err) {
          console.error('Error al obtener las órdenes:', err);
          if (isActive) setOrders([]);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      loadOrders();
      return () => {
        isActive = false;
      };
    }, [])
  );
    const filterOrdersByStatus = (statuses: string[]) => {
      return orders.filter((o) => statuses.includes(o.status));
    };
  
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
      <Text style={styles.header}>📋 Órdenes en Calidad</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0038A8" />
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No hay órdenes en calidad asignadas actualmente.
          </Text>
        </View>
      ) : (
        <>
        <StatusLegend />
        <WorkOrderList orders={orders} />
        </>
      )}
    </View>
  );
};

export default LiberacionDeVistosBuenosScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#fdfaf6',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000',
    padding: Platform.OS === 'ios' ? 14 : 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
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