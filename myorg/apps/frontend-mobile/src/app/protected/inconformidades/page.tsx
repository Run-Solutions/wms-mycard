import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { getWorkOrdersWithInconformidad } from '../../../api/inconformidades';
import WorkOrderList from '../../../components/Inconformidades/WorkOrderList';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

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

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const { pendingOrders } = await getWorkOrdersWithInconformidad();
          console.log('Datos de Ordenes: ', pendingOrders);
  
          if (!Array.isArray(pendingOrders)) {
            console.warn('La API no devolvió un array:', pendingOrders);
            setOrders([]);
            return;
          }
  
          const transformed = pendingOrders.map((item: any) => {
            const wo = item.workOrder;
            return {
              id: item.id,
              ot_id: wo.ot_id,
              mycard_id: wo.mycard_id,
              quantity: wo.quantity,
              status: item.status,
              validated: wo.validated,
              createdAt: wo.createdAt,
              user: wo.user,
              files: wo.files,
              flow: wo.flow.map((f: any) => ({
                area_id: f.area.id,
                status: f.status,
                area: { name: f.area.name },
              })),
            };
          });
  
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
    return orders.filter((o) =>
      statuses.includes(o.status)
    );
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
          <StatusLegend />
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
