import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { fetchWorkOrdersInProgress } from '../../../api/liberarProducto';
import { useFocusEffect } from '@react-navigation/native';
import WorkOrderList from '../../../components/LiberarProducto/WorkOrderList';

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
}

const LiberarProductoScreen: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaId, setAreaId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const data = await fetchWorkOrdersInProgress();
          console.log("RAW DATA:", data);
          if (!Array.isArray(data)) {
            console.warn('La API no devolvió un array:', data);
            setOrders([]);
            return;
          }
          const transformed = data.map((item: any) => ({
            id: item.id,
            ot_id: item.workOrder.ot_id,
            mycard_id: item.workOrder.mycard_id,
            quantity: item.workOrder.quantity,
            status: item.status, 
            validated: item.workOrder.validated,
            createdAt: item.workOrder.createdAt,
            user: item.workOrder.user,
            flow: item.workOrder.flow.map((f: any) => ({
              area_id: f.area.id,
              status: f.status,
              area: { name: f.area.name }
            }))
          }));
          setOrders(transformed);
          if (transformed.length > 0) {
            setAreaId(transformed[0].flow[0]?.area_id ?? null);
          }
        } catch (error) {
          console.error('Error al obtener las órdenes:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [])
  );

  const filterOrdersByStatus = (statuses: string[]) => {
    return orders.filter((o) => statuses.includes(o.status));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Mis Órdenes</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0038A8" />
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay órdenes disponibles para esta área.</Text>
        </View>
      ) : (
        <>
          <WorkOrderList
            orders={filterOrdersByStatus(['En proceso', 'Enviado a CQM', 'Listo', 'En Calidad', 'Parcial'])}
            title="Órdenes en Proceso"
          />
          {areaId !== 1 && (
            <WorkOrderList
              orders={filterOrdersByStatus(['Listo', 'Parcial'])}
              title="Órdenes pendientes por Liberar"
            />
          )}
        </>
      )}
    </View>
  );
};

export default LiberarProductoScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: '#fdfaf6' },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000000',
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