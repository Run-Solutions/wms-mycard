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
import { InternalStackParamList } from '../../../../navigation/types';
import { liberarWorkOrderAuditory } from '../../../../api/cerrarOrdenDeTrabajo';
import { fetchWorkOrderById } from '../../../../api/seguimientoDeOts';

type WorkOrderDetailRouteProp = RouteProp<InternalStackParamList, 'CerrarOrdenDeTrabajoAuxScreen'>;

type AreaTotals = {
  buenas: number;
  malas: number;
  excedente: number;
  cqm: number;
  muestras: number;
};

const CerrarOrdenDeTrabajoAuxScreen: React.FC = () => {
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
  console.log(workOrder);

  // Función para obtener los datos específicos de cada área
  const getAreaData = (areaId: number, areaResponse: any) => {
    console.log("user", areaResponse?.user?.username);
    switch (areaId) {
      case 6: // corte
        return {
          buenas: areaResponse?.corte?.good_quantity || 0,
          malas: areaResponse?.corte?.bad_quantity || 0,
          excedente: areaResponse?.corte?.excess_quantity || 0,
          cqm: areaResponse?.corte?.form_answer?.sample_quantity ?? 0,
          muestras: areaResponse?.corte?.formAuditory?.sample_auditory ?? '',
          usuario: areaResponse?.user?.username || '',
          auditor: areaResponse?.corte?.formAuditory?.user?.username || '',
        };
      case 7: // color-edge
        return {
          buenas: areaResponse?.colorEdge?.good_quantity || 0,
          malas: areaResponse?.colorEdge?.bad_quantity || 0,
          excedente: areaResponse?.colorEdge?.excess_quantity || 0,
          cqm: areaResponse?.colorEdge?.form_answer?.sample_quantity || 0,
          muestras: areaResponse?.colorEdge?.formAuditory?.sample_auditory ?? '',
          usuario: areaResponse?.user?.username || '',
          auditor: areaResponse?.colorEdge?.formAuditory?.user?.username || '',
        };
      case 8: // hot-stamping
        return {
          buenas: areaResponse?.hotStamping?.good_quantity || 0,
          malas: areaResponse?.hotStamping?.bad_quantity || 0,
          excedente: areaResponse?.hotStamping?.excess_quantity || 0,
          cqm: areaResponse?.hotStamping?.form_answer?.sample_quantity || 0,
          muestras: areaResponse?.hotStamping?.formAuditory?.sample_auditory ?? '',
          usuario: areaResponse?.user?.username || '',
          auditor: areaResponse?.hotStamping?.formAuditory?.user?.username || '',

        };
      case 9: // milling-chip
        console.log(areaResponse?.millingChip);
        return {
          buenas: areaResponse?.millingChip?.good_quantity || 0,
          malas: areaResponse?.millingChip?.bad_quantity || 0,
          excedente: areaResponse?.millingChip?.excess_quantity || 0,
          cqm: areaResponse?.millingChip?.form_answer?.sample_quantity || 0,
          muestras: areaResponse?.millingChip?.formAuditory?.sample_auditory ?? '',
          usuario: areaResponse?.user?.username || '',
          auditor: areaResponse?.millingChip?.formAuditory?.user?.username || '',
        };
      case 10: // personalizacion
        return {
          buenas: areaResponse?.personalizacion?.good_quantity || 0,
          malas: areaResponse?.personalizacion?.bad_quantity || 0,
          excedente: areaResponse?.personalizacion?.excess_quantity || 0,
          cqm: areaResponse?.personalizacion?.form_answer?.sample_quantity || 0,
          muestras: areaResponse?.personalizacion?.formAuditory?.sample_auditory ?? '',
          usuario: areaResponse?.user?.username || '',
          auditor: areaResponse?.personalizacion?.formAuditory?.user?.username || '',
        };
      default:
        return {
          buenas: 0,
          malas: 0,
          excedente: 0,
          muestras: 0,
          cqm: 0,
          usuario: '',
          auditor: ''
        };
    }
  };

  const areas = workOrder?.flow?.map((item: any) => {
    const areaData = getAreaData(item.area_id, item.areaResponse);
    console.log('areaData', areaData.usuario);
    return {
      id: item.area_id,
      name: item.area?.name || 'Sin nombre',
      status: item.status || 'Desconocido',
      response: item.areaResponse || {},
      answers: item.answers?.[0] || {},
      ...areaData,
    };
  }) || [];

  const totals = areas.reduce(
    (acc: AreaTotals, area: any): AreaTotals => {
      acc.buenas += Number(area.buenas) || 0;
      acc.malas += Number(area.malas) || 0;
      acc.excedente += Number(area.excedente) || 0;
      acc.cqm += Number(area.cqm) || 0;
      acc.muestras += Number(area.muestras) || 0;
      return acc;
    },
    { buenas: 0, malas: 0, excedente: 0, cqm: 0, muestras: 0 }
  );


  const handleCloseOrder = async () => {
    try {
      const currentFlow = workOrder.flow.find((f: any) => f.status === 'En auditoria');

      const payload = {
        workOrderFlowId: currentFlow.id,
        workOrderId: workOrder.id,
      };
      console.log(payload);
      await liberarWorkOrderAuditory(payload);
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
      <ScrollView horizontal>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={styles.cellUser}>Área</Text>
            <Text style={styles.cell}>Buenas</Text>
            <Text style={styles.cell}>Malas</Text>
            <Text style={styles.cell}>Excedente</Text>
            <Text style={styles.cell}>CQM</Text>
            <Text style={styles.cell}>Muestras</Text>
            <Text style={styles.cell}>Totales</Text>
            <Text style={styles.cellUser}>Usuario</Text>
            <Text style={styles.cellUser}>Auditor</Text>
          </View>
          {areas.filter((area: any) => area.id >= 6).map((area: any, index: number) => (
            <View key={index} style={styles.row}>
              <Text style={styles.cellUser}>{area.name}</Text>
              <Text style={styles.cell}>{area.buenas}</Text>
              <Text style={styles.cell}>{area.malas}</Text>
              <Text style={styles.cell}>{area.excedente}</Text>
              <Text style={styles.cell}>{area.cqm}</Text>
              <Text style={styles.cell}>{area.muestras}</Text>
              <Text style={styles.cell}>{Number(area.buenas) + Number(area.malas) + Number(area.excedente) + Number(area.cqm) + Number(area.muestras)}</Text>
              <Text style={styles.cellUser}>{area?.usuario}</Text>
              <Text style={styles.cellUser}>{area?.auditor}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

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

export default CerrarOrdenDeTrabajoAuxScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fdfaf6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'black',
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
    padding: 10,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 6,
  },
  cell: {
    width: 85,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  cellUser: {
    width: 120,
    paddingHorizontal: 10
  },
  button: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20
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
    backgroundColor: '#0038A8',
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