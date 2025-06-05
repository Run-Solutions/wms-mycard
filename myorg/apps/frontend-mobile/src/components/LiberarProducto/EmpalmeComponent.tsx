import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { submitToCQMEmpalme, releaseProductFromEmpalme } from '../../api/liberarProducto';

interface PartialRelease {
  validated: boolean;
  quantity: number;
}
const EmpalmeComponent = ({ workOrder }: { workOrder: any }) => {
  console.log('Order', workOrder);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sampleQuantity, setSampleQuantity] = useState('');
  const [comments, setComments] = useState('');
  const [showCqmModal, setShowCqmModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [checkedQuestion, setCheckedQuestion] = useState<number[]>([]);
  const [showQuality, setShowQuality] = useState<boolean>(false);

  const questions = workOrder.area.formQuestions?.filter((q: any) => q.role_id === null) || [];
  const qualityQuestions = workOrder.area.formQuestions?.filter((q: any) => q.role_id === 3) || [];
  const isDisabled =
  workOrder.status === 'En proceso';
  
  console.log("El mismo workOrder (workOrder)", workOrder);
  const flowList = [...workOrder.workOrder.flow];
  // Índice del flow actual basado en su id
  const currentIndex = flowList.findIndex((item) => item.id === workOrder.id);
  console.log('el currentIndex', currentIndex);
  // Flow actual
  const currentFlow = currentIndex !== -1 ? flowList[currentIndex] : null;
  // Anterior (si hay)
  const lastCompletedOrPartial = currentIndex > 0 ? flowList[currentIndex - 1] : null;
  // Siguiente (si hay)
  const nextFlow = currentIndex !== -1 && currentIndex < flowList.length - 1
    ? flowList[currentIndex + 1]
    : null;
  console.log("El flujo actual (currentFlow)", currentFlow);
  console.log("El siguiente flujo (nextFlow)", nextFlow);
  console.log("Ultimo parcial o completado", lastCompletedOrPartial);

  const cantidadEntregadaLabel = lastCompletedOrPartial.areaResponse
  ? 'Cantidad entregada:'
  : lastCompletedOrPartial.partialReleases?.some((r: PartialRelease) => r.validated)
    ? 'Cantidad entregada validada:'
    : 'Cantidad faltante por liberar:';

  const cantidadEntregadaValue = lastCompletedOrPartial.areaResponse
    ? (
      lastCompletedOrPartial.areaResponse.prepress?.plates ??
      lastCompletedOrPartial.areaResponse.impression?.quantity ??
      lastCompletedOrPartial.areaResponse.serigrafia?.quantity ??
      lastCompletedOrPartial.areaResponse.empalme?.quantity ??
      lastCompletedOrPartial.areaResponse.laminacion?.quantity ??
      lastCompletedOrPartial.areaResponse.corte?.quantity ??
      lastCompletedOrPartial.areaResponse.colorEdge?.quantity ??
      lastCompletedOrPartial.areaResponse.hotStamping?.quantity ??
      lastCompletedOrPartial.areaResponse.millingChip?.quantity ??
      lastCompletedOrPartial.areaResponse.personalizacion?.quantity ??
      'Sin cantidad'
    )
    : lastCompletedOrPartial.partialReleases?.some((r: PartialRelease) => r.validated)
      ? lastCompletedOrPartial.partialReleases
          .filter((r: PartialRelease) => r.validated)
          .reduce((sum: number, r: { quantity: number }) => sum + r.quantity, 0)
      : (lastCompletedOrPartial.workOrder?.quantity ?? 0) -
        (lastCompletedOrPartial.partialReleases?.reduce((sum: number, r: { quantity: number }) => sum + r.quantity, 0) ?? 0);

  const mostrarCantidadPorLiberar =
    (workOrder?.partialReleases?.length ?? 0) > 0;

  let cantidadPorLiberar = 0;
  if (mostrarCantidadPorLiberar) {
    if (lastCompletedOrPartial.area.name === 'preprensa') {
      cantidadPorLiberar = workOrder.workOrder.quantity -
        workOrder.partialReleases.reduce((sum: number, r: {quantity: number}) => sum + r.quantity, 0);
    } else {
      const validadas = lastCompletedOrPartial.partialReleases?.filter((release: { validated: boolean, quantity: number }) => release.validated) ?? [];
      const sumaValidadas = validadas.reduce((sum: number, r: {quantity: number}) => sum + r.quantity, 0);
      const sumaParciales = workOrder.partialReleases.reduce((sum: number, r: {quantity: number}) => sum + r.quantity, 0);
      cantidadPorLiberar = validadas.length > 0
        ? (sumaValidadas - sumaParciales)
        : sumaParciales;
    }
  }

  const allParcialsValidated = workOrder.partialReleases?.every(
    (r: { validated: boolean }) => r.validated
  );

  const disableLiberarButton = 
    isDisabled ||
    ['Enviado a CQM', 'En Calidad', 'Parcial', ].includes(workOrder.status) ||
    (nextFlow && 
      ['Listo', 'Enviado a CQM', 'En calidad', 'Parcial', 'Pendiente parcial'].includes(nextFlow.status) &&
      !allParcialsValidated);
    const disableLiberarCQM = ['Enviado a CQM', 'En Calidad', 'Listo'].includes(workOrder.status);
    const isListo = workOrder.status === 'Listo';

  const toggleCheckbox = (
    id: number,
    target: number[],
    setter: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    setter(target.includes(id) ? target.filter(i => i !== id) : [...target, id]);
  };

  const enviarACQM = async () => {
    const isFrenteVueltaValid = checkedQuestion.length > 0 || checkedQuestion.length > 0;
    const isSampleValid = Number(sampleQuantity) > 0;
  
    if (!questions.length || !isFrenteVueltaValid || !isSampleValid) {
      Alert.alert('Completa todas las preguntas y cantidad de muestra.');
      return;
    }
  
    const answeredQuestions = questions.filter((q: any) =>
      checkedQuestion.includes(q.id)
    );
    
    const payload = {
      question_id: answeredQuestions.map((q: any) => q.id),
      work_order_flow_id: workOrder.id,
      work_order_id: workOrder.workOrder.id,
      area_id: workOrder.area.id,
      response: answeredQuestions.map(() => true), // todas las marcadas son true
      reviewed: false,
      user_id: workOrder.assigned_user,
      sample_quantity: Number(sampleQuantity),
    };
  
    try {
      await submitToCQMEmpalme(payload);
      Alert.alert('Formulario enviado a CQM');
      navigation.navigate('liberarProducto');
      setShowCqmModal(false);
    } catch (err) {
      Alert.alert('Error al enviar a CQM.');
    }
  };

  const liberarProducto = async () => {
    if (Number(sampleQuantity) <= 0) {
      Alert.alert('Cantidad de muestra inválida');
      return;
    }
  
    const payload = {
      workOrderId: workOrder.workOrder.id,
      workOrderFlowId: currentFlow.id,
      areaId: workOrder.area.id,
      assignedUser: currentFlow.assigned_user,
      releaseQuantity: Number(sampleQuantity),
      comments,
      formAnswerId: currentFlow.answers?.[0]?.id,
    };
  
    try {
      await releaseProductFromEmpalme(payload);
      setShowConfirm(false);
      Alert.alert('Producto liberado correctamente');
      navigation.navigate('liberarProducto')
    } catch (err) {
      Alert.alert('Error del servidor al liberar.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Área: Empalme</Text>

      <View style={styles.cardDetail}>
        <Text style={styles.labelDetail}>Área que lo envía: 
          <Text style={styles.valueDetail}> {lastCompletedOrPartial.area.name}</Text>
        </Text>
        <Text style={styles.labelDetail}>
          Usuario del área previa: <Text style={styles.valueDetail}>{lastCompletedOrPartial.user.username}</Text>
        </Text>
        <Text style={styles.labelDetail}>
          {cantidadEntregadaLabel}
        <Text style={styles.valueDetail}> {cantidadEntregadaValue}</Text>
        </Text>
      
        {mostrarCantidadPorLiberar && (
          <Text style={styles.labelDetail}>
            Cantidad por Liberar:
            <Text style={styles.valueDetail}> {cantidadPorLiberar}</Text>
          </Text>
        )}
      </View>

      <Text style={styles.label}>Cantidad a liberar:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Ej: 100"
        value={sampleQuantity}
        onChangeText={setSampleQuantity}
      />

      <Text style={styles.label}>Comentarios:</Text>
      <TextInput
        style={styles.textarea}
        multiline
        placeholder="Agrega comentarios..."
        value={comments}
        onChangeText={setComments}
      />

      <TouchableOpacity
        style={[
          styles.button,
          disableLiberarCQM && styles.disabledButton,
          isListo && styles.greenDisabledButton
        ]}
        onPress={() => !disableLiberarCQM && setShowCqmModal(true)}
        disabled={disableLiberarCQM}
      >
        <Text style={styles.buttonText}>Enviar a CQM</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.buttonSecondary,
          disableLiberarButton && styles.disabledButton
        ]}
        onPress={() => !disableLiberarButton && setShowConfirm(true)}
        disabled={disableLiberarButton}
      >
        <Text style={styles.buttonText}>Liberar Producto</Text>
      </TouchableOpacity>

      {/* Modal CQM */}
      <Modal visible={showCqmModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#fdfaf6' }}>
        <ScrollView contentContainerStyle={styles.modalScrollContent}>
          <Text style={styles.modalTitle}>Preguntas del Área: {workOrder.area.name}</Text>

          {/* Encabezado estilo tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
            <Text style={styles.tableCell}>Respuesta</Text>
          </View>

          {/* Preguntas normales */}
          {questions.map((q: any) => (
            <View key={q.id} style={styles.tableRow}>
            {/* Pregunta */}
            <View style={[styles.tableCell, { flex: 2 }]}>
              <Text style={styles.questionText}>{q.title}</Text>
            </View>
          
           {/* Respuesta */}
            <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
              <TouchableOpacity
                onPress={() => toggleCheckbox(q.id, checkedQuestion, setCheckedQuestion)}
                style={styles.radioCircle}
              >
                {checkedQuestion.includes(q.id) && <View style={styles.radioDot} />}
              </TouchableOpacity>
            </View>
          </View>
          ))}

          {/* Muestras */}
          <Text style={styles.label}>Muestras:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej: 2"
            value={sampleQuantity}
            onChangeText={setSampleQuantity}
          />

          {/* Sección expandible de calidad */}
          <TouchableOpacity onPress={() => setShowQuality(prev => !prev)} style={styles.toggleSection}>
            <Text style={styles.subtitle}>
              Preguntas de Calidad {showQuality ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {showQuality && (
            <>
              {qualityQuestions.map((q: any) => (
                <View key={q.id} style={styles.qualityRow}>
                  <Text style={styles.qualityQuestion}>{q.title}</Text>
                </View>
              ))}
            </>
          )}

          {/* Botones */}
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCqmModal(false)}>
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={enviarACQM}>
              <Text style={styles.modalButtonText}>Enviar Respuestas</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </View>
      </Modal>

      {/* Modal confirmación de liberación */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>¿Deseas liberar este producto?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={liberarProducto}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default EmpalmeComponent;

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
    marginBottom: 16,
    textAlign: 'center',
    color: 'black',
    padding: Platform.OS === 'ios' ? 10 : 0,
  },
  subtitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginTop: 20,
    marginBottom: 12,
  },
  label: { fontWeight: '600', marginTop: 12, fontSize: 16, marginBottom: 8 },
  labelDetail: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  value: { marginBottom: 8 },
  valueDetail: {
    fontWeight: 'normal',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 18,
    padding: 10,
    backgroundColor: '#fff',
    height: 50,
    fontSize: 16,
  },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    elevation: 3,
  },
  cardDetail: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  button: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 'auto',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
  buttonSecondary: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    padding: 20,
    paddingTop: 80, // mejor control que marginTop
  },
  questionText: {
    fontSize: 15,
    color: '#1f2937',
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
    backgroundColor: '#A9A9A9',
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
  scrollArea: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    marginTop: 60,
    backgroundColor: '#fdfaf6',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
  questionGroup: {
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  checkbox: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
  },
  checkedBox: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  checkboxText: {
    fontSize: 14,
    color: '#111827',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF', // gris como en web
    opacity: 0.7,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  checkboxBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  toggleSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  qualityRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  qualityQuestion: {
    fontSize: 14,
    color: '#374151',
  },
  radioDisabled: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  greenDisabledButton: {
    backgroundColor: '#4CAF50', 
    opacity: 1, 
  },
});