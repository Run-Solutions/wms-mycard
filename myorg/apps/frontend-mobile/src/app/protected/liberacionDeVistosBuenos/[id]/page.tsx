import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { getWorkOrderById } from '../../../../api/recepcionCQM';
import { InternalStackParamList } from '../../../../navigation/types';

import ImpresionComponent from '../../../../components/LiberacionDeVistosBuenos/ImpresionComponent';
import SerigrafiaComponent from '../../../../components/LiberacionDeVistosBuenos/SerigrafiaComponent';
import EmpalmeComponent from '../../../../components/LiberacionDeVistosBuenos/EmpalmeComponent';
import LaminacionComponent from '../../../../components/LiberacionDeVistosBuenos/LaminacionComponent';
import CorteComponent from '../../../../components/LiberacionDeVistosBuenos/CorteComponent';
import ColorEdgeComponent from '../../../../components/LiberacionDeVistosBuenos/ColorEdgeComponent';
import HotStampingComponent from '../../../../components/LiberacionDeVistosBuenos/HotStampingComponent';
import MillingChipComponent from '../../../../components/LiberacionDeVistosBuenos/MillingChipComponent';
import PersonalizacionComponent from '../../../../components/LiberacionDeVistosBuenos/PersonalizacionComponent';

type RouteParams = RouteProp<InternalStackParamList, 'LiberacionDeVistosBuenosAuxScreen'>;

const LiberacionDeVistosBuenosAuxScreen: React.FC = () => {
  const route = useRoute<RouteParams>();
  const { id } = route.params;

  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<any>(null);

  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        const data = await getWorkOrderById(id);
        if (data) {
          setWorkOrder(data);
        }
      } catch (err) {
        console.error('Error al obtener la orden:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkOrder();
  }, [id]);

  const renderComponentByArea = () => {
    if (!workOrder) return null;

    switch (workOrder.area_id) {
      case 2: 
        return <ImpresionComponent workOrder={workOrder} />;
      case 3: 
        return <SerigrafiaComponent workOrder={workOrder} />;
      case 4: 
        return <EmpalmeComponent workOrder={workOrder} />;
      case 5: 
        return <LaminacionComponent workOrder={workOrder} />;
      case 6: 
        return <CorteComponent workOrder={workOrder} />;
      case 7: 
        return <ColorEdgeComponent workOrder={workOrder} />;
      case 8: 
        return <HotStampingComponent workOrder={workOrder} />;
      case 9: 
        return <MillingChipComponent workOrder={workOrder} />;
      case 10: 
        return <PersonalizacionComponent workOrder={workOrder} />;
      default: return <Text style={styles.title}>Área no reconocida.</Text>;
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

export default LiberacionDeVistosBuenosAuxScreen;

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