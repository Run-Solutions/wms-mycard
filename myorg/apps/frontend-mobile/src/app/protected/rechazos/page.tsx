import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // ✅ import necesario
import { getWorkOrdersWithInconformidadAuditory } from '../../../api/rechazos';
import WorkOrderList from '../../../components/Rechazos/WorkOrderList';

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

const RechazosScreen: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllWorkOrders = async () => {
    try {
      setLoading(true);
      const { pendingOrdersAuditory } = await getWorkOrdersWithInconformidadAuditory();
      console.log('Datos de Ordenes: ', pendingOrdersAuditory);

      if (pendingOrdersAuditory && Array.isArray(pendingOrdersAuditory)) {
        const workOrders = pendingOrdersAuditory.map((item: any) => ({
          ...item.workOrder,
          status: item.status, // ← status del wrapper externo
        }));
        setOrders(workOrders);
      } else {
        console.warn('pendingOrdersAuditory no está definido o no es un arreglo', pendingOrdersAuditory);
      }
    } catch (err) {
      console.error('Error en fetchAllWorkOrders', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ recarga cada vez que se enfoca esta pantalla
  useFocusEffect(
    useCallback(() => {
      fetchAllWorkOrders();
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
      <View style={styles.headerWrapper}>
        <Text style={styles.header}>📋 Rechazos</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0038A8" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay órdenes disponibles para esta área.</Text>
        </View>
      ) : (
        <View style={styles.listWrapper}>
          <StatusLegend />
          <WorkOrderList
            orders={filterOrdersByStatus(['En inconformidad auditoria'])}
            title="Ordenes Devueltas por Inconformidad"
          />
        </View>
      )}
    </View>
  );
};

export default RechazosScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: '#fdfaf6' },
  headerWrapper: {
    paddingTop: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000000',
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
  listWrapper: {
    paddingBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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