import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { liberarWorkOrderAuditory } from '../../api/cerrarOrdenDeTrabajo';

const HotStampingComponent: React.FC<{ workOrder: any }> = ({ workOrder }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showConfirm, setShowConfirm] = useState(false);

  const isDisabled = workOrder.status === 'En proceso';

  const getAreaData = (areaId: number, areaResponse: any) => {
    switch(areaId) {
      case 6: return extractData(areaResponse?.corte);
      case 7: return extractData(areaResponse?.colorEdge);
      case 8: return extractData(areaResponse?.hotStamping);
      case 9: return extractData(areaResponse?.millingChip);
      case 10: return extractData(areaResponse?.personalizacion);
      default: return emptyData();
    }
  };

  const extractData = (area: any) => ({
    buenas: area?.good_quantity || 0,
    malas: area?.bad_quantity || 0,
    excedente: area?.excess_quantity || 0,
    cqm: area?.form_answer?.sample_quantity || 0,
    muestras: area?.formAuditory?.sample_auditory || 0,
  });

  const emptyData = () => ({
    buenas: 0, malas: 0, excedente: 0, cqm: 0, muestras: 0
  });

  const areas = workOrder.workOrder?.flow?.filter((f: any) => f.area_id >= 6).map((item: any) => {
    const data = getAreaData(item.area_id, item.areaResponse);
    return {
      name: item.area?.name || 'Sin nombre',
      ...data,
    };
  }) || [];

  const handleLiberar = async () => {
    try {
      const payload = {
        workOrderFlowId: workOrder.id,
        workOrderId: workOrder.work_order_id,
      };
      await liberarWorkOrderAuditory(payload);
      Alert.alert('Éxito', 'Producto liberado correctamente');
      navigation.navigate('cerrarOrdenDeTrabajo');
    } catch (error: any) {
      console.error('Error al liberar:', error?.response?.data || error.message);
      Alert.alert('Error', 'No se pudo liberar el producto');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Liberar Orden de Trabajo</Text>

      <View style={styles.card}>
        <Text style={styles.label}>OT:</Text>
        <Text>{workOrder.workOrder.ot_id}</Text>

        <Text style={styles.label}>Presupuesto:</Text>
        <Text>{workOrder.workOrder.mycard_id}</Text>

        <Text style={styles.label}>Cantidad:</Text>
        <Text>{workOrder.workOrder.quantity}</Text>
      </View>

      <Text style={styles.sectionTitle}>Datos de Producción</Text>

      <View style={styles.table}>
        {['Buenas', 'Malas', 'Excedente', 'CQM', 'Muestras', 'Total'].map((label, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.cellTitle}>{label}</Text>
            {areas.map((area: any, j: number) => {
              const val = label === 'Total'
                ? Number(area.buenas) + Number(area.malas) + Number(area.excedente) + Number(area.muestras)
                : area[label.toLowerCase()] || 0;
              return <Text style={styles.cell} key={j}>{val}</Text>;
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.liberarButton, isDisabled && styles.disabled]}
        disabled={isDisabled}
        onPress={() => setShowConfirm(true)}
      >
        <Text style={styles.buttonText}>Liberar Producto</Text>
      </TouchableOpacity>

      {/* Modal Confirmación */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>¿Estás segura/o que deseas liberar este producto?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirm(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleLiberar}>
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default HotStampingComponent;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fdfaf6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    padding: Platform.OS === 'ios' ? 12 : 0,
    color: '#111',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
  },
  label: {
    fontWeight: '600',
    marginTop: 4,
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111',
  },
  table: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 6,
  },
  cellTitle: {
    flex: 1.5,
    fontWeight: 'bold',
    color: '#333',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
  },
  liberarButton: {
    backgroundColor: '#0038A8',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: '#9CA3AF',
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
    padding: 24,
    borderRadius: 12,
    width: '85%',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#A9A9A9',
    padding: 10,
    borderRadius: 12,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#0038A8',
    padding: 10,
    borderRadius: 12,
    flex: 1,
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

