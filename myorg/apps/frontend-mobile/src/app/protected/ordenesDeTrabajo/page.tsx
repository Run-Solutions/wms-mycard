"use client";

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Button,
  Alert,
  Platform
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAreasOperator, createWorkOrder } from '../../../api/ordenesDeTrabajo';

const OrdenesDeTrabajoScreen: React.FC = () => {
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ot_id: '',
    mycard_id: '',
    quantity: '',
    comments: '',
    areasOperatorIds: [] as string[],
    priority: false,
  });

  const [files, setFiles] = useState<{ ot?: any; sku?: any; op?: any }>({});
  const [areasOperator, setAreasOperator] = useState<{ label: string; value: string }[]>([]);
  const [dropdowns, setDropdowns] = useState(1);
  const [openStates, setOpenStates] = useState<Record<number, boolean>>({});

  useEffect(() => {
    getAreasOperator()
      .then(setAreasOperator)
      .catch(() => Alert.alert('Error', 'No se pudieron cargar las áreas'));
  }, []);

  const handlePickFile = async (type: 'ot' | 'sku' | 'op') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
    });

    if (!result.canceled) {
      setFiles((prev) => ({ ...prev, [type]: result.assets[0] }));
    }
  };

  const handleRemoveFile = (type: 'ot' | 'sku' | 'op') => {
    setFiles((prev) => ({ ...prev, [type]: undefined }));
  };

  const handleSubmit = async () => {
    const { ot_id, mycard_id, quantity, comments, areasOperatorIds } = formData;
  
    if (!ot_id.trim() || !mycard_id.trim() || !quantity.trim() || !comments.trim()) {
      Alert.alert('❗ Datos incompletos', 'Todos los campos son obligatorios excepto la prioridad.');
      return;
    }
  
    if (areasOperatorIds.length < 3) {
      Alert.alert('⚠️ Mínimo 3 áreas', 'Debes seleccionar al menos 3 áreas.');
      return;
    }
  
    if (areasOperatorIds[0] !== '1') {
      Alert.alert('⚠️ Área inicial incorrecta', 'La primera área debe ser la de Preprensa (ID: 1).');
      return;
    }
  
    if (!files.ot || !files.sku || !files.op) {
      Alert.alert('⚠️ Archivos obligatorios', 'Debes subir OT, SKU y OP.');
      return;
    }
  
    try {
      await createWorkOrder(formData, {
        ot: files.ot,
        sku: files.sku,
        op: files.op,
      });
      Alert.alert('✅ Orden creada', 'La orden se envió correctamente.');
      setFormData({
        ot_id: '',
        mycard_id: '',
        quantity: '',
        comments: '',
        areasOperatorIds: [],
        priority: false,
      });
      setFiles({});
      setDropdowns(1);
    } catch (err: any) {
      Alert.alert('La OT es duplicada');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Crear nueva orden de trabajo</Text>
    
    <ScrollView style={styles.scrollArea}>

      <TextInput
        placeholder="Número de Orden"
        style={[
          styles.input,
          focusedInput === 'ot_id' && styles.inputFocused
        ]}
        value={formData.ot_id}
        onFocus={() => setFocusedInput('ot_id')}
        onBlur={() => setFocusedInput(null)}
        onChangeText={(text) => setFormData({ ...formData, ot_id: text })}
      />
      <TextInput
        placeholder="ID del Presupuesto"
        style={[
          styles.input,
          focusedInput === 'mycard_id' && styles.inputFocused
        ]}
        value={formData.mycard_id}
        onFocus={() => setFocusedInput('mycard_id')}
        onBlur={() => setFocusedInput(null)}
        onChangeText={(text) => setFormData({ ...formData, mycard_id: text })}
      />
      <TextInput
        placeholder="Cantidad"
        style={[
          styles.input,
          focusedInput === 'quantity' && styles.inputFocused
        ]}
        keyboardType="numeric"
        value={formData.quantity}
        onFocus={() => setFocusedInput('quantity')}
        onBlur={() => setFocusedInput(null)}
        onChangeText={(text) => setFormData({ ...formData, quantity: text })}
      />
      <TextInput
        placeholder="Comentarios"
        style={[styles.input,
          focusedInput === 'comments' && styles.inputFocused,
          { height: 80 }
        ]}
        multiline
        value={formData.comments}
        onFocus={() => setFocusedInput('comments')}
        onBlur={() => setFocusedInput(null)}
        onChangeText={(text) => setFormData({ ...formData, comments: text })}
      />

      <Text style={styles.sectionTitle}>Flujo Asignado</Text>
      {Array.from({ length: dropdowns }).map((_, i) => (
      <DropDownPicker
        style={styles.input} // igual que tu TextInput
        dropDownContainerStyle={styles.dropdown} // para el menú desplegable
        textStyle={{ fontSize: 16, color: '#000' }} // estilo del texto
        placeholderStyle={{ color: '#888' }} // estilo del placeholder
        labelStyle={{ fontSize: 16 }} // estilo de los ítems
          key={i}
          items={areasOperator}
          listMode="SCROLLVIEW" // 👈 evitar conflictos con ScrollViews
          open={!!openStates[i]}
          setOpen={(val) => {
            const isOpen = typeof val === 'function' ? val(!!openStates[i]) : val;
            setOpenStates((prev) => {
              const newState: Record<number, boolean> = {};
              Object.keys(prev).forEach((key) => {
                newState[+key] = false;
              });
              newState[i] = isOpen;
              return newState;
            });
          }}
          value={formData.areasOperatorIds[i] || null}
          setValue={(callback: any) => {
            const value = typeof callback === 'function' ? callback(null) : callback;
            const updated = [...formData.areasOperatorIds];
            updated[i] = value;
            setFormData({ ...formData, areasOperatorIds: updated });
          }}
          placeholder="Selecciona un área"
          containerStyle={{ marginBottom: 10 }}
          zIndex={1000 - i}
      />
    ))}

      <View style={styles.buttonsRow}>
      <Button
        title="➕ Área"
        onPress={() => {
          setDropdowns((d) => {
            setOpenStates((prev) => ({ ...prev, [d]: false })); // 👈 aquí estaba mal
            return d + 1;
          });
        }}
      />
        {dropdowns > 1 && (
          <Button
          title="➖ Quitar"
          onPress={() => {
            setDropdowns((d) => {
              setOpenStates((prev) => {
                const updated = { ...prev };
                delete updated[d - 1]; // elimina el último abierto
                return updated;
              });
              return d - 1;
            });
        
            setFormData((prev) => {
              const updated = [...prev.areasOperatorIds];
              updated.pop();
              return { ...prev, areasOperatorIds: updated };
            });
          }}
        />
        )}
      </View>

      <Text style={styles.sectionTitle}>Archivos PDF</Text>
      {(['ot', 'sku', 'op'] as const).map((type) => (
        <View key={type} style={styles.fileInputBox}>
          <TouchableOpacity style={styles.uploadButton} onPress={() => handlePickFile(type)}>
            <Text style={styles.uploadText}>📄 Subir {type.toUpperCase()}</Text>
          </TouchableOpacity>

          {files[type] && (
            <View style={styles.uploadedFileRow}>
              <Text style={styles.fileLabel}>{files[type].name}</Text>
              <TouchableOpacity onPress={() => handleRemoveFile(type)}>
                <Text style={styles.removeFile}>✖</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      <View style={styles.checkboxRow}>
        <Checkbox
          value={formData.priority}
          onValueChange={(val) => setFormData({ ...formData, priority: val })}
        />
        <Text style={{ marginLeft: 8 }}>Prioridad</Text>
      </View>

      <View style={styles.submitButton}>
        <Button
          title="Crear Orden"
          onPress={handleSubmit}
          color={Platform.OS === 'ios' ? '#fff' : '#0038A8'} // color texto para Android
        />
      </View>
    </ScrollView>
    </View>
  );
};

export default OrdenesDeTrabajoScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
    backgroundColor: '#fdfaf6'
  },
  header: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 16,
    textAlign: 'center',
    color: 'black',
    padding: Platform.OS === 'ios' ? 14 : 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 50,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: '#000', // ⬅️ Borde negro en foco
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 18,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  sectionTitle: { 
    fontWeight: 'bold', 
    fontSize: 18,
    marginVertical: 12 
  },
  buttonsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginVertical: 10
  },
  fileInputRow: { marginBottom: 12 },
  fileName: { marginTop: 5, fontSize: 13, color: '#444' },
  checkboxRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10, 
    marginLeft: 8
  },
  fileInputBox: {
    marginBottom: 16,
  },
  
  uploadButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  
  uploadText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  
  uploadedFileRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    padding: 10,
  },
  
  fileLabel: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
  
  removeFile: {
    marginLeft: 8,
    fontSize: 18,
    color: '#d00',
    fontWeight: 'bold',
  },
  submitButton: {
    height: 50,
    marginBottom: 40,
    backgroundColor: '#0038A8',
    borderRadius: 18,
    paddingTop: 5,
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
});