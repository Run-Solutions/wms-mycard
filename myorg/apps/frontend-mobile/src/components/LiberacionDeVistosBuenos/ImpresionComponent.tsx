// myorg/apps/frontend-mobile/src/components/LiberacionDeVistosBuenos/ImpresionComponent.tsx

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
  submitExtraImpresion,
  sendInconformidadCQM,
} from '../../api/recepcionCQM';
import { OperatorAdvancedTable } from './util/FormQuestionTable';
import SelectionQuestionTable from './util/SelectionQuestionTable';

// Tipos y constantes globales

type Answer = {
  reviewed: boolean;
  sample_quantity: number;
};

const radioOptions = [
  { label: 'Prueba de color', value: 'color' },
  { label: 'VoBo Perfil', value: 'perfil' },
  { label: 'Prueba digital', value: 'fisica' },
];

const ImpresionComponent = ({ workOrder }: { workOrder: any }) => {
  // Hooks y estados
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [checkedFrenteOK, setCheckedFrenteOK] = useState<number[]>([]);
  const [checkedFrenteNG, setCheckedFrenteNG] = useState<number[]>([]);

  // ✅ Vuelta
  const [checkedVueltaOK, setCheckedVueltaOK] = useState<number[]>([]);
  const [checkedVueltaNG, setCheckedVueltaNG] = useState<number[]>([]);

  const [testTypes, setTestTypes] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState('');
  const [showQuality, setShowQuality] = useState<boolean>(false);

  // Derivaciones
  const index = workOrder?.answers
    ?.map((a: Answer, i: number) => ({ ...a, index: i }))
    .reverse()
    .find((a: Answer) => a.reviewed === false)?.index;

  const qualityQuestions =
    workOrder.area.formQuestions?.filter((q: any) => q.role_id === 3) || [];

    const handleSubmit = async () => {
      const formAnswerId = workOrder.answers[index]?.id;
      if (!formAnswerId) {
        Alert.alert('No se encontró el Id del formulario');
        return;
      }
    
      // 1) Preguntas visibles (CQM: role_id === 3). Aplica slice si lo usas en la UI.
      const visibleQuestions =
        (workOrder.area.formQuestions ?? []).filter((q: any) => q.role_id === 3);
    
      // 2) Helper: estado por columna (0 = Frente, 1 = Vuelta)
      const getAnswerFor = (qid: number, colIndex: number): boolean | undefined => {
        if (colIndex === 0) {
          if (checkedFrenteOK.includes(qid)) return true;
          if (checkedFrenteNG.includes(qid)) return false;
          return undefined;
        } else {
          if (checkedVueltaOK.includes(qid)) return true;
          if (checkedVueltaNG.includes(qid)) return false;
          return undefined;
        }
      };
    
      // 3) Validar que TODAS las visibles tengan selección en ambas columnas
      for (const q of visibleQuestions) {
        const a0 = getAnswerFor(q.id, 0);
        const a1 = getAnswerFor(q.id, 1);
        if (a0 === undefined || a1 === undefined) {
          Alert.alert('Completa todas las preguntas y cantidad de muestra.');
          return;
        }
      }
    
      // 4) Construir payload que el tipo espera:
      //    frente/vuelta = SOLO ids con respuesta OK en cada columna
      const frente = visibleQuestions
        .filter((q: any) => getAnswerFor(q.id, 0) === true)
        .map((q: any) => ({ question_id: q.id }));
    
      const vuelta = visibleQuestions
        .filter((q: any) => getAnswerFor(q.id, 1) === true)
        .map((q: any) => ({ question_id: q.id }));
    
      const payload = {
        form_answer_id: formAnswerId,
        frente, // {question_id}[]
        vuelta, // {question_id}[]
        radio: { value: testTypes },
      };
    
      try {
        const success = await submitExtraImpresion(payload);
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

  const handleToggleFrenteVuelta = (
    questionId: number,
    columnIndex: number, // 0 = Frente, 1 = Vuelta
    type: 'ok' | 'ng',
    checked: boolean
  ) => {
    if (columnIndex === 0) {
      // FRENTE
      if (type === 'ok') {
        setCheckedFrenteOK((prev) =>
          checked
            ? Array.from(new Set([...prev, questionId]))
            : prev.filter((id) => id !== questionId)
        );
        // Quita la contraria en el mismo tick
        setCheckedFrenteNG((prev) => prev.filter((id) => id !== questionId));
      } else {
        setCheckedFrenteNG((prev) =>
          checked
            ? Array.from(new Set([...prev, questionId]))
            : prev.filter((id) => id !== questionId)
        );
        setCheckedFrenteOK((prev) => prev.filter((id) => id !== questionId));
      }
    } else {
      // VUELTA
      if (type === 'ok') {
        setCheckedVueltaOK((prev) =>
          checked
            ? Array.from(new Set([...prev, questionId]))
            : prev.filter((id) => id !== questionId)
        );
        setCheckedVueltaNG((prev) => prev.filter((id) => id !== questionId));
      } else {
        setCheckedVueltaNG((prev) =>
          checked
            ? Array.from(new Set([...prev, questionId]))
            : prev.filter((id) => id !== questionId)
        );
        setCheckedVueltaOK((prev) => prev.filter((id) => id !== questionId));
      }
    }
  };

  const cantidadHojasRaw = Number(workOrder?.workOrder.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Área a evaluar: Impresión</Text>
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

      {/* Preguntas normales */}
      <OperatorAdvancedTable
        questions={workOrder.area.formQuestions ?? []}
        answers={workOrder.answers[index]?.FormAnswerResponse ?? []}
        mode={'doble'}
        readOnly
        columns={['Hoja Frente', 'Hoja Vuelta']}
      />

      {/* Muestras */}
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
        roleId={3}
        columns={['Hoja Frente', 'Hoja Vuelta']}
        checkedQuestions={[
          { ok: checkedFrenteOK, ng: checkedFrenteNG },
          { ok: checkedVueltaOK, ng: checkedVueltaNG },
        ]}
        onToggle={handleToggleFrenteVuelta}
      />

      <Text style={styles.label}>Tonos y/o Densidades Contra:</Text>
      <View style={styles.radioGroup}>
        {radioOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.radioLabel}
            onPress={() => setTestTypes(option.value)}
          >
            <View style={styles.radioCircle}>
              {testTypes === option.value && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

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

export default ImpresionComponent;

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
  label: { fontWeight: '600', marginTop: 12, fontSize: 16, marginBottom: 8 },
  value: { marginBottom: 8 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
  checkedBox: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
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
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  radioGroup: {
    marginTop: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },

  radioLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  radioText: {
    fontSize: 16,
    color: '#1f2937',
  },
});
