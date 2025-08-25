import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { acceptCQMInconformity } from '../../api/inconformidades';
import { useNavigation } from '@react-navigation/native';
import { OperatorAdvancedTable } from '../LiberacionDeVistosBuenos/util/FormQuestionTable';

type Answer = {
  reviewed: boolean;
  sample_quantity: number;
};

const PersonalizacionComponentCQM = ({ workOrder }: { workOrder: any }) => {
  const navigation = useNavigation();
  const [showModal, setShowModal] = useState(false);
  const questions =
    workOrder.area.formQuestions?.filter((q: any) => q.role_id === null) || [];
  const [responses, setResponses] = useState<
    { questionId: number; answer: boolean }[]
  >([]);

  // Derivaciones
  // --- Derivaciones (mueve esto arriba, justo después de useState) ---
  const index =
    workOrder?.answers
      ?.map((a: Answer, i: number) => ({ ...a, index: i }))
      .reverse()
      .find((a: Answer) => a.reviewed === false)?.index ?? null;

  const hasIndex = index !== null && index !== undefined;

  const lastIndex =
    workOrder.answers[index].inconformities.length > 1
      ? workOrder.answers[index].inconformities.length - 1
      : 0;

  // Helper: según tipo de personalización, devolver el slice de preguntas del OPERADOR
  const getOperatorQuestions = () => {
    const qs = workOrder?.area?.formQuestions ?? [];
    if (!hasIndex) return [];
    switch (workOrder?.answers?.[index!]?.tipo_personalizacion) {
      case 'persos':
        return qs.slice(1, 10);
      case 'etiquetadora':
        return qs.slice(0, 1);
      case 'packsmart':
        return qs.slice(14, 20);
      case 'otto':
        return qs.slice(20, 28);
      case 'embolsadora':
        return qs.slice(28, 30);
      default:
        return [];
    }
  };

  const handleSubmit = async () => {
    try {
      const areaResponse = workOrder.answers[index].id;
      await acceptCQMInconformity(areaResponse);
      setShowModal(false);
      Alert.alert('Inconformidad aceptada');
      navigation.goBack();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error al aceptar la inconformidad');
    }
  };

  const tipoPersonalizacion = workOrder?.answers[index].tipo_personalizacion;
  useEffect(() => {
    const initial = selectedQuestions
      .filter((q) => q.role_id === 3)
      .map((q) => ({
        questionId: q.id,
        answer: false,
      }));
    setResponses(initial);
  }, [tipoPersonalizacion]);

  let selectedQuestions: { id: number; role_id: number | null }[] = [];

  if (tipoPersonalizacion === 'laser') {
    selectedQuestions = workOrder.area.formQuestions.slice(9, 13);
  } else if (tipoPersonalizacion === 'persos') {
    selectedQuestions = workOrder.area.formQuestions.slice(13, 17);
  }

  return (
    <View>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 230 }]}
      >
        <Text style={styles.sectionTitle}>Entregaste</Text>
        <Text style={styles.label}>Tipo de Personalizacion:</Text>
        <TextInput
          style={styles.input}
          value={
            workOrder?.answers[index].tipo_personalizacion ??
            'No se reconoce la muestra enviada'
          }
          editable={false}
          mode="outlined"
          activeOutlineColor="#000"
          theme={{ roundness: 30 }}
        />

        {workOrder?.answers[index].tipo_personalizacion === 'laser' && (
          <>
            <Text style={styles.label}>Muestras entregadas:</Text>
            <TextInput
              style={styles.input}
              value={
                workOrder?.answers[index].sample_quantity !== null
                  ? String(workOrder?.answers[index].sample_quantity)
                  : 'No se reconoce la muestra enviada'
              }
              editable={false}
              mode="outlined"
              activeOutlineColor="#000"
              theme={{ roundness: 30 }}
            />
          </>
        )}
        {workOrder?.answers[index].tipo_personalizacion === 'persos' && (
          <>
            <OperatorAdvancedTable
              questions={getOperatorQuestions()}
              answers={workOrder?.answers?.[index]?.FormAnswerResponse ?? []}
              mode="simple"
              readOnly
              columns={['Respuesta']}
            />
            <Text style={styles.label}>Color De Personalización:</Text>
            <TextInput
              style={styles.input}
              value={
                workOrder?.answers[index].color_personalizacion ??
                'No se reconoce la muestra enviada'
              }
              editable={false}
              mode="outlined"
              activeOutlineColor="#000"
              theme={{ roundness: 30 }}
            />
            <Text style={styles.label}>
              Tipo de Código de Barras Que Se Personaliza:
            </Text>
            <TextInput
              style={styles.input}
              value={
                workOrder?.answers[index].codigo_barras ??
                'No se reconoce la muestra enviada'
              }
              editable={false}
              mode="outlined"
              activeOutlineColor="#000"
              theme={{ roundness: 30 }}
            />
            {/* Muestras */}
            <Text style={styles.label}>Muestras entregadas:</Text>
            <TextInput
              style={styles.input}
              value={
                typeof workOrder?.answers?.[index]?.sample_quantity === 'number'
                  ? workOrder.answers[index].sample_quantity.toString()
                  : ''
              }
              editable={false}
              mode="outlined"
              activeOutlineColor="#000"
              theme={{ roundness: 30 }}
            />
          </>
        )}

        {workOrder?.answers[index].tipo_personalizacion === 'etiquetadora' && (
          <>
            <OperatorAdvancedTable
              questions={getOperatorQuestions()}
              answers={workOrder?.answers?.[index]?.FormAnswerResponse ?? []}
              mode="simple"
              readOnly
              columns={['Respuesta']}
            />
            <Text style={styles.label}>
              Verificar Tipo De Etiqueta Vs Ot Y Pegar Utilizada:
            </Text>
            <TextInput
              style={styles.input}
              value={
                workOrder?.answers[index].verificar_etiqueta ??
                'No se reconoce la muestra enviada'
              }
              editable={false}
              mode="outlined"
              activeOutlineColor="#000"
              theme={{ roundness: 30 }}
            />
            <Text style={styles.label}>Muestras entregadas:</Text>
            <TextInput
              style={styles.input}
              value={
                typeof workOrder?.answers?.[index]?.sample_quantity === 'number'
                  ? workOrder.answers[index].sample_quantity.toString()
                  : ''
              }
              editable={false}
              mode="outlined"
              activeOutlineColor="#000"
              theme={{ roundness: 30 }}
            />
          </>
        )}

        {workOrder?.answers[index].tipo_personalizacion === 'packsmart' && (
          <>
            <OperatorAdvancedTable
              questions={getOperatorQuestions()}
              answers={workOrder?.answers?.[index]?.FormAnswerResponse ?? []}
              mode="simple"
              readOnly
              columns={['Respuesta']}
            />
            <Text style={styles.label}>Muestras entregadas:</Text>
            <TextInput
              style={styles.input}
              value={
                typeof workOrder?.answers?.[index]?.sample_quantity === 'number'
                  ? workOrder.answers[index].sample_quantity.toString()
                  : ''
              }
              editable={false}
              mode="outlined"
              activeOutlineColor="#000"
              theme={{ roundness: 30 }}
            />
          </>
        )}

        {workOrder?.answers[index].tipo_personalizacion === 'otto' && (
          <>
            <OperatorAdvancedTable
              questions={getOperatorQuestions()}
              answers={workOrder?.answers?.[index]?.FormAnswerResponse ?? []}
              mode="simple"
              readOnly
              columns={['Respuesta']}
            />
            <Text style={styles.label}>Muestras entregadas:</Text>
            <TextInput
              style={styles.input}
              value={
                typeof workOrder?.answers?.[index]?.sample_quantity === 'number'
                  ? workOrder.answers[index].sample_quantity.toString()
                  : ''
              }
              editable={false}
              mode="outlined"
              activeOutlineColor="#000"
              theme={{ roundness: 30 }}
            />
          </>
        )}

        {workOrder?.answers[index].tipo_personalizacion === 'embolsadora' && (
          <>
            <OperatorAdvancedTable
              questions={getOperatorQuestions()}
              answers={workOrder?.answers?.[index]?.FormAnswerResponse ?? []}
              mode="simple"
              readOnly
              columns={['Respuesta']}
            />
            <Text style={styles.label}>Muestras entregadas:</Text>
            <TextInput
              style={styles.input}
              value={
                typeof workOrder?.answers?.[index]?.sample_quantity === 'number'
                  ? workOrder.answers[index].sample_quantity.toString()
                  : ''
              }
              editable={false}
              mode="outlined"
              activeOutlineColor="#000"
              theme={{ roundness: 30 }}
            />
          </>
        )}

        <Text style={styles.sectionTitle}>Inconformidad</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Usuario:</Text>
          <TextInput
            value={
              workOrder.answers[index].inconformities[lastIndex].user.username
            }
            editable={false}
            style={styles.input}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
          <Text style={styles.label}>Comentarios:</Text>
          <TextInput
            value={workOrder.answers[index].inconformities[lastIndex].comments}
            editable={false}
            multiline
            style={[styles.input, { minHeight: 100 }]}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.buttonText}>Aceptar Inconformidad</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />

        {/* Modal */}
        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalText}>
                ¿Estás segura/o que deseas aceptar la inconformidad? Deberás
                liberar nuevamente.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowModal(false)}
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
      </ScrollView>
    </View>
  );
};

export default PersonalizacionComponentCQM;

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 8,
    backgroundColor: '#fdfaf6',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'left',
    color: '#1f2937',
  },
  inputDetail: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 18,
    padding: 10,
    backgroundColor: '#fff',
    height: 50,
    fontSize: 16,
    marginTop: 7,
    marginBottom: 15,
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
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    elevation: 3,
  },
  questionText: {
    fontSize: 15,
    color: '#1f2937',
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
  radioDisabled: {
    padding: 8,
    borderWidth: 1,
    opacity: 0.4,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  subheading: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
  },
  row: {
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    padding: 10,
    backgroundColor: '#f9fafb',
    height: 30,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0038A8',
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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
    borderRadius: 16,
    width: '80%',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    backgroundColor: '#0038A8',
    padding: 10,
    borderRadius: 18,
    flex: 1,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#A9A9A9',
    padding: 10,
    borderRadius: 18,
    flex: 1,
    marginRight: 10,
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
