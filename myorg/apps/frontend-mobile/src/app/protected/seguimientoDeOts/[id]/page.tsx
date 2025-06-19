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
import { fetchWorkOrderById, closeWorkOrder } from '../../../../api/seguimientoDeOts';

type WorkOrderDetailRouteProp = RouteProp<InternalStackParamList, 'WorkOrderDetailScreen'>;

type AreaTotals = {
  buenas: number;
  malas: number;
  excedente: number;
  cqm: number;
  muestras: number;
};

type AreaData = {
  id: number;
  name: string;
  status: string;
  response: {
    user: {
      username: string;
    };
  };
  answers: any;
  usuario: string;
  auditor: string;
  buenas: number;
  malas: number;
  cqm: number;
  excedente: number;
  muestras: number;
};

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
 const getAreaData = (
  areaId: number,
  areaResponse: any,
  partialReleases: any[] = [],
  flowUser: any = null,
  index: number = -1
) => {
  const sumFromPartials = () => {
    return partialReleases.reduce(
      (acc: any, curr: any) => {
        acc.buenas += curr.quantity || 0;
        acc.malas += curr.bad_quantity || 0;
        acc.excedente += curr.excess_quantity || 0;
        return acc;
      },
      { buenas: 0, malas: 0, excedente: 0 }
    );
  };

  const getCommonData = (areaKey: string) => {
    const hasResponse = !!areaResponse?.[areaKey];
    const usuario = areaResponse?.user?.username || flowUser?.username ||'';
    const auditor = areaResponse?.[areaKey]?.formAuditory?.user?.username || '';

    if (!hasResponse && partialReleases.length > 0) {
      const resumen = sumFromPartials();
      console.log('[PARCIAL DETECTADO]', areaKey, resumen);
      return { ...resumen, cqm: 0, muestras: 0, usuario, auditor: '' };
    }

    return {
      buenas:
        areaResponse?.[areaKey]?.good_quantity ||
        areaResponse?.[areaKey]?.release_quantity ||
        areaResponse?.[areaKey]?.plates ||
        0,
      malas: areaResponse?.[areaKey]?.bad_quantity || 0,
      excedente: areaResponse?.[areaKey]?.excess_quantity || 0,
      cqm: areaResponse?.[areaKey]?.form_answer?.sample_quantity ?? 0,
      muestras: areaResponse?.[areaKey]?.formAuditory?.sample_auditory ?? 0,
      usuario,
      auditor,
    };
  };

  switch (areaId) {
    case 1:
      return getCommonData('prepress');
    case 2:
      return getCommonData('impression');
    case 3:
      return getCommonData('serigrafia');
    case 4:
      return getCommonData('empalme');
    case 5:
      return getCommonData('laminacion');
    case 6:
      return getCommonData('corte');
    case 7:
      return getCommonData('colorEdge');
    case 8:
      return getCommonData('hotStamping');
    case 9:
      return getCommonData('millingChip');
    case 10:
      return getCommonData('personalizacion');
    default:
      return {
        buenas: 0,
        malas: 0,
        excedente: 0,
        cqm: 0,
        muestras: 0,
        usuario: '',
        auditor: '',
      };
  }
};

const areas: AreaData[] =
workOrder?.flow?.map((item: any, index: number) => ({
  id: item.area_id,
  name: item.area?.name || 'Sin nombre',
  status: item.status || 'Desconocido',
  response: item.areaResponse || {},
  answers: item.answers?.[0] || {},
  ...getAreaData(item.area_id, item.areaResponse, item.partialReleases, item.user, index),
})) || [];



  const cantidadHojasRaw = Number(workOrder?.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;


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

        <Text style={styles.label}>Cantidad (TARJETAS):</Text>
        <Text style={styles.value}>{workOrder?.quantity}</Text>

        <Text style={styles.label}>Cantidad (HOJAS):</Text>
        <Text style={styles.value}>{cantidadHojas}</Text>

        <Text style={styles.label}>Comentarios:</Text>
        <Text style={styles.value}>{workOrder?.comments}</Text>
      </View>

      <Text style={styles.subtitle}>Datos de Producción por Área</Text>
      <ScrollView horizontal>
        <View style={styles.table}>
        <View style={styles.headerRow}>
            <Text style={styles.cellUser}>Área</Text>
            <Text style={styles.cellUser}>Estado</Text>
            <Text style={styles.cellUser}>Buenas</Text>
            <Text style={styles.cellUser}>Malas</Text>
            <Text style={styles.cellUser}>Excedente</Text>
            <Text style={styles.cellUser}>CQM</Text>
            <Text style={styles.cellUser}>Muestras</Text>
            <Text style={styles.cellUser}>Totales</Text>
            <Text style={styles.cellUser}>Usuario</Text>
            <Text style={styles.cellUser}>Auditor</Text>
          </View>
          {areas.map((area: any, index: number) => (
            <View key={index} style={styles.row}>
              <Text style={styles.cellUser}>{area.name}</Text>
              <Text style={styles.cellUser}>{area.status}</Text>
              <Text style={styles.cellUser}>{area.buenas}</Text>
              <Text style={styles.cellUser}>{area.malas}</Text>
              <Text style={styles.cellUser}>{area.excedente}</Text>
              <Text style={styles.cellUser}>{area.cqm}</Text>
              <Text style={styles.cellUser}>{area.muestras}</Text>
              <Text style={styles.cellUser}>{Number(area.buenas) + Number(area.malas) + Number(area.excedente) + Number(area.cqm) + Number(area.muestras)}</Text>
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
  cellUser:{
    minWidth: 120,
    paddingHorizontal: 10
  },
  button: {
    backgroundColor: '#0038A8',
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