// myorg/apps/frontend-mobile/src/app/protected/aceptarAuditoria/[id]/page.tsx

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
import { getWorkOrderByFlowId } from '../../../../api/aceptarAuditoria';

// Componentes por área
import CorteComponentAcceptAuditory from '../../../../components/AceptarAuditoria/CorteComponents';
import ColorEdgeComponentAcceptAuditory from '../../../../components/AceptarAuditoria/ColorEdgeComponents';
import HotStampingComponentAcceptAuditory from '../../../../components/AceptarAuditoria/HotStampingComponent';
import MillingChipComponentAcceptAuditory from '../../../../components/AceptarAuditoria/MillingChipComponent';
import PersonalizacionComponentAcceptAuditory from '../../../../components/AceptarAuditoria/PersonalizacionComponent';

import { InternalStackParamList } from '../../../../navigation/types';

type RouteParams = RouteProp<InternalStackParamList, 'AceptarAuditoriaAuxScreen'>;

const AceptarAuditoriaAuxScreen: React.FC = () => {
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
    switch (workOrder.area_id) {
      case 6:
        return <CorteComponentAcceptAuditory workOrder={workOrder} />;
      case 7:
        return <ColorEdgeComponentAcceptAuditory workOrder={workOrder} />;
      case 8:
        return <HotStampingComponentAcceptAuditory workOrder={workOrder} />;
      case 9:
        return <MillingChipComponentAcceptAuditory workOrder={workOrder} />;
      case 10:
        return <PersonalizacionComponentAcceptAuditory workOrder={workOrder} />;
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

  export default AceptarAuditoriaAuxScreen;

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