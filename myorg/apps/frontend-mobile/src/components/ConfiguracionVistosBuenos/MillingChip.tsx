import React, { useState } from 'react';
import { View, Text, TextInput, Button, Modal, StyleSheet, Alert, ScrollView } from 'react-native';
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

export default function MillingChipComponent({ formQuestion }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formQuestions, setFormQuestions] = useState<Question[]>(formQuestion);

  const handleUpdateTitle = async (id: number, updatedTitle: string) => {
    const currentTitle = formQuestions.find(q => q.id === id)?.title;
    if (currentTitle === updatedTitle) {
      Alert.alert("Atención", "El título no ha cambiado.");
      return;
    }

    const updatedQuestions = formQuestions.map(q => 
      q.id === id ? { ...q, title: updatedTitle } : q
    );
    setFormQuestions(updatedQuestions);
    setEditingId(null);

    try {
      await updateFormQuestion(id, updatedTitle);
    } catch (error) {
      console.error("Error actualizando la pregunta:", error);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      const res = await deleteFormQuestion(id);
      if (res) {
      setFormQuestions(formQuestions.filter(q => q.id !== id));
      setDeletingId(null);
      }
    } catch (error) {
      console.error("Error eliminando la pregunta:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Área a evaluar: Milling Chip</Text>

      <QuestionTable
        title='Respuestas del operador'
        questions={formQuestions}
        areaId={9}
        roleFilter={null}
        onEdit={(e) => { setEditingId(e.id); setNewTitle(e.title) }}
        onDelete={(e) => setDeletingId(e)}
      />

      <QuestionTable
        title='Mis respuestas'
        questions={formQuestions}
        areaId={9}
        roleFilter={3}
        onEdit={(e) => { setEditingId(e.id); setNewTitle(e.title) }}
        onDelete={(e) => setDeletingId(e)}
      />

      <Text style={styles.label}>Revisar Tecnología De Chip Y Color Vs Ot</Text>
      <TextInput style={styles.input} editable={false} />

      <Text style={styles.label}>Validar y anotar KCV, carga de app o prehabilitación</Text>
      <TextInput style={styles.input} editable={false} />

      <Text style={styles.label}>Muestras entregadas</Text>
      <TextInput style={styles.input} editable={false} />

      <Text style={styles.label}>Localización de Contactos</Text>
      <TextInput style={styles.input} editable={false} />

      <Text style={styles.label}>Altura Chip Centro</Text>
      <TextInput style={styles.input} editable={false} />

      {/* Modales */}
      <Modal visible={editingId !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Pregunta</Text>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancelar" onPress={() => setEditingId(null)} />
              <Button title="Guardar" onPress={() => handleUpdateTitle(editingId!, newTitle)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deletingId !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Eliminar esta pregunta?</Text>
            <Text>Esta acción no se puede deshacer.</Text>
            <View style={styles.modalButtons}>
              <Button title="Cancelar" onPress={() => setDeletingId(null)} />
              <Button title="Eliminar" color="#D9534F" onPress={() => handleDeleteQuestion(deletingId!)} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    color: '#374151',
  },
  label: {
    fontWeight: '500',
    marginTop: 16,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    backgroundColor: '#F3F4F6',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFEFEF',
    padding: 10,
    marginTop: 8,
    borderRadius: 6,
  },
  questionText: {
    flex: 1,
    marginRight: 10,
    color: '#111827',
  },
  actionText: {
    fontSize: 18,
    marginHorizontal: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    width: '85%',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});