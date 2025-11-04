import React, { useState, useMemo } from 'react';
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
  submitToCQMEmpalme,
  releaseProductFromEmpalme,
} from '../../api/liberarProducto';
import { useAuth } from '../../contexts/AuthContext';
import { calcularCantidadPorLiberar } from './util/calcularCantidadPorLiberar';
import SelectionQuestionTable from './util/FormQuestionTable';
import { WorkOrderHojasInfo } from './util/WorkOrderInfo';
import { usePartialReleaseControls } from './util/disablePartialTime';

interface PartialRelease {
  validated: boolean;
  quantity: number;
}
const EmpalmeComponent = ({ workOrder }: { workOrder: any }) => {
  console.log('Order', workOrder);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sampleQuantity, setSampleQuantity] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState('');
  const [showCqmModal, setShowCqmModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQuality, setShowQuality] = useState<boolean>(false);

  const isDisabled = workOrder.status === 'En proceso';
  // Una sola fuente de verdad: por pregunta guarda true (OK), false (NG) o undefined (sin respuesta)
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<number, boolean | undefined>
  >({});

  // Preguntas visibles en la tabla (mismo filtro que pasas al child con roleId=null)
  const visibleQuestions =
    workOrder.area.formQuestions?.filter((q: any) => q.role_id === null) ?? [];

  // Listas derivadas para el componente de tabla (no se guardan aparte)
  const checkedRespuestaOK = useMemo(
    () =>
      visibleQuestions
        .filter((q: any) => answersByQuestion[q.id] === true)
        .map((q: any) => q.id),
    [visibleQuestions, answersByQuestion]
  );

  const checkedRespuestaNG = useMemo(
    () =>
      visibleQuestions
        .filter((q: any) => answersByQuestion[q.id] === false)
        .map((q: any) => q.id),
    [visibleQuestions, answersByQuestion]
  );

  console.log('El mismo workOrder (workOrder)', workOrder);
  const { user } = useAuth();
  const currentUserId = user?.sub;
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
    alert('No tienes una orden activa para esta área.');
    return;
  }
  const allParcialsValidated = currentFlow.partialReleases?.every(
    (r: PartialRelease) => r.validated
  );
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
  const cantidadporliberar = calcularCantidadPorLiberar(
    currentFlow,
    lastCompletedOrPartial
  );
  console.log('Cantidad final por liberar:', cantidadporliberar);
  const statusesToCheck = [
    currentFlow?.status,
    nextFlow?.status,
    lastCompletedOrPartial?.status,
  ];
  const { disableCQM, disablePartial, cooldown } = usePartialReleaseControls({
    flow: currentFlow,
    cantidadPorLiberar: cantidadporliberar,
    withCountdown: true,

    // 🔎 acá decides contra qué comparar:
    statusesToCheck, // revisa current + next + last
    blockedForCQM: [
      'Enviado a CQM',
      'En Calidad',
      'Listo',
      'Pendiente parcial',
    ],
    blockedForCQM_AfterCorte: [
      'Enviado a CQM',
      'En Calidad',
      'Listo',
      'Pendiente',
      'Pendiente parcial',
      'Enviado a auditoria parcial',
      'En inconformidad CQM',
      'Enviado a Auditoria',
    ],
  });
  const shouldDisableCQM = () => disableCQM;
  const shouldDisableLiberar = () => {
    // 1) Detectar si CQM está bloqueado SOLO por cooldown (<24h y sin otras razones)
    const estadosBloqueadosCQM = ['Enviado a CQM', 'En Calidad', 'Listo'];
    const estadosBloqueadosNext = ['Pendiente parcial'];

    const byStatusCQM = estadosBloqueadosCQM.includes(
      currentFlow.status?.trim?.() ?? ''
    );
    const byNextCQM = estadosBloqueadosNext.includes(
      nextFlow?.status?.trim?.() ?? ''
    );
    const byCantidad = Number(cantidadporliberar) === 0;

    // cooldown aplica solo si NO hay areaResponse
    const byCooldown = !currentFlow.areaResponse && !!cooldown?.isLocked;

    const cqmBloqueadoSoloPorTiempo =
      byCooldown && !byStatusCQM && !byNextCQM && !byCantidad;

    // 👉 Regla pedida: si CQM está bloqueado SOLO por tiempo, habilitamos "Liberación parcial"
    if (cqmBloqueadoSoloPorTiempo) {
      return false; // NO deshabilitar el botón de liberar parcial
    }

    // 2) Si no es el caso anterior, aplicamos tus reglas + base del hook para parciales
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
      'Enviado a auditoria parcial',
      'En inconformidad CQM',
    ];

    const isCurrentInvalid = currentInvalidStatuses.includes(
      currentFlow.status?.trim?.() ?? ''
    );
    const isNextInvalid = nextInvalidStatuses.includes(
      nextFlow?.status?.trim?.() ?? ''
    );
    const isNextInvalidAndNotValidated =
      nextInvalidStatuses.includes(nextFlow?.status?.trim?.() ?? '') &&
      !allParcialsValidated;

    // disablePartial (del hook) bloquea por cantidad=0 o estados finales
    return (
      disablePartial ||
      isDisabled ||
      isCurrentInvalid ||
      isNextInvalidAndNotValidated ||
      isNextInvalid
    );
  };
  const sampleQuantityNumber = Number(sampleQuantity);
  const tarjetasporliberar = !isNaN(sampleQuantityNumber)
    ? sampleQuantityNumber * 24
    : 0;

  const handleSubmit = async () => {
    const numValue = Number(sampleQuantity);
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0) {
      Alert.alert('Cantidad de muestra inválida');
      return;
    }
    // Construir arrays Alineados según el ORDEN de visibleQuestions
    const question_id: number[] = [];
    const response: boolean[] = [];
    visibleQuestions.forEach((q: any) => {
      const ans = answersByQuestion[q.id];
      if (ans !== undefined) {
        question_id.push(q.id);
        response.push(!!ans);
      }
    });

    // Exigir todas respondidas (o ajusta a tu regla)
    if (question_id.length !== visibleQuestions.length) {
      Alert.alert('Completa todas las preguntas y cantidad de muestra.');
      return;
    }
    const payload = {
      question_id,
      work_order_flow_id: currentFlow.id,
      work_order_id: currentFlow.workOrder.id,
      area_id: currentFlow.area.id,
      response, // todas las marcadas son true
      reviewed: false,
      user_id: currentFlow.assigned_user,
      sample_quantity: Number(sampleQuantity),
    };
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitToCQMEmpalme(payload);
      Alert.alert('Formulario enviado a CQM');
      navigation.navigate('liberarProducto');
      setShowCqmModal(false);
    } catch (err) {
      Alert.alert('Error al Enviar a Calidad/CQM.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmpalmeSubmit = async () => {
    const numValue = Number(sampleQuantity);
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0) {
      Alert.alert('Cantidad de muestra inválida');
      return;
    }
    if (isSubmitting) return; // evita doble clic
    setIsSubmitting(true);
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
      await releaseProductFromEmpalme(payload);
      setShowConfirm(false);
      Alert.alert('Producto liberado correctamente');
      navigation.navigate('liberarProducto');
    } catch (err) {
      Alert.alert('Error del servidor al liberar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRespuesta = (
    questionId: number,
    _columnIndex: number,
    type: 'ok' | 'ng',
    checked: boolean
  ) => {
    setAnswersByQuestion((prev) => {
      const next = { ...prev };
      if (checked) {
        // marcar OK => true, NG => false (exclusivo)
        next[questionId] = type === 'ok';
      } else {
        // si desmarcan la opción activa, borramos la respuesta
        if (
          (type === 'ok' && next[questionId] === true) ||
          (type === 'ng' && next[questionId] === false)
        ) {
          delete next[questionId];
        }
      }
      return next;
    });
  };

  const disableLiberarButton = shouldDisableLiberar();
  const disableLiberarCQM = shouldDisableCQM();
  const isListo = currentFlow.status === 'Listo';

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
      <Text style={styles.title}>
        Área: Empalme {workOrder.workOrder.isCollator ? '(Collator)' : ''}
      </Text>

      <WorkOrderHojasInfo
        workOrder={workOrder}
        lastCompletedOrPartial={lastCompletedOrPartial}
        cantidadporliberar={cantidadporliberar}
      />

      <Text style={styles.label}>
        Cantidad a liberar (Hojas Frente / Hojas Vuelta):
      </Text>
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

            <SelectionQuestionTable
              formQuestions={workOrder.area.formQuestions}
              roleId={null}
              columns={['Respuesta']}
              checkedQuestions={[
                { ok: checkedRespuestaOK, ng: checkedRespuestaNG },
              ]}
              onToggle={handleToggleRespuesta}
            />

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
                <SelectionQuestionTable
                  formQuestions={workOrder.area.formQuestions}
                  roleId={3}
                  columns={['Respuesta']}
                  checkedQuestions={[
                    { ok: checkedRespuestaOK, ng: checkedRespuestaNG },
                  ]}
                  readOnly={true}
                  onToggle={handleToggleRespuesta}
                />
                <Text style={styles.label}>Validar Inlays Vs OT:</Text>
                <TextInput
                  style={styles.input}
                  theme={{ roundness: 30 }}
                  mode="outlined"
                  activeOutlineColor="#000"
                  editable={false}
                />

                <Text style={styles.label}>Tipo de banda magnética:</Text>
                <View style={styles.radioGroup}>
                  <View>
                    <Text>◯ Hico</Text>
                    <Text>◯ Loco</Text>
                  </View>
                  <View>
                    <Text>◯ 2 Tracks</Text>
                    <Text>◯ 3 Tracks</Text>
                  </View>
                </View>
                <Text style={styles.label}>Color:</Text>
                <TextInput
                  style={styles.input}
                  theme={{ roundness: 30 }}
                  mode="outlined"
                  activeOutlineColor="#000"
                  editable={false}
                />

                <Text style={styles.label}>Tipo de Holográfico:</Text>
                <TextInput
                  style={styles.input}
                  theme={{ roundness: 30 }}
                  mode="outlined"
                  activeOutlineColor="#000"
                  editable={false}
                />
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
                onPress={handleSubmit}
              >
                <Text style={styles.modalButtonText}>
                  {isSubmitting ? 'Enviando...' : 'Enviar Respuestas'}
                </Text>
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
                onPress={handleEmpalmeSubmit}
              >
                <Text style={styles.modalButtonText}>
                  {isSubmitting ? 'Liberando...' : 'Confirmar'}
                </Text>
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
  radioGroup: {
    width: '65%',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
