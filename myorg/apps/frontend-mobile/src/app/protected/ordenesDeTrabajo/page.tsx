'use client';

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Button,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { TextInput } from 'react-native-paper';
import Checkbox from 'expo-checkbox';
import {
  getAreasOperator,
  createWorkOrder,
} from '../../../api/ordenesDeTrabajo';

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
  const [areasOperator, setAreasOperator] = useState<
    { label: string; value: string }[]
  >([]);
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

  const handleAreaChange = (callback: any, index: number) => {
    const value = typeof callback === 'function' ? callback(null) : callback;

    // Validación para el primer área (debe ser 1 - Preprensa)
    if (index === 0 && value !== '1') {
      Alert.alert(
        '⚠️ Área inicial incorrecta',
        'La primera área debe ser la de Preprensa (ID: 1).',
        [
          {
            text: 'Limpiar áreas',
            onPress: () => {
              setFormData((prev) => ({
                ...prev,
                areasOperatorIds: [],
              }));
              setDropdowns(1);
            },
            style: 'destructive',
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    // Validación para el segundo área (debe ser 2 o 3)
    if (index === 1 && value !== '2' && value !== '3' && value !== '') {
      Alert.alert(
        '⚠️ Área no permitida',
        'La siguiente área solo puede ser Impresión o Serigrafia'
      );
      return;
    }

    if (
      index === 2 &&
      value !== '2' &&
      value !== '3' &&
      value !== '4' &&
      value !== ''
    ) {
      Alert.alert(
        '⚠️ Área no permitida',
        'La siguiente área solo puede ser Serigrafia, Empalme o Impresion'
      );
      return;
    }

    if (
      index === 3 &&
      value !== '2' &&
      value !== '4' &&
      value !== '6' &&
      value !== ''
    ) {
      Alert.alert(
        '⚠️ Área no permitida',
        'La siguiente área solo puede ser Impresión, Empalme o Corte'
      );
      return;
    }

    if (index === 4 && value !== '5' && value !== '') {
      Alert.alert(
        '⚠️ Área no permitida',
        'La siguiente área solo puede ser Laminación'
      );
      return;
    }

    if (index === 5 && value !== '3' && value !== '6' && value !== '') {
      Alert.alert(
        '⚠️ Área no permitida',
        'La siguiente área solo puede ser Corte o Serigrafia'
      );
      return;
    }

    if (
      index === 6 &&
      value !== '8' &&
      value !== '9' &&
      value !== '10' &&
      value !== '7' &&
      value !== ''
    ) {
      Alert.alert(
        '⚠️ Área no permitida',
        'La siguiente área solo puede ser Hot Stamping, Milling Chip, Personalización o Color Edge'
      );
      return;
    }

    if (
      index === 7 &&
      value !== '8' &&
      value !== '9' &&
      value !== '10' &&
      value !== ''
    ) {
      Alert.alert(
        '⚠️ Área no permitida',
        'La siguiente área solo puede ser Hot Stamping, Milling Chip o Personalización'
      );
      return;
    }

    if (
      index === 8 &&
      value !== '9' &&
      value !== '10' &&
      value !== '7' &&
      value !== ''
    ) {
      Alert.alert(
        '⚠️ Área no permitida',
        'La siguiente área solo puede ser Milling Chip, Personalización o Color Edge'
      );
      return;
    }

    if (
      index === 9 &&
      value !== '7' &&
      value !== '9' &&
      value !== '10' &&
      value !== ''
    ) {
      Alert.alert(
        '⚠️ Área no permitida',
        'La siguiente área solo puede ser Color Edge, Hot Stamping o Personalización'
      );
      return;
    }

    if (index === 10 && value !== '7' && value !== '10' && value !== '') {
      Alert.alert(
        '⚠️ Área no permitida',
        'La siguiente área solo puede ser Color Edge o Personalización'
      );
      return;
    }

    // Actualizar el estado si pasa todas las validaciones
    const updated = [...formData.areasOperatorIds];
    updated[index] = value;
    setFormData({ ...formData, areasOperatorIds: updated });
  };

  const handleSubmit = async () => {
    const { ot_id, mycard_id, quantity, comments, areasOperatorIds } = formData;

    if (
      !ot_id.trim() ||
      !mycard_id.trim() ||
      !quantity.trim() ||
      !comments.trim()
    ) {
      Alert.alert(
        '❗ Datos incompletos',
        'Todos los campos son obligatorios excepto la prioridad.'
      );
      return;
    }

    if (areasOperatorIds.length < 3) {
      Alert.alert('⚠️ Mínimo 3 áreas', 'Debes seleccionar al menos 3 áreas.');
      return;
    }

    if (areasOperatorIds[0] !== '1') {
      Alert.alert(
        '⚠️ Área inicial incorrecta',
        'La primera área debe ser la de Preprensa (ID: 1).'
      );
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

  const cantidadHojas: number =
    Math.ceil(parseInt(formData.quantity) / 24) || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Crear nueva orden de trabajo</Text>

      <ScrollView style={styles.scrollArea}>
        <TextInput
          placeholder="Número de Orden"
          style={[
            styles.input,
            focusedInput === 'ot_id' && styles.inputFocused,
          ]}
          theme={{ roundness: 30 }}
          mode="outlined"
          activeOutlineColor="#000"
          value={formData.ot_id}
          onFocus={() => setFocusedInput('ot_id')}
          onBlur={() => setFocusedInput(null)}
          onChangeText={(text) => setFormData({ ...formData, ot_id: text })}
        />
        <TextInput
          placeholder="ID del Presupuesto"
          style={[
            styles.input,
            focusedInput === 'mycard_id' && styles.inputFocused,
          ]}
          theme={{ roundness: 30 }}
          mode="outlined"
          activeOutlineColor="#000"
          value={formData.mycard_id}
          onFocus={() => setFocusedInput('mycard_id')}
          onBlur={() => setFocusedInput(null)}
          onChangeText={(text) => setFormData({ ...formData, mycard_id: text })}
        />
        <TextInput
          placeholder="Cantidad (TARJETAS)"
          style={[
            styles.input,
            focusedInput === 'quantity' && styles.inputFocused,
          ]}
          theme={{ roundness: 30 }}
          mode="outlined"
          activeOutlineColor="#000"
          keyboardType="numeric"
          value={formData.quantity}
          onFocus={() => setFocusedInput('quantity')}
          onBlur={() => setFocusedInput(null)}
          onChangeText={(text) => setFormData({ ...formData, quantity: text })}
        />
        <TextInput
          placeholder="Cantidad (Hojas Frente / Hojas Vuelta)"
          style={[
            styles.input,
            focusedInput === 'quantity' && styles.inputFocused,
          ]}
          theme={{ roundness: 30 }}
          mode="outlined"
          activeOutlineColor="#000"
          keyboardType="numeric"
          value={cantidadHojas.toString()}
          onFocus={() => setFocusedInput('quantity')}
          onBlur={() => setFocusedInput(null)}
          editable={false}
        />
        <TextInput
          placeholder="Comentarios"
          style={[
            styles.input,
            focusedInput === 'comments' && styles.inputFocused,
            { height: 80 },
          ]}
          theme={{ roundness: 30 }}
          mode="outlined"
          activeOutlineColor="#000"
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
            listMode="SCROLLVIEW"
            open={!!openStates[i]}
            setOpen={(val) => {
              const isOpen =
                typeof val === 'function' ? val(!!openStates[i]) : val;
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
            setValue={(callback) => handleAreaChange(callback, i)}
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
                setOpenStates((prev) => ({ ...prev, [d]: false }));
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
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handlePickFile(type)}
            >
              <Text style={styles.uploadText}>
                📄 Subir {type.toUpperCase()}
              </Text>
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

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Crear Orden de Trabajo</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default OrdenesDeTrabajoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fdfaf6',
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
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 30,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: '#000',
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
    marginVertical: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  fileInputRow: { marginBottom: 12 },
  fileName: { marginTop: 5, fontSize: 13, color: '#444' },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 8,
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
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
    height: 50,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
});
