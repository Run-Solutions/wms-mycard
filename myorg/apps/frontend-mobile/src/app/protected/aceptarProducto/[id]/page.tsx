// apps/frontend-mobile/src/app/protected/aceptarProducto/[id]/page.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { getWorkOrderByFlowId } from '../../../../api/aceptarProducto';

// Componentes por área
import PrepressComponentAccept from '../../../../components/AceptarProducto/PrepressComponentAccept';
import ImpresionComponentAccept from '../../../../components/AceptarProducto/ImpresionComponentAccept';
import SerigrafiaComponentAccept from '../../../../components/AceptarProducto/SerigrafiaComponentAccept';
import EmpalmeComponentAccept from '../../../../components/AceptarProducto/EmpalmeComponentAccept';
import LaminacionComponentAccept from '../../../../components/AceptarProducto/LaminacionComponentAccept';

import { InternalStackParamList } from '../../../../navigation/types';

type RouteParams = RouteProp<InternalStackParamList, 'AceptarProductoAuxScreen'>;

const AceptarProductoAuxScreen: React.FC = () => {
  const route = useRoute<RouteParams>();
  const { flowId } = route.params;

  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<any>(null);

  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        const data = await getWorkOrderByFlowId(flowId);
        console.log('Orden:', data);
        setWorkOrder(data);
      } catch (error) {
        console.error('Error al obtener la OT:', error);
        Alert.alert('Error', 'No se pudo cargar la orden.');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkOrder();
  }, [flowId]);

  const renderComponentByArea = () => {
    if (!workOrder || !workOrder.workOrder?.flow) return null;

    let lastStep;

    if (workOrder.status === 'Pendiente') {
      lastStep = [...workOrder.workOrder.flow].reverse().find((step) => step.status === 'Completado');
    } else if (workOrder.status === 'Pendiente' && workOrder.workOrder.flow.partialReleases?.length > 0) {
      lastStep = [...workOrder.workOrder.flow].reverse().find((step) =>
        ['Listo', 'Enviado a CQM', 'En calidad', 'Parcial'].includes(step.status)
      );
    } else if (workOrder.status === 'Pendiente parcial') {
      lastStep = [...workOrder.workOrder.flow].reverse().find((step) =>
        ['Listo', 'Enviado a CQM', 'En calidad', 'Parcial', 'En proceso'].includes(step.status)
      );
    }
    console.log(lastStep);

    switch (lastStep?.area_id) {
      case 1:
        return <PrepressComponentAccept workOrder={workOrder} />;
      case 2:
        return <ImpresionComponentAccept workOrder={workOrder} />;
      case 3:
        return <SerigrafiaComponentAccept workOrder={workOrder} />;
      case 4:
        return <EmpalmeComponentAccept workOrder={workOrder} />;
      case 5:
        return <LaminacionComponentAccept workOrder={workOrder} />;
    default:
        return <Text style={styles.title}>Área no reconocida.</Text>;
    }
  };

    return (
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : (
          renderComponentByArea()
        )}
      </ScrollView>
    );
  };

  export default AceptarProductoAuxScreen;

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: '#fdfaf6',
      flexGrow: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginVertical: 16,
      textAlign: 'center',
    },
  });