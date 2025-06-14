import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { fetchWorkOrdersInProgress } from '../../../api/cerrarOrdenDeTrabajo';
import { useFocusEffect } from '@react-navigation/native';
import WorkOrderList from '../../../components/CerrarOrdenDeTrabajo/WorkOrderList';

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
            })) ?? [],
            files: item.files?.map((file: any) => ({
              id: file.id,
              type: file.type,
              file_path: file.file_path
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
      <Text style={styles.header}>📋 Cerrar Ordenes de Trabajo </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0038A8" />
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay órdenes disponibles para esta área.</Text>
        </View>
      ) : (
        <>
          <StatusLegend />
          <WorkOrderList
            orders={filteredOrders}
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