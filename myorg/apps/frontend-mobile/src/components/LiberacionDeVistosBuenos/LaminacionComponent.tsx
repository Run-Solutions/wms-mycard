// myorg/apps/frontend-mobile/src/components/LiberacionDeVistosBuenos/LaminacionComponent.tsx
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
  submitExtraLaminacion,
  sendInconformidadCQM,
} from '../../api/recepcionCQM';
import { OperatorAdvancedTable } from './util/FormQuestionTable';
import SelectionQuestionTable from './util/SelectionQuestionTable';

// Tipos
type Answer = {
  reviewed: boolean;
  sample_quantity: number;
};

const LaminacionComponent = ({ workOrder }: { workOrder: any }) => {
  // Navegación
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Modales y campos
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState('');

  // --- NUEVO: pruebas (igual que en web)
  const [pruebaOver, setPruebaOver] = useState<string>('');
  const [pruebaCintaMagnetica, setPruebaCintaMagnetica] = useState<string>('');
  const [pruebaCentro, setPruebaCentro] = useState<string>('');

  // --- NUEVO: modal / código de excepción (igual que en web)
  const [showCodigoModal, setShowCodigoModal] = useState(false);
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const CODIGO_VALIDO = 'a7F9K3n1#';

  // Helpers
  const parseNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Último FormAnswer no revisado
  const index = workOrder?.answers
    ?.map((a: Answer, i: number) => ({ ...a, index: i }))
    .reverse()
    .find((a: Answer) => a.reviewed === false)?.index;

  // Estado de las respuestas por pregunta (true = OK, false = NG)
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<number, boolean | undefined>
  >({});

  // Preguntas visibles: Calidad (role_id = 3) — igual que web
  const visibleQuestions =
    workOrder.area.formQuestions?.filter((q: any) => q.role_id === 3) ?? [];

  // Para SelectionQuestionTable (igual que web)
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
        next[questionId] = type === 'ok';
      } else {
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

  // --- NUEVO: precheck igual que en web
  const precheckAndSubmit = async () => {
    const formAnswerId = workOrder.answers?.[index]?.id;
    if (!formAnswerId) {
      Alert.alert('No se encontró el Id del formulario');
      return;
    }

    // Exigir todas las preguntas de Calidad respondidas (igual que web)
    const question_id: number[] = [];
    visibleQuestions.forEach((q: any) => {
      const ans = answersByQuestion[q.id];
      if (ans !== undefined) question_id.push(q.id);
    });
    if (question_id.length !== visibleQuestions.length) {
      Alert.alert('Completa todas las preguntas.');
      return;
    }

    // Validar pruebas (igual que web: >= 5 salvo código válido)
    const over = parseNum(pruebaOver);
    const cinta = parseNum(pruebaCintaMagnetica);
    const centro = parseNum(pruebaCentro);
    const necesitaCodigo = [over, cinta, centro].some((v) => v < 5);

    if (necesitaCodigo && codigoIngresado !== CODIGO_VALIDO) {
      setShowConfirmModal(false);
      setShowCodigoModal(true);
      return;
    }

    // Si no necesita código o el código ya es válido → enviar
    await handleSubmit({ over, cinta, centro });
  };

  // --- ACTUALIZADO: handleSubmit como en web
  //     - checkboxes desde answersByQuestion
  //     - extra_data con strings
  const handleSubmit = async (nums?: { over: number; cinta: number; centro: number }) => {
    const formAnswerId = workOrder.answers?.[index]?.id;
    if (!formAnswerId) {
      Alert.alert('No se encontró el Id del formulario');
      return;
    }

    const checkboxPayload = Object.entries(answersByQuestion).map(
      ([questionId, answer]) => ({
        question_id: Number(questionId),
        answer: answer === true ? true : answer === false ? false : null,
      })
    );

    const over = nums?.over ?? parseNum(pruebaOver);
    const cinta = nums?.cinta ?? parseNum(pruebaCintaMagnetica);
    const centro = nums?.centro ?? parseNum(pruebaCentro);

    const payload = {
      form_answer_id: formAnswerId,
      checkboxes: checkboxPayload,
      extra_data: {
        prueba_over: String(over),
        prueba_cinta_magnetica: String(cinta),
        prueba_centro: String(centro),
      },
    };

    try {
      await submitExtraLaminacion(payload);
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

  const cantidadHojasRaw = Number(workOrder?.workOrder.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Área a evaluar: Laminacion</Text>
      <View style={styles.card}>
        <Text style={styles.label}>OT:</Text>
        <Text style={styles.value}>{workOrder.workOrder.ot_id}</Text>

        <Text style={styles.label}>Id del Presupuesto:</Text>
        <Text style={styles.value}>{workOrder.workOrder.mycard_id}</Text>

        <Text style={styles.label}>Cantidad (TARJETAS):</Text>
        <Text style={styles.value}>{workOrder.workOrder.quantity}</Text>

        <Text style={styles.label}>
          Cantidad (Hojas Frente / Hojas Vuelta):
        </Text>
        <Text style={styles.value}>{cantidadHojas}</Text>

        <Text style={styles.label}>Operador:</Text>
        <Text style={styles.value}>{workOrder.user.username}</Text>

        <Text style={styles.label}>Comentarios:</Text>
        <Text style={styles.value}>{workOrder.workOrder.comments}</Text>
      </View>

      <Text style={styles.modalTitle}>Respuestas del operador</Text>
      <OperatorAdvancedTable
        questions={workOrder.area.formQuestions ?? []}
        answers={workOrder.answers?.[index]?.FormAnswerResponse ?? []}
        mode={'simple'}
        readOnly
        columns={['Respuesta']}
      />

      <Text style={styles.label}>Validar Acabado Vs Orden De Trabajo:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        value={
          workOrder?.answers?.[index]?.finish_validation ??
          'No se reconoce la muestra enviada'
        }
        editable={false}
      />

      <Text style={styles.label}>Muestras entregadas:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        value={
          typeof workOrder?.answers?.[index]?.sample_quantity === 'number'
            ? String(workOrder.answers[index].sample_quantity)
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
        roleId={3} // Calidad (igual que web)
        columns={['Respuesta']}
        checkedQuestions={[{ ok: checkedRespuestaOK, ng: checkedRespuestaNG }]}
        onToggle={handleToggleRespuesta}
      />

      {/* --- NUEVO: Inputs de pruebas (igual que web) */}
      <Text style={styles.label}>Prueba Over:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        keyboardType="numeric"
        placeholder="Ej: 5"
        value={pruebaOver}
        onChangeText={setPruebaOver}
      />

      <Text style={styles.label}>Prueba Cinta Magnética:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        keyboardType="numeric"
        placeholder="Ej: 5"
        value={pruebaCintaMagnetica}
        onChangeText={setPruebaCintaMagnetica}
      />

      <Text style={styles.label}>Prueba Centro (entre capas):</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        keyboardType="numeric"
        placeholder="Ej: 5"
        value={pruebaCentro}
        onChangeText={setPruebaCentro}
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

      {/* Modal confirmación de aprobación (igual que web: llama precheck) */}
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
                onPress={precheckAndSubmit}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- NUEVO: Modal de código (igual que web) */}
      <Modal visible={showCodigoModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              Alguna prueba es menor a 5. Ingresa el código de excepción para continuar.
            </Text>
            <TextInput
              style={styles.input}
              theme={{ roundness: 30 }}
              mode="outlined"
              activeOutlineColor="#000"
              placeholder="Código de excepción"
              value={codigoIngresado}
              onChangeText={setCodigoIngresado}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCodigoModal(false);
                  setCodigoIngresado('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={async () => {
                  if (codigoIngresado !== CODIGO_VALIDO) {
                    Alert.alert('Código inválido. Verifica e intenta nuevamente.');
                    return;
                  }
                  setShowCodigoModal(false);
                  // Reintenta precheck ahora que hay código válido
                  await precheckAndSubmit();
                }}
              >
                <Text style={styles.modalButtonText}>Validar y Aprobar</Text>
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

export default LaminacionComponent;

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
  label: { fontWeight: '600', marginTop: 12, fontSize: 16 },
  value: { marginBottom: 0 },
  input: {
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 40,
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
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});