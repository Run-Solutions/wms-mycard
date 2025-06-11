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
import WorkOrderList from '../../../components/RecepcionCQM/WorkOrderList';

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

const RecepcionCQMScreen: React.FC = () => {
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
        <WorkOrderList orders={orders} />
      )}
    </View>
  );
};

export default RecepcionCQMScreen;

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
});