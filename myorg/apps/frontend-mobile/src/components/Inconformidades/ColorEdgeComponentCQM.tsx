import React, { useState } from 'react';
import { View, Text, Button, Alert, Modal, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { acceptCQMInconformity } from '../../api/inconformidades';
import { TextInput } from "react-native-paper";
import { useNavigation } from '@react-navigation/native';

const ColorEdgeComponentCQM = ({ workOrder }: { workOrder: any }) => {
  const navigation = useNavigation();
  const [showModal, setShowModal] = useState(false);
  const questions = workOrder.area.formQuestions?.filter((q: any) => q.role_id === null) || [];

  const index = workOrder?.answers
    ?.map((a: any, i: number) => ({ ...a, index: i }))
    .reverse()
    .find((a: any) => a.reviewed === false)?.index;

  const lastIndex =
    workOrder.answers[index].inconformities.length > 1
      ? workOrder.answers[index].inconformities.length - 1
      : 0;

  const handleSubmit = async () => {
    try {
      const areaResponse = workOrder.answers[index].id;
      await acceptCQMInconformity(areaResponse);
      setShowModal(false);
      Alert.alert('Inconformidad aceptada');
      navigation.navigate('liberarProducto' as never);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error al aceptar la inconformidad');
    }
  };

  return (
    <View>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
        <Text style={styles.sectionTitle}>Entregaste</Text>

        <View style={styles.card}>
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
          <Text style={styles.label}>Color Edge:</Text>
          <TextInput
            style={styles.input}
            value={workOrder?.answers?.[index]?.color_edge}
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

          {typeof workOrder?.answers?.[index]?.sample_quantity !== 'number' && (
            <Text style={{ color: '#b91c1c', marginTop: 8, textAlign: 'center' }}>
              No se reconoce la muestra enviada
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Inconformidad</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Usuario:</Text>
          <TextInput
            value={workOrder.answers[index].inconformities[lastIndex].user.username}
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

        <TouchableOpacity style={styles.button} onPress={() => setShowModal(true)}>
          <Text style={styles.buttonText}>Aceptar Inconformidad</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />

        {/* Modal */}
        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalText}>¿Estás segura/o que deseas aceptar la inconformidad? Deberás liberar nuevamente.</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit}>
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

export default ColorEdgeComponentCQM;

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
    marginBottom: 16,
    height: 30,
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