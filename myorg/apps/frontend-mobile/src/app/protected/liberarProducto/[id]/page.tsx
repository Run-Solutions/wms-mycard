// myorg/apps/frontend-mobile/src/app/protected/liberarProducto/[id]/page.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../../navigation/types';
import { fetchWorkOrderById } from '../../../../api/liberarProducto';

// Componentes por área (similares a los de la web)
import PrePrensaComponent from '../../../../components/LiberarProducto/PrePrensaComponent';
import ImpresionComponent from '../../../../components/LiberarProducto/ImpresionComponent';
/*import SerigrafiaComponent from '../../../../components/LiberarProducto/SerigrafiaComponent';
import EmpalmeComponent from '../../../../components/LiberarProducto/EmpalmeComponent';
import LaminacionComponent from '../../../../components/LiberarProducto/LaminacionComponent';
import CorteComponent from '../../../../components/LiberarProducto/CorteComponent';
import ColorEdgeComponent from '../../../../components/LiberarProducto/ColorEdgeComponent';
import HotStampingComponent from '../../../../components/LiberarProducto/HotStampingComponent';
import MillingChipComponent from '../../../../components/LiberarProducto/MillingChipComponent';
import PersonalizacionComponent from '../../../../components/LiberarProducto/PersonalizacionComponent';*/
type RouteParams = RouteProp<RootStackParamList, 'LiberarProductoAuxScreen'>;

const LiberarProductoAuxScreen: React.FC = () => {
  const route = useRoute<RouteParams>();
  const { id } = route.params;

  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<any>(null);
  console.log('Liberar AUx');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchWorkOrderById(id);
        setWorkOrder(response); // ya no es array
      } catch (error) {
        console.error('Error fetching work order:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const renderComponentByArea = () => {
    if (!workOrder) return null;

    switch (workOrder.area_id) {
      case 1: 
        return <PrePrensaComponent workOrder={workOrder} />;
      case 2: 
        return <ImpresionComponent workOrder={workOrder} />;
      /*case 3: return <SerigrafiaComponent workOrder={workOrder} />;
      case 4: return <EmpalmeComponent workOrder={workOrder} />;
      case 5: return <LaminacionComponent workOrder={workOrder} />;
      case 6: return <CorteComponent workOrder={workOrder} />;
      case 7: return <ColorEdgeComponent workOrder={workOrder} />;
      case 8: return <HotStampingComponent workOrder={workOrder} />;
      case 9: return <MillingChipComponent workOrder={workOrder} />;
      case 10: return <PersonalizacionComponent workOrder={workOrder} />;*/      
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

export default LiberarProductoAuxScreen;

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