import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { fetchWorkOrdersInProgress } from '../../../api/cerrarOrdenDeTrabajo';
import WorkOrderList from '../../../components/CerrarOrdenDeTrabajo/WorkOrderList';
import { WorkOrder } from '../../../components/SeguimientoDeOts/WorkOrderList';

const CerrarOrdenDeTrabajoScreen: React.FC = () => {
  const [WorkOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaId, setAreaId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchWorkOrdersInAuditory() {
      try {
        const data = await fetchWorkOrdersInProgress();
        console.log('Data raw', data);
        if (isMounted) setWorkOrders(data ?? []);
      } catch (error) {
        console.error('Error en fetchWorkOrdersInAuditory', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchWorkOrdersInAuditory();
    return () => { isMounted = false; };
  }, []);
  

  const allowedStatuses = ['en auditoria', 'parcial'];
  const matchesAllowedStatus = (status?: string) => {
    const normalizedStatus = status?.toLowerCase?.() ?? '';
    return allowedStatuses.some((allowed) =>
      normalizedStatus.includes(allowed)
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
      <Text style={styles.header}>📋 Cerrar Ordenes de Trabajo </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0038A8" />
      ) : WorkOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay órdenes disponibles para esta área.</Text>
        </View>
      ) : (
        <>
        <StatusLegend />
          <WorkOrderList
            orders={WorkOrders}
            statusFilter={['En Auditoria', 'Parcial' ]}
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