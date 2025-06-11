import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { getWorkOrdersWithInconformidad } from '../../../api/inconformidades';
import WorkOrderList from '../../../components/Inconformidades/WorkOrderList';

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

const InconformidadesScreen: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaId, setAreaId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getWorkOrdersWithInconformidad();
        console.log("RAW DATA:", data);
        if (!Array.isArray(data)) {
          console.warn('La API no devolvió un array:', data);
          setOrders([]); // o el estado que uses
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
          files: item.workOrder.files, 
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
  }, []);

  const filterOrdersByStatus = (statuses: string[]) => {
    return orders.filter((o) =>
      statuses.includes(o.status)
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <Text style={styles.header}>📋 Inconformidades</Text>
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
          <WorkOrderList
            orders={filterOrdersByStatus(['En inconformidad'])}
            title="Órdenes en inconformidad"
          />
          <WorkOrderList
            orders={filterOrdersByStatus(['En inconformidad CQM'])}
            title="Órdenes en inconformidad CQM"
          />
        </View>
      )}
    </View>
  );
};

export default InconformidadesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: '#fdfaf6' },
  headerWrapper:{
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
});
