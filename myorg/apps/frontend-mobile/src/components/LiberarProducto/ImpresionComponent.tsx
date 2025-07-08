import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  submitToCQMImpression,
  releaseProductFromImpress,
} from '../../api/liberarProducto';
import { useAuth } from '../../contexts/AuthContext';
import { calcularCantidadPorLiberar } from './util/calcularCantidadPorLiberar';

interface PartialRelease {
  validated: boolean;
  quantity: number;
}
const ImpresionComponent = ({ workOrder }: { workOrder: any }) => {
  console.log('Order', workOrder);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sampleQuantity, setSampleQuantity] = useState<string>('0');
  const [comments, setComments] = useState('');
  const [showCqmModal, setShowCqmModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [checkedFrente, setCheckedFrente] = useState<number[]>([]);
  const [checkedVuelta, setCheckedVuelta] = useState<number[]>([]);
  const [showQuality, setShowQuality] = useState<boolean>(false);

  const questions =
    workOrder.area.formQuestions?.filter((q: any) => q.role_id === null) || [];
  const qualityQuestions =
    workOrder.area.formQuestions?.filter((q: any) => q.role_id === 3) || [];
  const isDisabled = workOrder.status === 'En proceso';

  const { user } = useAuth();
  const currentUserId = user?.sub;
  console.log('El mismo workOrder (workOrder)', workOrder);
  const flowList = [...workOrder.workOrder.flow];
  const currentFlow = workOrder.workOrder.flow.find(
    (f: any) =>
      f.area_id === workOrder.area.id &&
      [
        'Pendiente',
        'En proceso',
        'Parcial',
        'Pendiente parcial',
        'Listo',
        'Enviado a CQM',
        'En Calidad',
      ].includes(f.status) &&
      f.user?.id === currentUserId
  );

  if (!currentFlow) {
    Alert.alert('No tienes una orden activa para esta área.');
    return;
  }
  const currentIndex = flowList.findIndex(
    (item) => item.id === currentFlow?.id
  );
  console.log('el currentIndex', currentIndex);
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

  const allParcialsValidated = currentFlow.partialReleases?.every(
    (r: PartialRelease) => r.validated
  );

  const sampleQuantityNumber = Number(sampleQuantity);
  const tarjetasporliberar = !isNaN(sampleQuantityNumber)
    ? sampleQuantityNumber * 24
    : 0;

  const enviarACQM = async () => {
    const numValue = Number(sampleQuantity);
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0) {
      Alert.alert('Cantidad de muestra inválida');
      return;
    }
    const isFrenteVueltaValid =
      checkedFrente.length > 0 || checkedVuelta.length > 0;
    if (!questions.length || !isFrenteVueltaValid) {
      Alert.alert('Completa todas las preguntas y cantidad de muestra.');
      return;
    }

    const payload = {
      question_id: questions.map((q: any) => q.id),
      work_order_flow_id: currentFlow.id,
      work_order_id: currentFlow.workOrder.id,
      area_id: currentFlow.area.id,
      frente: questions.map((q: any) => checkedFrente.includes(q.id)),
      vuelta: questions.map((q: any) => checkedVuelta.includes(q.id)),
      reviewed: false,
      user_id: currentFlow.assigned_user,
      sample_quantity: Number(sampleQuantity),
    };

    try {
      await submitToCQMImpression(payload);
      Alert.alert('Formulario enviado a CQM');
      navigation.navigate('liberarProducto');
      setShowCqmModal(false);
    } catch (err) {
      Alert.alert('Error al Enviar a Calidad/CQM.');
    }
  };

  const liberarProducto = async () => {
    const numValue = Number(sampleQuantity);
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0) {
      Alert.alert('Cantidad de muestra inválida');
      return;
    }
    const payload = {
      workOrderId: workOrder.workOrder.id,
      workOrderFlowId: currentFlow.id,
      areaId: workOrder.area.id,
      assignedUser: currentFlow.assigned_user,
      releaseQuantity: Number(tarjetasporliberar),
      comments,
      formAnswerId: currentFlow.answers?.[0]?.id,
    };

    try {
      await releaseProductFromImpress(payload);
      setShowConfirm(false);
      Alert.alert('Producto liberado correctamente');
      navigation.navigate('liberarProducto');
    } catch (err) {
      Alert.alert('Error del servidor al liberar.');
    }
  };

  const cantidadEntregadaLabel = lastCompletedOrPartial.areaResponse
    ? 'Cantidad entregada (TARJETAS):'
    : lastCompletedOrPartial.partialReleases?.some(
        (r: PartialRelease) => r.validated
      )
    ? 'Cantidad entregada validada (TARJETAS):'
    : 'Cantidad faltante por liberar (TARJETAS):';

  const cantidadEntregadaLabelKits = lastCompletedOrPartial.areaResponse
    ? 'Cantidad entregada (KITS):'
    : lastCompletedOrPartial.partialReleases?.some(
        (r: PartialRelease) => r.validated
      )
    ? 'Cantidad entregada validada (KITS):'
    : 'Cantidad faltante por liberar (KITS):';

  const cantidadEntregadaValue = lastCompletedOrPartial.areaResponse
    ? // Mostrar cantidad según sub-área disponible
      lastCompletedOrPartial.areaResponse.prepress?.plates ??
      lastCompletedOrPartial.areaResponse.impression?.release_quantity ??
      lastCompletedOrPartial.areaResponse.serigrafia?.release_quantity ??
      lastCompletedOrPartial.areaResponse.empalme?.release_quantity ??
      lastCompletedOrPartial.areaResponse.laminacion?.release_quantity ??
      lastCompletedOrPartial.areaResponse.corte?.good_quantity ??
      lastCompletedOrPartial.areaResponse.colorEdge?.good_quantity ??
      lastCompletedOrPartial.areaResponse.hotStamping?.good_quantity ??
      lastCompletedOrPartial.areaResponse.millingChip?.good_quantity ??
      lastCompletedOrPartial.areaResponse.personalizacion?.good_quantity ??
      'Sin cantidad'
    : lastCompletedOrPartial.partialReleases?.some(
        (r: PartialRelease) => r.validated
      )
    ? lastCompletedOrPartial.partialReleases
        .filter((release: PartialRelease) => release.validated)
        .reduce(
          (sum: number, release: PartialRelease) => sum + release.quantity,
          0
        )
    : (lastCompletedOrPartial.workOrder?.quantity ?? 0) -
      (lastCompletedOrPartial.partialReleases?.reduce(
        (sum: number, release: PartialRelease) => sum + release.quantity,
        0
      ) ?? 0);

  const cantidadporliberar = calcularCantidadPorLiberar(
    currentFlow,
    lastCompletedOrPartial
  );
  console.log('Cantidad final por liberar:', cantidadporliberar);

  const shouldDisableLiberar = () => {
    const currentInvalidStatuses = [
      'Enviado a CQM',
      'En Calidad',
      'Parcial',
      'En proceso',
    ];
    const nextInvalidStatuses = [
      'Enviado a CQM',
      'Listo',
      'En Calidad',
      'Pendiente parcial',
    ];

    const isCurrentInvalid = currentInvalidStatuses.includes(
      currentFlow.status?.trim()
    );
    const isNextInvalid = nextInvalidStatuses.includes(
      nextFlow?.status?.trim()
    );
    const isNextInvalidAndNotValidated =
      nextInvalidStatuses.includes(nextFlow?.status?.trim()) &&
      !allParcialsValidated;

    return (
      isDisabled ||
      isCurrentInvalid ||
      isNextInvalidAndNotValidated ||
      isNextInvalid
    );
  };
  const shouldDisableCQM = () => {
    const estadosBloqueados = ['Enviado a CQM', 'En Calidad', 'Listo'];
    const isDisabled = estadosBloqueados.includes(currentFlow.status);
    return isDisabled || Number(cantidadporliberar) === 0;
  };
  const disableLiberarButton = shouldDisableLiberar();
  const disableLiberarCQM = shouldDisableCQM();

  const isListo = currentFlow.status === 'Listo';

  const cantidadHojasRaw = Number(workOrder?.workOrder.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;

  const toggleCheckbox = (
    id: number,
    target: number[],
    setter: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    setter(
      target.includes(id) ? target.filter((i) => i !== id) : [...target, id]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Área: Impresión</Text>

      <View style={styles.cardDetail}>
        <Text style={styles.labelDetail}>
          Cantidad (KITS):
          <Text style={styles.valueDetail}> {cantidadHojas}</Text>
        </Text>
        <Text style={styles.labelDetail}>
          Área que lo envía:
          <Text style={styles.valueDetail}>
            {' '}
            {lastCompletedOrPartial.area.name}
          </Text>
        </Text>
        <Text style={styles.labelDetail}>
          Usuario del área previa:
          <Text style={styles.valueDetail}>
            {lastCompletedOrPartial.user.username}
          </Text>
        </Text>
        <Text style={styles.labelDetail}>
          {cantidadEntregadaLabel}
          <Text style={styles.valueDetail}> {cantidadEntregadaValue}</Text>
        </Text>
        <Text style={styles.labelDetail}>
          {cantidadEntregadaLabelKits}
          <Text style={styles.valueDetail}>
            {' '}
            {Math.ceil(cantidadEntregadaValue / 24)}
          </Text>
        </Text>

        {workOrder?.partialReleases?.length > 0 && (
          <>
            <Text style={styles.labelDetail}>
              Cantidad por Liberar (TARJETAS):
              <Text style={styles.valueDetail}>{cantidadporliberar}</Text>
            </Text>
            <Text style={styles.labelDetail}>
              Cantidad por Liberar (KITS):
              <Text style={styles.valueDetail}>
                {' '}
                {Math.ceil(cantidadporliberar / 24)}
              </Text>
            </Text>
          </>
        )}
      </View>

      <Text style={styles.label}>Cantidad a liberar (KITS):</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        keyboardType="numeric"
        placeholder="Ej: 100"
        value={sampleQuantity.toString()}
        onChangeText={(text) => setSampleQuantity(text)}
      />

      <Text style={styles.label}>Cantidad a liberar (TARJETAS):</Text>
      <TextInput
        style={styles.inputDisabled}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        keyboardType="numeric"
        placeholder="Ej: 100"
        value={tarjetasporliberar.toString()}
        editable={false}
        selectTextOnFocus={false}
      />

      <Text style={styles.label}>Comentarios:</Text>
      <TextInput
        style={styles.textarea}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        multiline
        placeholder="Agrega comentarios..."
        value={comments}
        onChangeText={setComments}
      />

      <TouchableOpacity
        style={[
          styles.button,
          disableLiberarCQM && styles.disabledButton,
          isListo && styles.greenDisabledButton,
        ]}
        onPress={() => !disableLiberarCQM && setShowCqmModal(true)}
        disabled={disableLiberarCQM}
      >
        <Text style={styles.buttonText}>Enviar a Calidad/CQM</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.buttonSecondary,
          disableLiberarButton && styles.disabledButton,
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
            <Text style={styles.modalTitle}>
              Preguntas del Área: {workOrder.area.name}
            </Text>

            {/* Encabezado estilo tabla */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
              <Text style={styles.tableCell}>Frente</Text>
              <Text style={styles.tableCell}>Vuelta</Text>
            </View>

            {/* Preguntas normales */}
            {questions.map((q: any) => (
              <View key={q.id} style={styles.tableRow}>
                {/* Pregunta */}
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.questionText}>{q.title}</Text>
                </View>

                {/* Frente */}
                <View
                  style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}
                >
                  <TouchableOpacity
                    onPress={() =>
                      toggleCheckbox(q.id, checkedFrente, setCheckedFrente)
                    }
                    style={styles.radioCircle}
                  >
                    {checkedFrente.includes(q.id) && (
                      <View style={styles.radioDot} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Vuelta */}
                <View
                  style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}
                >
                  <TouchableOpacity
                    onPress={() =>
                      toggleCheckbox(q.id, checkedVuelta, setCheckedVuelta)
                    }
                    style={styles.radioCircle}
                  >
                    {checkedVuelta.includes(q.id) && (
                      <View style={styles.radioDot} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Muestras */}
            <Text style={styles.label}>Muestras:</Text>
            <TextInput
              style={styles.input}
              theme={{ roundness: 30 }}
              mode="outlined"
              activeOutlineColor="#000"
              keyboardType="numeric"
              placeholder="Ej: 2"
              value={sampleQuantity.toString()}
              onChangeText={(text) => setSampleQuantity(text)}
            />

            {/* Sección expandible de calidad */}
            <TouchableOpacity
              onPress={() => setShowQuality((prev) => !prev)}
              style={styles.toggleSection}
            >
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

                <Text style={styles.subtitle}>Tipo de Prueba</Text>
                {['color', 'perfil', 'fisica'].map((type) => (
                  <View key={type} style={styles.radioDisabled}>
                    <Text>{`Prueba ${type}`}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Botones */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCqmModal(false)}
              >
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={enviarACQM}
              >
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

export default ImpresionComponent;

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
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 30,
    fontSize: 16,
  },
  inputDisabled: {
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#e3e3e3',
    height: 30,
    fontSize: 16,
  },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    minHeight: 30,
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
    marginBottom: 50,
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
