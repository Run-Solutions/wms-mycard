import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  Pressable
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { deleteFormQuestion, updateFormQuestion } from '../../api/configVistosBuenos';
import { AdvancedQuestionTable } from './util/FormQuestionTable';

interface Area {
  id: number;
  name: string;
}
interface Question {
  id: number;
  title: string;
  role_id: number | null;
  areas: Area[];
}
interface Props {
  formQuestion: Question[];
}

export default function Impresion({ formQuestion }: Props) {
  const [formQuestions, setFormQuestions] = useState<Question[]>(formQuestion);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState<string>('');

  const handleUpdateTitle = async (id: number | null, updatedTitle: string) => {
    if (id == null) return;
    const currentTitle = formQuestions.find(q => q.id === id)?.title ?? '';
    const trimmed = (updatedTitle ?? '').trim();

    if (!trimmed) {
      Alert.alert('Aviso', 'El título no puede estar vacío.');
      return;
    }
    if (currentTitle === trimmed) {
      Alert.alert('Aviso', 'El título no ha cambiado.');
      return;
    }

    try {
      // Optimistic UI
      setFormQuestions(prev => prev.map(q => (q.id === id ? { ...q, title: trimmed } : q)));
      setEditingId(null);
      await updateFormQuestion(id, trimmed);
    } catch (error) {
      console.error('Error actualizando la pregunta:', error);
      // Revertir si falla (re-fetch sugerido en producción)
      Alert.alert('Error', 'No se pudo actualizar la pregunta.');
      // Opcional: volver a estado original recargando desde props o backend
    }
  };

  const handleDeleteQuestion = async (id: number | null) => {
    if (id == null) return;
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
      Alert.alert('Error', 'No se pudo eliminar la pregunta.');
    }
  };

  // Handler robusto por si QuestionTable envía un objeto o un id
  const onDeleteFromQuestionTable = (e: any) => {
    if (typeof e === 'number') setDeletingId(e);
    else if (e && typeof e.id === 'number') setDeletingId(e.id);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Área a evaluar: Impresión</Text>

      <AdvancedQuestionTable
        title="Respuestas del operador"
        formQuestions={formQuestions}
        areaId={2}
        roleId={null}
        columns={['Frente', 'Vuelta']}
        onEdit={(id, title) => {
          setEditingId(id);
          setNewTitle(title ?? '');
        }}
        onDelete={(id) => setDeletingId(id)}
      />

      <Text style={styles.label}>Muestras entregadas:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        editable={false}
        value=""
      />

      <AdvancedQuestionTable
        title="Mis respuestas"
        formQuestions={formQuestions}
        areaId={2}
        roleId={3}
        columns={['Frente', 'Vuelta']}
        onEdit={(id, title) => {
          setEditingId(id);
          setNewTitle(title ?? '');
        }}
        onDelete={(id) => setDeletingId(id)}
      />

      <Text style={styles.sectionTitle}>Tonos y/o Densidades Contra</Text>
      <View style={styles.radioGroup}>
        <Text>◯ Prueba de color</Text>
        <Text>◯ VoBo Perfil</Text>
        <Text>◯ Prueba digital</Text>
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
              theme={{ roundness: 30 }}
              mode="outlined"
              activeOutlineColor="#000"
              placeholder="Nuevo título"
            />
            <View style={styles.modalButtons}>
              <Pressable onPress={() => setEditingId(null)} style={styles.cancelButton}>
                <Text>Cancelar</Text>
              </Pressable>
              <Pressable onPress={() => handleUpdateTitle(editingId, newTitle)} style={styles.saveButton}>
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
              <Pressable onPress={() => setDeletingId(null)} style={styles.cancelButton}>
                <Text>Cancelar</Text>
              </Pressable>
              <Pressable onPress={() => handleDeleteQuestion(deletingId)} style={styles.deleteButton}>
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
  container: { backgroundColor: '#fdfaf6', marginTop: 10 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'left', color: '#1f2937' },
  label: { marginTop: 12, fontWeight: '500' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  cancelButton: { padding: 10, backgroundColor: '#BBBBBB', borderRadius: 6 },
  saveButton: { padding: 10, backgroundColor: '#0070f3', borderRadius: 6 },
  deleteButton: { padding: 10, backgroundColor: '#D9534F', borderRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: '#00000077', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '80%', backgroundColor: '#FFF', padding: 20, borderRadius: 12, elevation: 10 },
  input: { padding: 10, height: 44, marginVertical: 8, width: '90%', backgroundColor: '#fff' },
  radioGroup: { gap: 10, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomColor: '#eee', borderBottomWidth: 1, paddingVertical: 10 },
  cell: { flex: 1, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  iconButton: { marginHorizontal: 4 },
  modal: { backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  button: { backgroundColor: '#0070f3', padding: 10, borderRadius: 6, minWidth: 90, alignItems: 'center' },
});