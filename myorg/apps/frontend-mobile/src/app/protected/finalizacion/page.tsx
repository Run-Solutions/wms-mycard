import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { getWorkOrders } from '../../../api/finalizacion';
import WorkOrderList from '../../../components/SeguimientoDeOts/WorkOrderList';

interface File {
  id: number;
  type: string;
  file_path: string;
}

interface Flow {
  id: number;
  area_id: number;
  status: string;
  assigned_user?: number;
  area?: {
    name?: string;
  };
}

interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  created_by: number;
  status: string;
  validated: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
  };
  files: File[];
  flow: Flow[];
  formAnswers?: any[];
}

const FinalizacionScreen: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchAllWorkOrders() {
      try {
        const res = await getWorkOrders();
        setWorkOrders(res);
      } catch (error) {
        console.error('Error en fetchAllWorkOrders', error);
        Alert.alert('Error', 'No se pudieron obtener las órdenes.');
      } finally {
        setLoading(false);
      }
    }
    fetchAllWorkOrders();
  }, []);

  const dataToRender = [
    {
      key: 'listo',
      title: 'Órdenes Pendientes por Cerrar',
      filter: 'Listo',
    },
    {
      key: 'cerrado',
      title: 'Órdenes Cerradas',
      filter: 'Cerrado',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <FlatList
      data={dataToRender}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
          <WorkOrderList
            orders={workOrders}
            isTouchable={false}
          />
        </View>
      )}
      contentContainerStyle={styles.container}
    />
  );
};

export default FinalizacionScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fdfaf6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
    textAlign: 'center',
  },
});