import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal
} from 'react-native';
import QuestionTable from './QuestionTable';
import { deleteFormQuestion, updateFormQuestion } from '../../api/configVistosBuenos';

interface Props {
  formQuestion: any[];
}

interface Question {
  id: number;
  title: string;
  role_id: number | null;
  areas: { id: number }[];
}

export default function Laminacion({ formQuestion }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [formQuestions, setFormQuestions] = useState<Question[]>(formQuestion);

  const handleUpdateTitle = async (id: number, updatedTitle: string) => {
    const currentTitle = formQuestions.find(q => q.id === id)?.title;
    if (currentTitle === updatedTitle) {
      Alert.alert('Aviso', 'El título no ha cambiado.');
      return;
    }

    try {
      const updatedQuestions = formQuestions.map(q =>
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
        setFormQuestions(prev => prev.filter(q => q.id !== id));
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
      <Text style={styles.title}>Área a evaluar: Laminación</Text>

      <QuestionTable
        title='Respuestas del operador'
        questions={formQuestions}
        areaId={5}
        roleFilter={null}
        onEdit={(e) => { setEditingId(e.id); setNewTitle(e.title) }}
        onDelete={(e) => setDeletingId(e)}
      />

      <Text style={styles.label}>Validar Acabado Vs Orden De Trabajo</Text>
      <View style={styles.radioGroup}>
        <Text>◯ B/B</Text>
        <Text>◯ M/M</Text>
        <Text>◯ Otro</Text>
      </View>

      <Text style={styles.label}>Muestras entregadas:</Text>
      <TextInput style={styles.input} editable={false}  />


      <QuestionTable
        title='Mis respuestas'
        questions={formQuestions}
        areaId={5}
        roleFilter={3}
        onEdit={(e) => { setEditingId(e.id); setNewTitle(e.title) }}
        onDelete={(e) => setDeletingId(e)}
      />

      {/* Modal Edición */}
      <Modal visible={editingId !== null}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Editar Pregunta</Text>
          <TextInput
            style={styles.input}
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={() => setEditingId(null)}
              style={[styles.button, { backgroundColor: '#bbb' }]}
            >
              <Text>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => editingId && handleUpdateTitle(editingId, newTitle)}
              style={styles.button}
            >
              <Text style={{ color: '#fff' }}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Eliminación */}
      <Modal visible={deletingId !== null}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Eliminar esta pregunta</Text>
          <Text>¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer.</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={() => setDeletingId(null)}
              style={[styles.button, { backgroundColor: '#bbb' }]}
            >
              <Text>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deletingId && handleDeleteQuestion(deletingId)}
              style={[styles.button, { backgroundColor: '#D9534F' }]}
            >
              <Text style={{ color: '#fff' }}>Eliminar</Text>
            </TouchableOpacity>
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
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    width: '90%'
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  cell: {
    flex: 1,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  button: {
    backgroundColor: '#0070f3',
    padding: 10,
    borderRadius: 6,
    minWidth: 90,
    alignItems: 'center',
  },
});