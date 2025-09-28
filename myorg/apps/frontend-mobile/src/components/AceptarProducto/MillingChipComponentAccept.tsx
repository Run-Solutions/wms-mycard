// myorg/apps/frontend-mobile/src/components/AceptarProducto/ColorEdgeComponentAccept.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {
  acceptWorkOrderFlowAfterCorte,
  registrarInconformidadAuditory,
} from '../../api/aceptarProducto';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import WorkOrderInfo from './util/WorkOrderInfo';
import { computeAreaDefaults, areaKeyById } from './util/helper';

type MillinChipData = {
  good_quantity: number | string;
  bad_quantity: number | string;
  excess_quantity: number | string;
  sample_quantity: string;
  auditor: string;
  comments: string;
};
interface PartialRelease {
  area: string;
  quantity: string;
  bad_quantity: string;
  excess_quantity: string;
  observation: string;
  validated: boolean;
}

const MillingChipComponentAccept: React.FC<{ workOrder: any }> = ({
  workOrder,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState('');
  const [defaultValues, setDefaultValues] = useState<MillinChipData>({
    good_quantity: '',
    bad_quantity: '',
    excess_quantity: '',
    sample_quantity: '',
    auditor: '',
    comments: '',
  });

  console.log('El mismo workOrder (workOrder)', workOrder);
  const flowList = [...workOrder.workOrder.flow];
  // Índice del flow actual basado en su id
  const currentIndex = flowList.findIndex((item) => item.id === workOrder.id);
  console.log('el currentIndex', currentIndex);
  // Flow actual
  const currentFlow = currentIndex !== -1 ? flowList[currentIndex] : null;
  // Anterior (si hay)
  const lastCompletedOrPartial =
    currentIndex > 0 ? flowList[currentIndex - 1] : null;
  // Siguiente (si hay)
  const nextFlow =
    currentIndex !== -1 && currentIndex < flowList.length - 1
      ? flowList[currentIndex + 1]
      : null;
  console.log('El flujo actual (currentFlow)', currentFlow);
  console.log('El siguiente flujo (nextFlow)', nextFlow);
  console.log('Ultimo parcial o completado', lastCompletedOrPartial);

  const isAcceptDisabled = () =>
    lastCompletedOrPartial.status === 'Enviado a CQM' ||
    lastCompletedOrPartial.status === 'En Inconformidad CQM' ||
    lastCompletedOrPartial.status === 'En inconformidad auditoria' ||
    lastCompletedOrPartial.status === 'Enviado a auditoria parcial' ||
    lastCompletedOrPartial.status === 'Enviado a Auditoria' ||
    lastCompletedOrPartial.status === 'En auditoria' ||
    lastCompletedOrPartial.status === 'En Calidad';

  useEffect(() => {
    const areaKey = areaKeyById[9];
    const vals = computeAreaDefaults<MillinChipData>(
      areaKey,
      lastCompletedOrPartial
    );
    console.log('Vals', vals);
    if (vals) setDefaultValues(vals);
  }, [workOrder, lastCompletedOrPartial]);

  const handleAceptar = async () => {
    try {
      await acceptWorkOrderFlowAfterCorte(workOrder.id);
      Alert.alert('Recepción aceptada');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo aceptar la orden');
    }
  };

  const handleInconformidad = async () => {
    if (!inconformidad.trim()) {
      Alert.alert('Por favor describe la inconformidad.');
      return;
    }
    try {
      await registrarInconformidadAuditory(
        lastCompletedOrPartial?.id,
        inconformidad
      );
      Alert.alert('Inconformidad registrada');
      setShowInconformidad(false);
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error al enviar inconformidad');
    }
  };

  const isAcceptButtonDisabled = isAcceptDisabled();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Área: {workOrder.area.name}</Text>
      <WorkOrderInfo
        workOrder={workOrder}
        lastCompletedOrPartial={lastCompletedOrPartial}
        defaultValues={defaultValues}
      />

      <Text style={styles.subtitle}>Buenas:</Text>
      <Text style={styles.input}>{defaultValues.good_quantity}</Text>

      <Text style={styles.subtitle}>Excedente:</Text>
      <Text style={styles.input}>{defaultValues.excess_quantity}</Text>

      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[
            styles.incoButton,
            isAcceptButtonDisabled && styles.disabledButton,
          ]}
          onPress={() => setShowInconformidad(true)}
          disabled={isAcceptDisabled()}
        >
          <Text style={styles.buttonText}>Inconformidad</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.acceptButton,
            isAcceptButtonDisabled && styles.disabledButton,
          ]}
          onPress={() => setShowConfirm(true)}
          disabled={isAcceptDisabled()}
        >
          <Text style={styles.buttonText}>Aceptar recepción de producto</Text>
        </TouchableOpacity>
      </View>
      {/* Modal confirmación */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              ¿Deseas aceptar la recepción del producto?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAceptar}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal inconformidad */}
      <Modal visible={showInconformidad} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>Describe la inconformidad:</Text>
            <TextInput
              value={inconformidad}
              onChangeText={setInconformidad}
              placeholder="Escribe la inconformidad..."
              multiline
              theme={{ roundness: 30 }}
              mode="outlined"
              activeOutlineColor="#000"
              style={styles.textarea}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowInconformidad(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleInconformidad}
              >
                <Text style={styles.modalButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default MillingChipComponentAccept;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 8,
    backgroundColor: '#fdfaf6',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF', // gris como en web
    opacity: 0.7,
  },
  title: {
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
    borderRadius: 18,
    marginBottom: 24,
    elevation: 3,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    color: '#374151',
  },
  value: { marginBottom: 6 },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    height: 50,
    fontSize: 16,
    textAlignVertical: 'center',
  },
  textarea: {
    backgroundColor: '#fff',
    padding: 12,
    textAlignVertical: 'top',
    height: 100,
  },
  acceptButton: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  incoButton: {
    backgroundColor: '#A9A9A9',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '85%',
  },
  modalText: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#A9A9A9',
    padding: 10,
    borderRadius: 18,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#0038A8',
    padding: 10,
    borderRadius: 18,
    flex: 1,
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
