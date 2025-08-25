import React, { useState, useMemo } from 'react';
import { TextInput } from 'react-native-paper';
import { View, Text, StyleSheet, Alert, Modal, Pressable } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { deleteFormQuestion, updateFormQuestion } from '../../api/configVistosBuenos';

// ⭐ Importa tu tabla avanzada
import { AdvancedQuestionTable } from './util/FormQuestionTablePersos';
interface Area { id: number; name: string }
interface FormQuestion {
  id: number;
  title: string;
  role_id: number | null;
  areas: Area[];
}

interface Props {
  formQuestion: FormQuestion[];
}

export default function Personalizacion({ formQuestion }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>(formQuestion);
  const [selectedOption, setSelectedOption] = useState<'etiquetadora'|'persos'|'laser'|'packsmart'|'otto'|'embolsadora'>('etiquetadora');

  // ====== handlers existentes ======
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
        setFormQuestions(prev => prev.filter(q => q.id !== id));
        setDeletingId(null);
      } else {
        Alert.alert("Error", "No se pudo eliminar la pregunta.");
      }
    } catch (err) {
      console.error("Error eliminando pregunta:", err);
    }
  };

  // ====== utilidades ======
  const areaId = 10;

  // RANGOS ORIGINALES
  const rangesOperador: Record<typeof selectedOption, {start:number,end:number} | null> = {
    etiquetadora: { start: 0, end: 1 },
    persos:       { start: 1, end: 10 },
    laser:        null, // no hay preguntas de operador
    packsmart:    { start: 14, end: 20 },
    otto:         { start: 20, end: 28 },
    embolsadora:  { start: 28, end: 30 },
  };

  const rangesCalidad: Record<typeof selectedOption, {start:number,end:number} | null> = {
    persos: { start: 13, end: 15 }, // role_id = 3
    laser:  { start: 10, end: 13 },
    etiquetadora: null,
    packsmart:    null,
    otto:         null,
    embolsadora:  null,
  };

   // helper: filtro base por área y rol
   const baseFilter = (list: FormQuestion[], roleId: number | null) =>
    list.filter(
      (q) => (roleId == null || q.role_id === roleId) && q.areas?.some(a => a.id === areaId)
    );

  // columnas (puedes hacerlas dinámicas por máquina)
  const columns = useMemo(() => (['Respuesta']), [selectedOption]);

  // título de la tarjeta por máquina (opcional/estético)
  const operatorTitle = useMemo(() => {
    const names: Record<string,string> = {
      etiquetadora: 'Etiquetadora',
      persos: "Persos's",
      laser: 'Láser',
      packsmart: 'Packsmart',
      otto: 'Otto',
      embolsadora: 'Embolsadora',
    };
    return `Operador • ${names[selectedOption]}`;
  }, [selectedOption]);

  const qualityTitle = useMemo(() => `Calidad • ${operatorTitle.split('•')[1]?.trim() ?? ''}`, [operatorTitle]);

  const operatorQuestions = useMemo(() => {
    const range = rangesOperador[selectedOption];
    if (!range) return []; // p.ej. laser operador
    // 1) slice primero sobre TODO el arreglo
    const sliced = formQuestions.slice(range.start, range.end);
    // 2) luego filtra por área y rol
    return baseFilter(sliced, null);
  }, [formQuestions, selectedOption]);
  
  const qualityQuestions = useMemo(() => {
    const range = rangesCalidad[selectedOption];
    if (!range) return []; // sin preguntas de calidad para esa máquina
    // 1) slice primero
    const sliced = formQuestions.slice(range.start, range.end);
    // 2) luego filtra por área y rol = 3
    return baseFilter(sliced, 3);
  }, [formQuestions, selectedOption]);


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Área a evaluar: Personalización</Text>

      <Text style={styles.subtitle}>Respuestas del operador</Text>
      <RadioButton.Group onValueChange={(v) => setSelectedOption(v as any)} value={selectedOption}>
        <View style={styles.radioOption}><RadioButton value="etiquetadora" color="#0070f3" /><Text>Etiquetadora</Text></View>
        <View style={styles.radioOption}><RadioButton value="persos" color="#0070f3" /><Text>Persos's</Text></View>
        <View style={styles.radioOption}><RadioButton value="laser" color="#0070f3" /><Text>Láser</Text></View>
        <View style={styles.radioOption}><RadioButton value="packsmart" color="#0070f3" /><Text>Packsmart</Text></View>
        <View style={styles.radioOption}><RadioButton value="otto" color="#0070f3" /><Text>Otto</Text></View>
        <View style={styles.radioOption}><RadioButton value="embolsadora" color="#0070f3" /><Text>Embolsadora</Text></View>
      </RadioButton.Group>

      {/* ======= TABLA OPERADOR (role_id = null) ======= */}
      {selectedOption === 'laser' ? (
        <Text style={{ marginTop: 8 }}>No hay preguntas por parte del operador.</Text>
      ) : (
        <AdvancedQuestionTable
          title={operatorTitle}
          formQuestions={operatorQuestions}
          areaId={areaId}
          roleId={null}               // operador
          columns={columns}
          readOnly={false}
          onEdit={(id, currentTitle) => { setEditingId(id); setNewTitle(currentTitle); }}
          onDelete={(id) => setDeletingId(id)}
        />
      )}

      {/* Campos extra por máquina (operador) */}
      <View style={{ marginVertical: 10 }}>
        {selectedOption === 'etiquetadora' && (
          <>
            <Text style={styles.label}>Verificar Tipo De Etiqueta Vs Ot Y Pegar Utilizada:</Text>
            <TextInput style={styles.input} theme={{ roundness: 30 }} mode="outlined" activeOutlineColor="#000" editable={false} />
            <Text style={styles.label}>Muestras entregadas:</Text>
            <TextInput style={styles.input} theme={{ roundness: 30 }} mode="outlined" activeOutlineColor="#000" editable={false} />
          </>
        )}

        {selectedOption === 'persos' && (
          <>
            <Text style={styles.label}>Color de Personalizacion:</Text>
            <TextInput style={styles.input} theme={{ roundness: 30 }} mode="outlined" activeOutlineColor="#000" editable={false} />
            <Text style={styles.label}>Tipo de Código de Barras Que Se Personaliza:</Text>
            <TextInput style={styles.input} theme={{ roundness: 30 }} mode="outlined" activeOutlineColor="#000" editable={false} />
            <Text style={styles.label}>Muestras entregadas:</Text>
            <TextInput style={styles.input} theme={{ roundness: 30 }} mode="outlined" activeOutlineColor="#000" editable={false} />
          </>
        )}

        {['packsmart','otto','embolsadora','laser'].includes(selectedOption) && (
          <>
            <Text style={styles.label}>Muestras entregadas:</Text>
            <TextInput style={styles.input} theme={{ roundness: 30 }} mode="outlined" activeOutlineColor="#000" editable={false} />
          </>
        )}
      </View>

      {/* ======= TABLA CALIDAD (role_id = 3) ======= */}
      <Text style={styles.subtitle}>Mis respuestas</Text>
      {['etiquetadora','otto','embolsadora','packsmart'].includes(selectedOption) ? (
        <Text>No hay preguntas por parte de calidad.</Text>
      ) : selectedOption === 'persos' ? (
        <>
          <AdvancedQuestionTable
            title={qualityTitle}
            formQuestions={qualityQuestions}
            areaId={areaId}
            roleId={3}               // calidad
            columns={columns /* o ['Frente','Vuelta'] si lo necesitas */}
            readOnly={false}
            onEdit={(id, currentTitle) => { setEditingId(id); setNewTitle(currentTitle); }}
            onDelete={(id) => setDeletingId(id)}
          />
          <Text style={styles.label}>Validar Carga De Aplicación (PersoMaster) Anotar:</Text>
          <TextInput style={styles.input} theme={{ roundness: 30 }} mode="outlined" activeOutlineColor="#000" editable={false} />
        </>
      ) : (
        // selectedOption === 'laser'
        <>
          <AdvancedQuestionTable
            title={qualityTitle}
            formQuestions={qualityQuestions}
            areaId={areaId}
            roleId={3}
            columns={columns /* o ['Frente','Vuelta'] */}
            readOnly={false}
            onEdit={(id, currentTitle) => { setEditingId(id); setNewTitle(currentTitle); }}
            onDelete={(id) => setDeletingId(id)}
          />
          <Text style={styles.label}>Verificar Script / Layout Vs Ot / Autorización, Favor De Anotar:</Text>
          <TextInput style={styles.input} theme={{ roundness: 30 }} mode="outlined" activeOutlineColor="#000" editable={false} />
          <Text style={styles.label}>Validar, Anotar Kcv (Llaves), Carga De Aplicación O Prehabilitación (Si Aplica):</Text>
          <TextInput style={styles.input} theme={{ roundness: 30 }} mode="outlined" activeOutlineColor="#000" editable={false} />
          <Text style={styles.label}>Describir Apariencia Del Quemado Del Láser (Color):</Text>
          <TextInput style={styles.input} theme={{ roundness: 30 }} mode="outlined" activeOutlineColor="#000" editable={false} />
        </>
      )}

      {/* ===== Modales existentes ===== */}
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
              <Pressable onPress={() => setEditingId(null)} style={styles.cancelButton}><Text>Cancelar</Text></Pressable>
              <Pressable onPress={() => handleUpdateTitle(editingId!, newTitle)} style={styles.saveButton}><Text>Guardar</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  container: { backgroundColor: '#fdfaf6', marginTop: 10 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#1f2937' },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 20 },
  radioOption: { flexDirection: 'row', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: '#00000077', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '80%', backgroundColor: '#FFF', padding: 20, borderRadius: 12, elevation: 10 },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 12 },
  label: { marginTop: 12, fontWeight: '500' },
  input: { padding: 10, height: 20, marginVertical: 8, width: '90%', backgroundColor: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  cancelButton: { padding: 10, backgroundColor: '#BBBBBB', borderRadius: 6 },
  saveButton: { padding: 10, backgroundColor: '#0070f3', borderRadius: 6 },
  deleteButton: { padding: 10, backgroundColor: '#D9534F', borderRadius: 6 },
});