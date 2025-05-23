'use client';

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../../../navigation/types';
import { fetchWorkOrderById, closeWorkOrder } from '../../../../api/seguimientoDeOts';

type WorkOrderDetailRouteProp = RouteProp<RootStackParamList, 'WorkOrderDetailScreen'>;

const WorkOrderDetailScreen: React.FC = () => {
  const route = useRoute<WorkOrderDetailRouteProp>();
  const { id } = route.params;
  const navigation = useNavigation();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchWorkOrderById(id);
      setWorkOrder(data);
    };
    loadData();
  }, [id]);

  // Función para obtener los datos específicos de cada área
  const getAreaData = (areaId: number, areaResponse: any) => {
    switch(areaId) {
      case 1: // preprensa
        return {
          buenas: areaResponse?.prepress?.plates || 0,
          malas: areaResponse?.prepress?.bad_quantity || '',
          excedente: areaResponse?.prepress?.excess_quantity || '',
          cqm: '',
          muestras: '',
        };
      case 2: // impresión
        return {
          buenas: areaResponse?.impression?.release_quantity || 0,
          malas: areaResponse?.impression?.bad_quantity || '',
          excedente: areaResponse?.impression?.excess_quantity || '',
          cqm: areaResponse?.impression?.form_answer?.sample_quantity ?? '',
          muestras: '',
        };
      case 3: // serigrafía
        return {
          buenas: areaResponse?.serigrafia?.release_quantity || 0,
          malas: areaResponse?.serigrafia?.bad_quantity || '',
          excedente: areaResponse?.serigrafia?.excess_quantity || '',
          cqm: areaResponse?.serigrafia?.form_answer?.sample_quantity ?? '',
          muestras: '',
        };
      case 4: // empalme
        return {
          buenas: areaResponse?.empalme?.release_quantity || '',
          malas: areaResponse?.empalme?.bad_quantity || '',
          excedente: areaResponse?.empalme?.excess_quantity || '',
          cqm: areaResponse?.empalme?.form_answer?.sample_quantity ?? '',
          muestras: '',
        };
      case 5: // empalme
        return {
          buenas: areaResponse?.laminacion?.release_quantity || 0,
          malas: areaResponse?.laminacion?.bad_quantity || '',
          excedente: areaResponse?.laminacion?.excess_quantity || '',
          cqm: areaResponse?.laminacion?.form_answer?.sample_quantity ?? '',
          muestras: '',
        };
        case 6: // corte
        return {
          buenas: areaResponse?.corte?.good_quantity || 0,
          malas: areaResponse?.corte?.bad_quantity || 0,
          excedente: areaResponse?.corte?.excess_quantity || 0,
          cqm: areaResponse?.corte?.form_answer?.sample_quantity ?? 0,
          muestras: areaResponse?.corte?.formAuditory?.sample_auditory ?? ''
        };
      case 7: // color-edge
        return {
          buenas: areaResponse?.colorEdge?.good_quantity || 0,
          malas: areaResponse?.colorEdge?.bad_quantity || 0,
          excedente: areaResponse?.colorEdge?.excess_quantity || 0,
          cqm: areaResponse?.colorEdge?.form_answer?.sample_quantity || 0,
          muestras: areaResponse?.colorEdge?.formAuditory?.sample_auditory ?? ''
        };
      case 8: // hot-stamping
        return {
          buenas: areaResponse?.hotStamping?.good_quantity || 0,
          malas: areaResponse?.hotStamping?.bad_quantity || 0,
          excedente: areaResponse?.hotStamping?.excess_quantity || 0,
          cqm: areaResponse?.hotStamping?.form_answer?.sample_quantity || 0,
          muestras: areaResponse?.hotStamping?.formAuditory?.sample_auditory ?? ''
        };
      case 9: // milling-chip
        return {
          buenas: areaResponse?.millingChip?.good_quantity || 0,
          malas: areaResponse?.millingChip?.bad_quantity || 0,
          excedente: areaResponse?.millingChip?.excess_quantity || 0,
          cqm: areaResponse?.millingChip?.form_answer?.sample_quantity || 0,
          muestras: areaResponse?.millingChip?.formAuditory?.sample_auditory ?? ''
        };
      case 10: // personalizacion
        return {
          buenas: areaResponse?.personalizacion?.good_quantity || 0,
          malas: areaResponse?.personalizacion?.bad_quantity || 0,
          excedente: areaResponse?.personalizacion?.excess_quantity || 0,
          cqm: areaResponse?.personalizacion?.form_answer?.sample_quantity || 0,
          muestras: areaResponse?.personalizacion?.formAuditory?.sample_auditory ?? ''
        };
      default:
        return {
          buenas: 0,
          malas: 0,
          excedente: 0,
          muestras: 0,
          cqm: 0
        };
    }
  };

  const areas = workOrder?.flow?.map((item: any) => {
    const areaData = getAreaData(item.area_id, item.areaResponse);
    return {
      id: item.area_id,
      name: item.area?.name || 'Sin nombre',
      status: item.status || 'Desconocido',
      response: item.areaResponse || {},
      answers: item.answers?.[0] || {},
      ...areaData,
    };
  }) || [];

  
  const handleCloseOrder = async () => {
    try {
      await closeWorkOrder(workOrder?.ot_id);
      Alert.alert('Orden cerrada', 'La orden de trabajo ha sido cerrada.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo cerrar la orden.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Información de la Orden #{id}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>OT:</Text>
        <Text style={styles.value}>{workOrder?.ot_id}</Text>

        <Text style={styles.label}>Presupuesto:</Text>
        <Text style={styles.value}>{workOrder?.mycard_id}</Text>

        <Text style={styles.label}>Cantidad:</Text>
        <Text style={styles.value}>{workOrder?.quantity}</Text>

        <Text style={styles.label}>Comentarios:</Text>
        <Text style={styles.value}>{workOrder?.comments}</Text>
      </View>

      <Text style={styles.subtitle}>Datos de Producción por Área</Text>
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cell}>Área</Text>
          <Text style={styles.cell}>Buenas</Text>
          <Text style={styles.cell}>Malas</Text>
          <Text style={styles.cell}>Excedente</Text>
          <Text style={styles.cell}>CQM</Text>
          <Text style={styles.cell}>Muestras</Text>
        </View>
        {areas.map((area: any, index: number) => (
          <View key={index} style={styles.row}>
            <Text style={styles.cell}>{area.name}</Text>
            <Text style={styles.cell}>{area.buenas}</Text>
            <Text style={styles.cell}>{area.malas}</Text>
            <Text style={styles.cell}>{area.excedente}</Text>
            <Text style={styles.cell}>{area.cqm}</Text>
            <Text style={styles.cell}>{area.muestras}</Text>
          </View>
        ))}
      </View>

      {workOrder?.status !== 'Cerrado' && (
        <TouchableOpacity style={styles.button} onPress={() => setShowConfirm(true)}>
          <Text style={styles.buttonText}>Cerrar Orden de Trabajo</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>¿Deseas cerrar esta Orden de Trabajo?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowConfirm(false)} style={styles.cancelButton}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCloseOrder} style={styles.confirmButton}>
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default WorkOrderDetailScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fdfaf6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    elevation: 3,
  },
  label: {
    fontWeight: '600',
    marginTop: 8,
  },
  value: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  table: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  cell: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 18,
    width: '80%',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 18,
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    padding: 10,
    borderRadius: 18,
    flex: 1,
  },
  modalButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
});