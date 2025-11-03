import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
  created_by: number;
  status: string;
  validated: boolean;
  createdAt: string;
  updatedAt: string;
  user: { username: string };
  files: { id: number; type: string; file_path: string }[];
  flow: {
    id: number;
    area_id: number;
    status: string;
    assigned_user?: number;
    area?: { name?: string };
  }[];
  formAnswers?: any[];
}

const RechazosScreen: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllWorkOrders = async () => {
    try {
      const res = await getWorkOrdersWithInconformidadAuditory();
      console.log(res, 'res');

      // ✅ Adaptado al nuevo backend
      const allFlows = Array.isArray(res?.pendingOrders)
        ? res.pendingOrders
        : [];

      // ✅ Aplana a WorkOrder y filtra nulos
      const allWorkOrders = allFlows
        .map((f: any) => f?.workOrder)
        .filter(Boolean);

      // ✅ Deduplica por id (por si acaso)
      const deduped = dedupeBy(allWorkOrders, (wo: WorkOrder) => wo.id);

      setWorkOrders(deduped);
    } catch (err) {
      console.error('Error en fetchAllWorkOrders', err);
    }
  };

  // =================== utils ===================
  function dedupeBy<T>(arr: T[], keyFn: (x: T) => string | number): T[] {
    const seen = new Set<string | number>();
    const out: T[] = [];
    for (const item of arr) {
      const k = keyFn(item);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(item);
      }
    }
    return out;
  }

  // ✅ recarga cada vez que se enfoca esta pantalla
  useFocusEffect(
    useCallback(() => {
      fetchAllWorkOrders();
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
      <View style={styles.headerWrapper}>
        <Text style={styles.header}>📋 Rechazos</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0038A8" />
        </View>
      ) : workOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No hay órdenes disponibles para esta área.
          </Text>
        </View>
      ) : (
        <View style={styles.listWrapper}>
          <StatusLegend />
          <WorkOrderList
            orders={workOrders}
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
