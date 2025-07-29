// myorg/apps/frontend-mobile/src/components/RecepcionCQM/ColorEdgeComponent.tsx

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
import { submitExtraHotStamping, sendInconformidadCQM } from '../../api/recepcionCQM';

// Tipos y constantes globales

type Answer = {
  reviewed: boolean;
  sample_quantity: number;
};

const HotStampingComponent = ({ workOrder }: { workOrder: any }) => {
  // Hooks y estados
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [checkedQuestions, setCheckedQuestions] = useState<number[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState('');
  const [showQuality, setShowQuality] = useState<boolean>(false);

  // Derivaciones
  const index = workOrder?.answers
    ?.map((a: Answer, i: number) => ({ ...a, index: i }))
    .reverse()
    .find((a: Answer) => a.reviewed === false)?.index;

  const questions = workOrder.area.formQuestions?.filter((q: any) => q.role_id === null) || [];
  const qualityQuestions = workOrder.area.formQuestions?.filter((q: any) => q.role_id === 3) || [];
  const currentFlow = [...workOrder.workOrder.flow].find((f: any) => f.id === workOrder.id);

  const isDisabled = workOrder.status === 'En proceso';
  const nextFlowIndex = workOrder.workOrder.flow.findIndex((f: any) => f.id === workOrder.id) + 1;
  const nextFlow = workOrder.workOrder.flow[nextFlowIndex] ?? null;

  const allParcialsValidated = workOrder.partialReleases?.every(
    (r: { validated: boolean }) => r.validated
  );

  const handleSubmit = async () => {
    const formAnswerId = workOrder.answers[index]?.id;
    if (!formAnswerId) {
      Alert.alert('No se encontró el Id del formulario');
      return;
    }
  
    const questions = workOrder.area.formQuestions.filter((q: any) => q.role_id === 3);
  
    const isCheckedQuestionsValid = questions.some((q: any) =>
      checkedQuestions.includes(q.id)
    );
  
    const checkboxPayload = checkedQuestions.map((questionId: number) => ({ question_id: questionId }));
  
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
      {/* Encabezado estilo tabla */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
        <Text style={styles.tableCell}>Respuesta</Text>
      </View>

      {/* Preguntas normales */}
      {questions.map((q: any) => {
        const responses = workOrder.answers[index]?.FormAnswerResponse?.find(
          (resp: any) => resp.question_id === q.id
        );
        console.log(responses);
        // Encuentra la respuesta del operador por pregunta_id
        const operatorResponse = responses?.response_operator;

        return (
          <View key={q.id} style={styles.tableRow}>
            {/* Pregunta */}
            <View style={[styles.tableCell, { flex: 2 }]}>
              <Text style={styles.questionText}>{q.title}</Text>
            </View>

            {/* Respuesta */}
            <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
              <View style={[styles.radioCircle, operatorResponse && styles.radioDisabled]}>
                {operatorResponse && <View style={styles.radioDot} />}
              </View>
            </View>
          </View>
        );
      })}
      {/* Muestras */}
      <Text style={styles.label}>Color Foil:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        value={workOrder?.answers[index].color_foil ?? 'No se reconoce la muestra enviada' }
        editable={false}
      />
      <Text style={styles.label}>Revisar Posición Vs Ot:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        value={workOrder?.answers[index].revisar_posicion ?? 'No se reconoce la muestra enviada' }
        editable={false}
      />
      <Text style={styles.label}>Imagen de Holograma Vs Ot:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        value={workOrder?.answers[index].imagen_holograma ?? 'No se reconoce la muestra enviada' }
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
      {/* Encabezado estilo tabla */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
        <Text style={styles.tableCell}>Respuesta</Text>
      </View>
      {/* Preguntas normales */}
      {qualityQuestions.map((q: any) => (
        <View key={q.id} style={styles.tableRow}>
          {/* Pregunta */}
          <View style={[styles.tableCell, { flex: 2 }]}>
            <Text style={styles.questionText}>{q.title}</Text>
          </View>
          {/* Respuestas */}
          <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
            <TouchableOpacity
              onPress={() =>
                setCheckedQuestions((prev) =>
                  prev.includes(q.id)
                    ? prev.filter((id) => id !== q.id)
                    : [...prev, q.id]
                )
              }
              style={[
                styles.radioCircle,
                checkedQuestions.includes(q.id) && styles.checkedBox,
              ]}
            >
              {checkedQuestions.includes(q.id) && (
                <View style={styles.radioDot} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {showQuality && (
        <>
          {qualityQuestions.map((q: any) => (
            <View key={q.id} style={styles.qualityRow}>
              <Text style={styles.qualityQuestion}>{q.title}</Text>
            </View>
          ))}
          <Text style={styles.subtitle}>Tipo de Prueba</Text>
            {['color', 'perfil', 'fisica'].map(type => (
              <View key={type} style={styles.radioDisabled}>
                <Text>{`Prueba ${type}`}</Text>
              </View>
            ))}
        </>
      )}

      {/* Botones */}
      <View style={styles.modalButtonRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowInconformidad(true)}>
          <Text style={styles.modalButtonText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={() => setShowConfirmModal(true)}>
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
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowInconformidad(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleInconformidad}>
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
    marginTop: 10 
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
    alignItems: 'flex-start',
  },
  
  radioLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10
  }, 
  radioText: {
    fontSize: 16,
    color: '#1f2937',
  }
});