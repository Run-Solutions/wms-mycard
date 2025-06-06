// myorg/apps/frontend-mobile/src/app/protected/liberarProducto/[id]/page.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { InternalStackParamList } from '../../../../navigation/types';
import { fetchWorkOrderById } from '../../../../api/liberarProducto';

// Componentes por área (similares a los de la web)
import PrePrensaComponent from '../../../../components/LiberarProducto/PrePrensaComponent';
import ImpresionComponent from '../../../../components/LiberarProducto/ImpresionComponent';
import SerigrafiaComponent from '../../../../components/LiberarProducto/SerigrafiaComponent';
import EmpalmeComponent from '../../../../components/LiberarProducto/EmpalmeComponent';
import LaminacionComponent from '../../../../components/LiberarProducto/LaminacionComponent';
import CorteComponent from '../../../../components/LiberarProducto/CorteComponent';
import ColorEdgeComponent from '../../../../components/LiberarProducto/ColorEdgeComponent';
import HotStampingComponent from '../../../../components/LiberarProducto/HotStampingComponent';
import MillingChipComponent from '../../../../components/LiberarProducto/MillingChipComponent';
import PersonalizacionComponent from '../../../../components/LiberarProducto/PersonalizacionComponent';

type RouteParams = RouteProp<InternalStackParamList, 'CerrarOrdenDeTrabajoAuxScreen'>;

const CerrarOrdenDeTrabajoAuxScreen: React.FC = () => {
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
      default: 
        return <Text style={styles.title}>Área no reconocida.</Text>;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" />
      ) : (
        <>
          <Text style={styles.header}>Información de la OT</Text>
          <View style={styles.card}>
            <Text style={styles.label}>
              OT: <Text style={styles.value}>{workOrder.workOrder.ot_id}</Text>
            </Text>
            <Text style={styles.label}>
              Presupuesto: <Text style={styles.value}>{workOrder.workOrder.mycard_id}</Text>
            </Text>
            <Text style={styles.label}>
              Cantidad: <Text style={styles.value}>{workOrder.workOrder.quantity}</Text>
            </Text>
            <Text style={styles.label}>
              Comentarios: <Text style={styles.value}>{workOrder.workOrder.comments}</Text>
            </Text>
          </View>
          {renderComponentByArea()}
        </>
      )}
    </ScrollView>
  );
};
export default CerrarOrdenDeTrabajoAuxScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 16,
    paddingBottom: 2,
    paddingHorizontal: 8, 
    backgroundColor: '#fdfaf6', 
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: 'black',
    padding: Platform.OS === 'ios' ? 10 : 0,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  value: {
    fontWeight: 'normal',
    fontSize: 16,
  },
});