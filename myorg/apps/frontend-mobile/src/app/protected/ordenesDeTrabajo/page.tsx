// myorg/apps/frontend-mobile/src/app/protected/ordenesDeTrabajo/page.tsx
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

// === Tipos ===
type PickedFile = {
  name: string;
  size?: number | null;
  uri: string;
  type: string; // IMPORTANTE: necesario para RN/fetch y para que cumpla FileLike
};

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_TOTAL_FILES = 8; // OT + SKU + OP + extras
const MAX_ATTACHMENTS = 5; // solo extras

// === Helpers ===
const getExt = (name?: string) => (name?.split('.').pop() || '').toLowerCase();

const guessTypeFromName = (name?: string) => {
  const ext = getExt(name);
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return 'application/octet-stream';
};

const isAllowedByExt = (name?: string) => {
  const ext = getExt(name);
  return ['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext);
};

const validateFile = (f: PickedFile) => {
  // En Android/SDKs viejos, el mime puede venir vacío: caemos a extensión
  if (f.type && ALLOWED_MIME_TYPES.includes(f.type)) return true;
  return isAllowedByExt(f.name);
};

const OrdenesDeTrabajoScreen: React.FC = () => {
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ot_id: '',
    mycard_id: '',
    quantity: '',
    comments: '',
    quantity_contacts: '24',
    total_sheets: 0,
    tipoSeleccion: 0,
    areasOperatorIds: [] as string[],
    priority: false,
  });

  const [files, setFiles] = useState<{ ot?: any; sku?: any; op?: any }>({});
  const [extraFiles, setExtraFiles] = useState<PickedFile[]>([]);

  const [areasOperator, setAreasOperator] = useState<
    { label: string; value: string; sheets: number }[]
  >([]);
  const [dropdowns, setDropdowns] = useState(1);
  const [openStates, setOpenStates] = useState<Record<number, boolean>>({});
  const [totalSheets, setTotalSheets] = useState(0);

  useEffect(() => {
    getAreasOperator()
      .then(setAreasOperator)
      .catch(() => Alert.alert('Error', 'No se pudieron cargar las áreas'));
  }, []); // <-- sin dependencias

  useEffect(() => {
    // 1) Suma de sheets por áreas seleccionadas
    const areasSum = (formData.areasOperatorIds || []).reduce((acc, id) => {
      const area = areasOperator.find((a) => String(a.value) === String(id));
      return acc + Number(area?.sheets ?? 0);
    }, 0);

    // 2) Cálculo de hojas y total
    const quantity = Number(formData.quantity) || 0;
    const contacts = Number(formData.quantity_contacts) || 0;

    const hojas = contacts > 0 ? Math.ceil(quantity / contacts) : 0;
    const total =
      hojas +
      areasSum +
      (formData.tipoSeleccion == 1 ? 26 : 0) +
      Math.ceil(hojas * 0.07);

    setTotalSheets(total);
  }, [
    formData.quantity,
    formData.quantity_contacts,
    formData.areasOperatorIds,
    areasOperator, // <- aquí sí es correcto depender de esto
  ]);

  const askEmpalmeOrCollector = (): Promise<number> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Máximo 4 áreas',
        'Elige una opción',
        [
          { text: 'Empalme', onPress: () => resolve(0) }, // 0 = empalme
          { text: 'Collator', onPress: () => resolve(1) }, // 1 = collector
        ],
        { cancelable: true }
      );
    });
  };
  const handlePickFile = async (type: 'ot' | 'sku' | 'op') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const picked: PickedFile = {
        name: asset.name ?? 'archivo.pdf',
        size: asset.size ?? null,
        uri: asset.uri,
        type:
          asset.mimeType ?? guessTypeFromName(asset.name) ?? 'application/pdf',
      };

      const baseCount =
        (files.ot ? 1 : 0) + (files.sku ? 1 : 0) + (files.op ? 1 : 0);
      const replacing = files[type] ? 1 : 0;
      const newTotal = baseCount - replacing + 1 + extraFiles.length;

      if (newTotal > MAX_TOTAL_FILES) {
        Alert.alert(
          'Límite de archivos',
          `Con este archivo superas el máximo de ${MAX_TOTAL_FILES} por orden.`
        );
        return;
      }

      setFiles((prev) => ({ ...prev, [type]: picked }));
    }
  };

  const handleRemoveFile = (type: 'ot' | 'sku' | 'op') => {
    setFiles((prev) => ({ ...prev, [type]: undefined }));
  };

  const handlePickExtraFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const picked = result.assets.map<PickedFile>((a) => ({
      name: a.name ?? 'archivo',
      size: a.size ?? null,
      uri: a.uri,
      type: a.mimeType ?? guessTypeFromName(a.name),
    }));

    const validNew = picked.filter(validateFile);
    if (validNew.length < picked.length) {
      Alert.alert('Formato no permitido', 'Solo PDF/PNG/JPEG/WEBP.');
    }

    const baseCount =
      (files.ot ? 1 : 0) + (files.sku ? 1 : 0) + (files.op ? 1 : 0);
    const currentExtra = extraFiles.length;

    const availableSlotsTotal = MAX_TOTAL_FILES - (baseCount + currentExtra);
    if (availableSlotsTotal <= 0) {
      Alert.alert(
        'Límite alcanzado',
        `Ya alcanzaste el máximo de ${MAX_TOTAL_FILES} archivos por orden.`
      );
      return;
    }

    const availableSlotsExtras = MAX_ATTACHMENTS - currentExtra;
    if (availableSlotsExtras <= 0) {
      Alert.alert(
        'Límite de adjuntos',
        `Máximo ${MAX_ATTACHMENTS} adjuntos adicionales permitidos.`
      );
      return;
    }

    const toAdd = validNew.slice(
      0,
      Math.min(availableSlotsTotal, availableSlotsExtras)
    );
    if (toAdd.length < validNew.length) {
      Alert.alert(
        'Límite aplicado',
        `Se agregaron ${toAdd.length} archivo(s). Límite total ${MAX_TOTAL_FILES} y máximo ${MAX_ATTACHMENTS} adjuntos.`
      );
    }

    setExtraFiles((prev) => [...prev, ...toAdd]);
  };

  const removeExtraFileAt = (index: number) => {
    setExtraFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const AREA_NAMES: Record<string, string> = {
    '1': 'Preprensa',
    '2': 'Impresión',
    '3': 'Serigrafía',
    '4': 'Empalme',
    '5': 'Laminación',
    '6': 'Corte',
    '7': 'Color Edge',
    '8': 'Hot Stamping',
    '9': 'Milling Chip',
    '10': 'Personalización',
  };
  
  const allowedNextAreas: Record<string, string[]> = {
    '1': ['2', '3'],        // después de Preprensa → Impresión o Serigrafía
    '2': ['2', '3', '4'],   // después de Impresión → Serigrafía, Empalme o Impresión
    '3': ['2', '4', '6'],   // después de Serigrafía → Impresión, Empalme o Corte
    '4': ['5'],             // después de Empalme → Laminación  ✅ clave del problema
    '5': ['3', '6'],
    '6': ['8', '9', '10', '7'],
    '7': ['8', '9', '10'],
    '8': ['9', '10', '7'],
    '9': ['7', '9', '10'],
    '10': ['7', '10'],
  };

  const handleAreaChange = (rawValue: any, index: number) => {
    const value = String(rawValue ?? '');
    console.log('Values', index, value);
  
    setFormData((prev) => {
      const updated = [...prev.areasOperatorIds];
  
      // 1) Primera área obligatoriamente Preprensa (1) o vacío
      if (index === 0) {
        if (value !== '' && value !== '1') {
          Alert.alert(
            '⚠️ Área inicial incorrecta',
            'La primera área debe ser la de Preprensa (ID: 1).',
            [
              {
                text: 'Limpiar áreas',
                onPress: () =>
                  setFormData((p) => ({ ...p, areasOperatorIds: [] })),
                style: 'destructive',
              },
              { text: 'Cancelar', style: 'cancel' },
            ]
          );
          return prev; // no actualizar
        }
        updated[0] = value;
        for (let k = 1; k < updated.length; k++) updated[k] = '';
        return { ...prev, areasOperatorIds: updated };
      }
  
      // 2) Para el resto, valida con el valor previo
      const prevRaw = prev.areasOperatorIds[index - 1];
      const previousValue: string = typeof prevRaw === 'string' ? prevRaw : '';
  
      if (!previousValue) {
        Alert.alert('⚠️ Área inválida', 'Selecciona primero el área anterior.');
        return prev;
      }
  
      if (value === '') {
        updated[index] = '';
        for (let k = index + 1; k < updated.length; k++) updated[k] = '';
        return { ...prev, areasOperatorIds: updated };
      }
  
      const allowed = allowedNextAreas[previousValue] || [];
      if (!allowed.includes(value)) {
        const allowedNames = allowed.map((v) => AREA_NAMES[v] ?? v).join(', ');
        Alert.alert(
          '⚠️ Área no permitida',
          `Después de ${AREA_NAMES[previousValue] ?? previousValue} solo puede ir: ${allowedNames}`
        );
        return prev;
      }
  
      updated[index] = value;
      for (let k = index + 1; k < updated.length; k++) updated[k] = '';
  
      // 3) Si selecciona Empalme, preguntar tipo
      if (value === '4') {
        setTimeout(() => {
          askEmpalmeOrCollector().then((tipo) => {
            setFormData((p) => ({ ...p, tipoSeleccion: tipo }));
          });
        }, 0);
      }
  
      return { ...prev, areasOperatorIds: updated };
    });
  };

  const handleSubmit = async () => {
    const { ot_id, mycard_id, quantity, comments, total_sheets, areasOperatorIds } = formData;

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
      Alert.alert(
        '⚠️ Archivos obligatorios',
        'Debes subir OT, SKU y OP (PDF).'
      );
      return;
    }

    const totalFiles =
      (files.ot ? 1 : 0) +
      (files.sku ? 1 : 0) +
      (files.op ? 1 : 0) +
      extraFiles.length;

    if (extraFiles.length > MAX_ATTACHMENTS) {
      Alert.alert(
        'Límite de adjuntos',
        `Máximo ${MAX_ATTACHMENTS} adjuntos adicionales permitidos.`
      );
      return;
    }
    if (totalFiles > MAX_TOTAL_FILES) {
      Alert.alert(
        'Límite total',
        `Máximo ${MAX_TOTAL_FILES} archivos por orden. Actualmente: ${totalFiles}.`
      );
      return;
    }

    try {
      await createWorkOrder(
        { ...formData, total_sheets: totalSheets },   
        {
          ot: files.ot,
          sku: files.sku,
          op: files.op,
          attachments: extraFiles,
        }
      );
      Alert.alert('✅ Orden creada', 'La orden se envió correctamente.');
      setFormData({
        ot_id: '',
        mycard_id: '',
        quantity: '',
        comments: '',
        total_sheets: 0,
        quantity_contacts: '',
        tipoSeleccion: 1,
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
            focusedInput === 'total_sheets' && styles.inputFocused,
          ]}
          theme={{ roundness: 30 }}
          mode="outlined"
          activeOutlineColor="#000"
          keyboardType="numeric"
          value={String(totalSheets)}
          onFocus={() => setFocusedInput('total_sheets')}
          onBlur={() => setFocusedInput(null)}
          editable={false}
        />

        <TextInput
          placeholder="Cantidad de Contactos:"
          style={[
            styles.input,
            focusedInput === 'quantity_contacts' && styles.inputFocused,
          ]}
          theme={{ roundness: 30 }}
          mode="outlined"
          activeOutlineColor="#000"
          keyboardType="numeric"
          value={formData.quantity_contacts}
          onFocus={() => setFocusedInput('quantity_contacts')}
          onBlur={() => setFocusedInput(null)}
          onChangeText={(text) =>
            setFormData({ ...formData, quantity_contacts: text })
          }
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
            setValue={(incoming) => {
              const current = formData.areasOperatorIds[i] || null;
              const newValue =
                typeof incoming === 'function' ? incoming(current) : incoming;
              handleAreaChange(newValue, i);
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

        <Text style={styles.sectionTitle}>
          Adjuntos adicionales (PDF / Imágenes)
        </Text>
        <View style={styles.fileInputBox}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickExtraFiles}
          >
            <Text style={styles.uploadText}>📎 Agregar adjuntos</Text>
          </TouchableOpacity>

          {extraFiles.length > 0 && (
            <View style={{ marginTop: 8 }}>
              {extraFiles.map((f, idx) => (
                <View key={`${f.name}-${idx}`} style={styles.uploadedFileRow}>
                  <Text style={styles.fileLabel} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeExtraFileAt(idx)}>
                    <Text style={styles.removeFile}>✖</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <Text style={{ marginTop: 6, color: '#555' }}>
                {extraFiles.length} archivo(s) añadidos. Máximo{' '}
                {MAX_ATTACHMENTS} adjuntos. Límite total: {MAX_TOTAL_FILES}.
              </Text>
            </View>
          )}
        </View>

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
