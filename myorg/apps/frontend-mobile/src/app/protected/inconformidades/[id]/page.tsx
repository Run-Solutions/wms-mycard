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

// Componentes por área (ajusta según los que tengas)
import PreprensaComponent from '../../../../components/Inconformidades/PreprensaComponent';
import ImpresionComponent from '../../../../components/Inconformidades/ImpresionComponent';
import ImpresionComponentCQM from '../../../../components/Inconformidades/ImpresionComponentCQM';
import SerigrafiaComponentCQM from '../../../../components/Inconformidades/SerigrafiaComponentCQM';
import SerigrafiaComponent from '../../../../components/Inconformidades/SerigrafiaComponent';
import EmpalmeComponent from '../../../../components/Inconformidades/EmpalmeComponent';
import LaminacionComponent from '../../../../components/Inconformidades/LaminacionComponent';
import CorteComponent from '../../../../components/Inconformidades/CorteComponent';
import ColorEdgeComponent from '../../../../components/Inconformidades/ColorEdgeComponent';
import HotStampingComponent from '../../../../components/Inconformidades/HotStampingComponent';
import MillingChipComponent from '../../../../components/Inconformidades/MillingChipComponent';
import PersonalizacionComponent from '../../../../components/Inconformidades/PersonalizacionComponent';
import EmpalmeComponentCQM from '../../../../components/Inconformidades/EmpalmeComponentCQM';
import LaminacionComponentCQM from '../../../../components/Inconformidades/LaminacionComponentCQM';
import CorteComponentCQM from '../../../../components/Inconformidades/CorteComponentCQM';
import ColorEdgeComponentCQM from '../../../../components/Inconformidades/ColorEdgeComponentCQM';
import HotStampingComponentCQM from '../../../../components/Inconformidades/HotStampingComponentCQM';
import MillingChipComponentCQM from '../../../../components/Inconformidades/MillingChipComponentCQM';
import PersonalizacionComponentCQM from '../../../../components/Inconformidades/PersonalizacionComponentCQM';

// ...otros componentes

type RouteParams = RouteProp<InternalStackParamList, 'InconformidadesAuxScreen'>;

const InconformidadesAuxScreen: React.FC = () => {
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

  const lastCompleted = [...workOrder.flow].reverse().find((item) => item.status === 'En inconformidad');
  const areaInconformidadCQM = [...workOrder.flow].reverse().find((item) => item.status === 'En inconformidad CQM');

  const renderComponentByArea = () => {
    if (lastCompleted) {
      switch (lastCompleted.area_id) {
        case 1:
          return <PreprensaComponent workOrder={lastCompleted} />;
        case 2:
          return <ImpresionComponent workOrder={lastCompleted} />;
        case 3:
          return <SerigrafiaComponent workOrder={lastCompleted} />;
        case 4:
          return <EmpalmeComponent workOrder={lastCompleted} />;
        case 5:
          return <LaminacionComponent workOrder={lastCompleted} />;
        case 6:
          return <CorteComponent workOrder={lastCompleted} />;
        case 7:
          return <ColorEdgeComponent workOrder={lastCompleted} />;
        case 8:
          return <HotStampingComponent workOrder={lastCompleted} />;
        case 9:
          return <MillingChipComponent workOrder={lastCompleted} />;
        case 10:
          return <PersonalizacionComponent workOrder={lastCompleted} />;
        default:
          return <Text style={styles.title}>Área no reconocida</Text>;
      }
    }
    if (areaInconformidadCQM) {
      switch (areaInconformidadCQM.area_id) {
        case 2:
          return <ImpresionComponentCQM workOrder={areaInconformidadCQM} />;
        case 3: 
          return <SerigrafiaComponentCQM workOrder={areaInconformidadCQM} />;
        case 4: 
          return <EmpalmeComponentCQM workOrder={areaInconformidadCQM} />;
        case 5: 
          return <LaminacionComponentCQM workOrder={areaInconformidadCQM} />;
        case 6: 
          return <CorteComponentCQM workOrder={areaInconformidadCQM} />;
        case 7: 
          return <ColorEdgeComponentCQM workOrder={areaInconformidadCQM} />;
        case 8: 
          return <HotStampingComponentCQM workOrder={areaInconformidadCQM} />;
        case 9: 
          return <MillingChipComponentCQM workOrder={areaInconformidadCQM} />;
        case 10: 
          return <PersonalizacionComponentCQM workOrder={areaInconformidadCQM} />;
        default:
          return <Text style={styles.title}>Área CQM no reconocida</Text>;
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

export default InconformidadesAuxScreen;

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