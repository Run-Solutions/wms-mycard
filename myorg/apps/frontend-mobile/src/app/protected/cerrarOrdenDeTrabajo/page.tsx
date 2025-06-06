import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { fetchWorkOrdersInProgress } from '../../../api/cerrarOrdenDeTrabajo';
import { useFocusEffect } from '@react-navigation/native';
import WorkOrderList from '../../../components/CerrarOrdenDeTrabajo/WorkOrderList';

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

const CerrarOrdenDeTrabajoScreen: React.FC = () => {
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
            ot_id: item.ot_id,
            mycard_id: item.mycard_id,
            quantity: item.quantity,
            status: item.status,
            validated: item.validated ?? false,
            createdAt: item.createdAt,
            user: item.user ?? { username: 'Desconocido' },
            flow: item.flow?.map((f: any) => ({
              area_id: f.area?.id,
              status: f.status,
              area: { name: f.area?.name }
            })) ?? []
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

  const filteredOrders = orders.filter(order =>
    order.flow.some(flowItem => flowItem.status === 'En auditoria')
  );


  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Cerrar Ordenes de Trabajo </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0038A8" />
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay órdenes disponibles para esta área.</Text>
        </View>
      ) : (
        <>
          <WorkOrderList
            orders={filteredOrders}
            title="Órdenes en Auditoría"
          />
        </>
      )}
    </View>
  );
};

export default CerrarOrdenDeTrabajoScreen;

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