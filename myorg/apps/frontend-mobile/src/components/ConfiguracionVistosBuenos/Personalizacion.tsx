import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Alert, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Checkbox, RadioButton } from 'react-native-paper';
import { deleteFormQuestion, updateFormQuestion } from '../../api/configVistosBuenos';

interface Props {
  formQuestion: any[];
}

export default function Personalizacion({ formQuestion }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formQuestions, setFormQuestions] = useState<any[]>(formQuestion);
  const [selectedOption, setSelectedOption] = useState('etiquetadora');

  const handleUpdateTitle = async (id: number, updatedTitle: string) => {
    const currentTitle = formQuestions.find(q => q.id === id)?.title;
    if (currentTitle === updatedTitle) {
      Alert.alert('Sin cambios', 'El título no ha cambiado.');
      return;
    }
    try {
      const updatedQuestions = formQuestions.map(q => q.id === id ? { ...q, title: updatedTitle } : q);
      setFormQuestions(updatedQuestions);
      setEditingId(null);

      await updateFormQuestion(id, updatedTitle);
    } catch (err) {
      console.error("Error actualizando pregunta:", err);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      const res = await deleteFormQuestion(id);
      if (res) {
        setFormQuestions(formQuestions.filter(q => q.id !== id));
        setDeletingId(null);
      } else {
        Alert.alert("Error", "No se pudo eliminar la pregunta.");
      }
    } catch (err) {
      console.error("Error eliminando pregunta:", err);
    }
  };

  const filteredQuestions = (role: number | null, start: number, end: number) =>
    formQuestions.slice(start, end).filter(
      (q) => q.role_id === role && q.areas.some((a: any) => a.id === 10)
    );

  const renderQuestion = (question: any) => (
    <View key={question.id} style={styles.row} >
      <Text style={{
        fontSize: 16,
        color: '#111827',
        marginBottom: 8,
      }}>{question.title}</Text>
      <View style={styles.rightSide}>
        <Checkbox status={"unchecked"} />
        <TouchableOpacity onPress={() => { setEditingId(question.id); setNewTitle(question.title) }} style={styles.button}>
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDeletingId(question.id)} style={styles.button}>
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View >
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Área a evaluar: Impresión</Text>

      <Text style={styles.subtitle}>Respuestas del operador</Text>
      <RadioButton.Group onValueChange={setSelectedOption} value={selectedOption}>
        <View style={styles.radioOption}>
          <RadioButton value="etiquetadora" color="#0070f3"/> 
          <Text>Etiquetadora</Text>
        </View>
        <View style={styles.radioOption}>
          <RadioButton value="persos" color='#0070f3' />
          <Text>Persos's</Text>
        </View>
        <View style={styles.radioOption}>
          <RadioButton value="laser" color='#0070f3'/>
          <Text>Láser</Text>
        </View>
      </RadioButton.Group>

      <View style={{ marginVertical: 10 }}>
        {selectedOption === 'etiquetadora' && filteredQuestions(null, 0, 1).map(renderQuestion)}
        {selectedOption === 'persos' && filteredQuestions(null, 1, 10).map(renderQuestion)}
        {selectedOption === 'laser' && <Text>No hay preguntas por parte del operador.</Text>}
      </View>

      <Text style={styles.subtitle}>Mis respuestas</Text>
      <View style={{ marginBottom: 20 }}>
        {selectedOption === 'etiquetadora' && <Text>No hay preguntas por parte de calidad.</Text>}
        {selectedOption === 'persos' && filteredQuestions(3, 13, 15).map(renderQuestion)}
        {selectedOption === 'laser' && filteredQuestions(3, 10, 13).map(renderQuestion)}
      </View>

      {/* Edit Modal */}
      <Modal visible={editingId !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Editar Pregunta</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              style={styles.input}
              placeholder="Nuevo título"
            />
            <View style={styles.modalButtons}>
              <Pressable onPress={() => setEditingId(null)} style={styles.cancelButton}><Text>Cancelar</Text></Pressable>
              <Pressable onPress={() => handleUpdateTitle(editingId!, newTitle)} style={styles.saveButton}><Text>Guardar</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={deletingId !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Eliminar esta pregunta?</Text>
            <Text>Esta acción no se puede deshacer.</Text>
            <View style={styles.modalButtons}>
              <Pressable onPress={() => setDeletingId(null)} style={styles.cancelButton}><Text>Cancelar</Text></Pressable>
              <Pressable onPress={() => handleDeleteQuestion(deletingId!)} style={styles.deleteButton}><Text>Eliminar</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =================== Styles ===================

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFF',
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionText: {
    flex: 1,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000077',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cancelButton: {
    padding: 10,
    backgroundColor: '#BBBBBB',
    borderRadius: 6,
  },
  saveButton: {
    padding: 10,
    backgroundColor: '#0070f3',
    borderRadius: 6,
  },
  deleteButton: {
    padding: 10,
    backgroundColor: '#D9534F',
    borderRadius: 6,
  },
  row: {
    flexDirection: 'column',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switch: {
    marginRight: 16,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#d1d5db',
    borderRadius: 6,
    marginLeft: 8,
  },
  buttonText: {
    color: '#111827',
    fontWeight: '500',
  },
});