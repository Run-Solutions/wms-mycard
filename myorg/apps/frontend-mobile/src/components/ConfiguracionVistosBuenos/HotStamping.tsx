import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, Pressable, Modal } from 'react-native';
import { Portal } from 'react-native-paper';
import QuestionTable from './QuestionTable';
import { deleteFormQuestion, updateFormQuestion } from '../../api/configVistosBuenos';

interface Props {
  formQuestion: any;
}

interface Question {
  id: number;
  title: string;
  role_id: number | null;
  areas: { id: number }[];
}

export default function HotStampingComponent({ formQuestion }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formQuestions, setFormQuestions] = useState<Question[]>(formQuestion);

  const handleUpdateTitle = async (id: number, updatedTitle: string) => {
    const currentTitle = formQuestions.find((q) => q.id === id)?.title;
    if (currentTitle === updatedTitle) {
      Alert.alert("El título no ha cambiado.");
      return;
    }
    const updated = formQuestions.map((q) => q.id === id ? { ...q, title: updatedTitle } : q);
    setFormQuestions(updated);
    setEditingId(null);

    await updateFormQuestion(id, updatedTitle);
  };

  const handleDeleteQuestion = async (id: number) => {
    const res = await deleteFormQuestion(id);
    if (res) {
      const updated = formQuestions.filter(q => q.id !== id);
      setFormQuestions(updated);
      setDeletingId(null);
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Área a evaluar: Hot Stamping</Text>


      <QuestionTable
        title='Respuestas del operador'
        questions={formQuestions}
        areaId={8}
        roleFilter={null}
        onEdit={(e) => { setEditingId(e.id); setNewTitle(e.title) }}
        onDelete={(e) => setDeletingId(e)}
      />


      <QuestionTable
        title='Mis respuestas'
        questions={formQuestions}
        areaId={8}
        roleFilter={3}
        onEdit={(e) => { setEditingId(e.id); setNewTitle(e.title) }}
        onDelete={(e) => setDeletingId(e)}
      />

      <Portal>
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
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  section: { fontSize: 16, fontWeight: '600', marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  question: { flex: 1 },
  actions: { flexDirection: 'row', marginLeft: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4, marginTop: 10 },
  modal: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
});