// myorg/apps/frontend-mobile/src/components/LiberacionDeVistosBuenos/HotStampingComponent.tsx

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
  submitExtraHotStamping,
  sendInconformidadCQM,
} from '../../api/recepcionCQM';
import { OperatorAdvancedTable } from './util/FormQuestionTable';
import SelectionQuestionTable from './util/SelectionQuestionTable';

// Tipos y constantes globales
type Answer = {
  reviewed: boolean;
  sample_quantity: number;
};

const HotStampingComponent = ({ workOrder }: { workOrder: any }) => {
  // Hooks y estados
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState('');

  // Derivaciones
  const index = workOrder?.answers
    ?.map((a: Answer, i: number) => ({ ...a, index: i }))
    .reverse()
    .find((a: Answer) => a.reviewed === false)?.index;
  const revisarPosicionValue =
    workOrder?.answers[index]?.revisar_posicion ?? '';
  const imagenHologramaValue =
    workOrder?.answers[index]?.imagen_holograma ?? '';

  //Para guardar las respuestas
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<number, boolean | undefined>
  >({});

  // Listas derivadas para el componente de tabla (no se guardan aparte)
  const checkedRespuestaOK = useMemo(
    () =>
      Object.entries(answersByQuestion)
        .filter(([, v]) => v === true)
        .map(([k]) => Number(k)),
    [answersByQuestion]
  );

  const checkedRespuestaNG = useMemo(
    () =>
      Object.entries(answersByQuestion)
        .filter(([, v]) => v === false)
        .map(([k]) => Number(k)),
    [answersByQuestion]
  );

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

  const handleSubmit = async () => {
    const formAnswerId = workOrder.answers[index]?.id;
    if (!formAnswerId) {
      Alert.alert('No se encontró el Id del formulario');
      return;
    }
    const checkboxPayload = Object.entries(answersByQuestion).map(
      ([questionId, answer]) => ({
        question_id: Number(questionId),
        answer: answer === true ? true : answer === false ? false : null, // <-- boolean | null
      })
    );
    const payload = {
      form_answer_id: formAnswerId,
      checkboxes: checkboxPayload,
    };
    try {
      const success = await submitExtraHotStamping(payload);
      setShowConfirmModal(false);
      Alert.alert('Producto evaluado correctamente');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error al liberar el producto.');
    }
  };

  const handleInconformidad = async () => {
    if (!inconformidad.trim()) {
      Alert.alert('Por favor, ingresa un comentario de inconformidad.');
      return;
    }
    try {
      await sendInconformidadCQM(workOrder.id, inconformidad);
      setShowInconformidad(false);
      Alert.alert('Inconformidad enviada correctamente');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error al enviar la inconformidad.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Área a evaluar: Hot Stamping</Text>
      <View style={styles.card}>
        <Text style={styles.label}>OT:</Text>
        <Text style={styles.value}>{workOrder.workOrder.ot_id}</Text>

        <Text style={styles.label}>Id del Presupuesto:</Text>
        <Text style={styles.value}>{workOrder.workOrder.mycard_id}</Text>

        <Text style={styles.label}>Cantidad:</Text>
        <Text style={styles.value}>{workOrder.workOrder.quantity}</Text>

        <Text style={styles.label}>Operador:</Text>
        <Text style={styles.value}>{workOrder.user.username}</Text>

        <Text style={styles.label}>Comentarios:</Text>
        <Text style={styles.value}>{workOrder.workOrder.comments}</Text>
      </View>

      <Text style={styles.modalTitle}>Respuestas del operador</Text>
      <OperatorAdvancedTable
        questions={workOrder.area.formQuestions ?? []}
        answers={workOrder.answers[index]?.FormAnswerResponse ?? []}
        mode={'simple'}
        readOnly
        columns={['Respuesta']}
      />
      {/* Muestras */}
      <Text style={styles.label}>Color Foil:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        value={
          workOrder?.answers[index].color_foil ??
          'No se reconoce la muestra enviada'
        }
        editable={false}
      />
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Imagen de Holograma Vs Ot:</Text>
        <View style={styles.radioGroup}>
          {['holograma', 'foil'].map((value) => (
            <View key={value} style={styles.radioOption}>
              <View style={[styles.checkbox, { opacity: 0.5 }]}>
                {imagenHologramaValue === value ||
                imagenHologramaValue === 'hologramafoil' ? (
                  <View style={styles.checkboxChecked} />
                ) : null}
              </View>
              <Text style={[styles.radioLabel, { opacity: 0.5 }]}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Revisar Posición Vs Ot:</Text>
        <View style={styles.radioGroup}>
          {['holograma', 'foil'].map((value) => (
            <View key={value} style={styles.radioOption}>
              <View style={[styles.checkbox, { opacity: 0.5 }]}>
                {revisarPosicionValue === value ||
                revisarPosicionValue === 'hologramafoil' ? (
                  <View style={styles.checkboxChecked} />
                ) : null}
              </View>
              <Text style={[styles.radioLabel, { opacity: 0.5 }]}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={styles.label}>Muestras entregadas:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        value={
          typeof workOrder?.answers?.[index]?.sample_quantity === 'number'
            ? workOrder.answers[index].sample_quantity.toString()
            : ''
        }
        editable={false}
      />

      {typeof workOrder?.answers?.[index]?.sample_quantity !== 'number' && (
        <Text style={{ color: '#b91c1c', marginTop: 8, textAlign: 'center' }}>
          No se reconoce la muestra enviada
        </Text>
      )}

      <Text style={[styles.modalTitle, { marginTop: 40 }]}>Mis respuestas</Text>
      <SelectionQuestionTable
        formQuestions={workOrder.area.formQuestions}
        roleId={3} // Calidad
        columns={['Respuesta']}
        checkedQuestions={[{ ok: checkedRespuestaOK, ng: checkedRespuestaNG }]}
        onToggle={handleToggleRespuesta}
      />

      {/* Botones */}
      <View style={styles.modalButtonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowInconformidad(true)}
        >
          <Text style={styles.modalButtonText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => setShowConfirmModal(true)}
        >
          <Text style={styles.modalButtonText}>Aprobado</Text>
        </TouchableOpacity>
      </View>

      {/* Modal confirmación de liberación */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>¿Estás seguro/a de aprobar?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSubmit}
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
              style={styles.textarea}
              theme={{ roundness: 30 }}
              mode="outlined"
              activeOutlineColor="#000"
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

export default HotStampingComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 32,
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
  label: { fontWeight: '600', marginTop: 12, fontSize: 16 },
  value: { marginBottom: 0 },
  input: {
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 30,
    fontSize: 16,
  },
  textarea: {
    backgroundColor: '#fff',
    padding: 10,
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
    backgroundColor: '#9CA3AF',
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
    marginTop: 10,
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
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
    opacity: 0.4,
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
  radioGroup: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  radioLabel: {
    fontSize: 14,
    color: '#1f2937',
  },
  radioText: {
    fontSize: 16,
    color: '#1f2937',
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputGroup: {
    marginTop: 16,
  },
});
