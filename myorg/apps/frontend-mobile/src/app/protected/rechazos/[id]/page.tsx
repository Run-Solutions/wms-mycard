import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { InternalStackParamList } from '../../../../navigation/types';
import { getWorkOrderInconformidadById } from '../../../../api/inconformidades';

// Componentes por área 
import CorteComponent from '../../../../components/Rechazos/CorteComponent';
import ColorEdgeComponent from '../../../../components/Rechazos/ColorEdgeComponent';
import HotStampingComponent from '../../../../components/Rechazos/HotStampingComponent';
import MillingChipComponent from '../../../../components/Rechazos/MillingChipComponent';
import PersonalizacionComponent from '../../../../components/Rechazos/PersonalizacionComponent';

type RouteParams = RouteProp<InternalStackParamList, 'RechazosAuxScreen'>;

const RechazosAuxScreen: React.FC = () => {
  const route = useRoute<RouteParams>();
  const { id } = route.params;

  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<any>(null);

  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        const data = await getWorkOrderInconformidadById(id);
        setWorkOrder(data);
      } catch (err) {
        console.error('Error al obtener la orden', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkOrder();
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0038A8" />;
  }

  if (!workOrder) {
    return <Text style={styles.title}>No se encontró la OT</Text>;
  }

  const lastCompleted = [...workOrder.flow].reverse().find((item) => item.status === 'En inconformidad auditoria');

  const renderComponentByArea = () => {
    if (lastCompleted !== undefined) {
      switch (lastCompleted.area_id) {
        case 6:
          return (<CorteComponent workOrder={workOrder} currentFlow={lastCompleted} />);
        case 7:
          return (<ColorEdgeComponent workOrder={workOrder} currentFlow={lastCompleted}/>);
        case 8:
          return (<HotStampingComponent workOrder={workOrder} currentFlow={lastCompleted}/>);
        case 9:
          return (<MillingChipComponent workOrder={workOrder} currentFlow={lastCompleted}/>);
        case 10:
          return (<PersonalizacionComponent workOrder={workOrder} currentFlow={lastCompleted}/>);
        default:
          return <Text style={styles.title}>Área no reconocida</Text>;
      }
    }
    return <Text style={styles.title}>No hay área con inconformidad</Text>;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
        {/* Información fija */}
        <Text style={styles.header}>Información de la OT</Text>
        <View style={styles.card}>
          <Text style={styles.label}>OT: <Text style={styles.value}>{workOrder.ot_id}</Text></Text>
          <Text style={styles.label}>Presupuesto: <Text style={styles.value}>{workOrder.mycard_id}</Text></Text>
          <Text style={styles.label}>Cantidad: <Text style={styles.value}>{workOrder.quantity}</Text></Text>
          <Text style={styles.label}>Comentarios: <Text style={styles.value}>{workOrder.comments}</Text></Text>
        </View>
      {/* Componente que podría contener listas */}
      {renderComponentByArea()}
    </ScrollView>
  );
};

export default RechazosAuxScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 16,
    paddingBottom: 2,
    paddingHorizontal: 8, 
    backgroundColor: '#fdfaf6', 
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
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    fontWeight: 'normal',
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: '#555',
  },
});