import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import QuestionTable from './QuestionTable';
import {
  deleteFormQuestion,
  updateFormQuestion,
} from '../../api/configVistosBuenos';

interface Props {
  formQuestion: any[];
}

interface Question {
  id: number;
  title: string;
  role_id: number | null;
  areas: { id: number }[];
}

export default function Serigrafia({ formQuestion }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [formQuestions, setFormQuestions] = useState<Question[]>(formQuestion);

  const handleUpdateTitle = async (id: number, updatedTitle: string) => {
    const currentTitle = formQuestions.find((q) => q.id === id)?.title;
    if (currentTitle === updatedTitle) {
      Alert.alert('Aviso', 'El título no ha cambiado.');
      return;
    }

    try {
      const updatedQuestions = formQuestions.map((q) =>
        q.id === id ? { ...q, title: updatedTitle } : q
      );
      setFormQuestions(updatedQuestions);
      setEditingId(null);

      await updateFormQuestion(id, updatedTitle);
    } catch (error) {
      console.error('Error actualizando la pregunta:', error);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      const res = await deleteFormQuestion(id);
      if (res) {
        setFormQuestions((prev) => prev.filter((q) => q.id !== id));
        setDeletingId(null);
      } else {
        Alert.alert('Error', 'No se pudo eliminar la pregunta.');
      }
    } catch (error) {
      console.error('Error eliminando la pregunta:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Área a evaluar: Serigrafía</Text>

      <QuestionTable
        title="Respuestas del operador"
        questions={formQuestions}
        areaId={3}
        roleFilter={null}
        onEdit={(e) => {
          setEditingId(e.id);
          setNewTitle(e.title);
        }}
        onDelete={(e) => setDeletingId(e)}
      />

      <Text style={styles.label}>Muestras entregadas:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        editable={false}
      />

      <QuestionTable
        title="Mis respuestas"
        questions={formQuestions}
        areaId={3}
        roleFilter={3}
        onEdit={(e) => {
          setEditingId(e.id);
          setNewTitle(e.title);
        }}
        onDelete={(e) => setDeletingId(e)}
      />

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
              <Pressable
                onPress={() => setEditingId(null)}
                style={styles.cancelButton}
              >
                <Text>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => handleUpdateTitle(editingId!, newTitle)}
                style={styles.saveButton}
              >
                <Text>Guardar</Text>
              </Pressable>
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
              <Pressable
                onPress={() => setDeletingId(null)}
                style={styles.cancelButton}
              >
                <Text>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDeleteQuestion(deletingId!)}
                style={styles.deleteButton}
              >
                <Text>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
  },
  label: {
    marginTop: 12,
    fontWeight: '500',
  },
  input: {
    padding: 10,
    height: 20,
    marginVertical: 8,
    width: '90%',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  cell: {
    flex: 1,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    marginHorizontal: 4,
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
  button: {
    backgroundColor: '#0070f3',
    padding: 10,
    borderRadius: 6,
    minWidth: 90,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
});
