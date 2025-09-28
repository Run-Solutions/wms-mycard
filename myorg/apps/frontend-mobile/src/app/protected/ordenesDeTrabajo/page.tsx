// myorg/apps/frontend-mobile/src/app/protected/ordenesDeTrabajo/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { TextInput } from 'react-native-paper';
import Checkbox from 'expo-checkbox';
import {
  getAreasOperator,
  createWorkOrder,
} from '../../../api/ordenesDeTrabajo';

// ==== Tipos compatibles con RN/Web para API ====
type FileLike = {
  uri: string;
  name: string;
  type: string;
  size?: number | null;
};
type PickedFile = FileLike;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const ALLOWED_PDF_TYPES = ['application/pdf'] as const;

const MAX_TOTAL_FILES = 9;
const MAX_ATTACHMENTS = 5;

// ===== Helpers ext/mime =====
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

// ===== Validaciones =====
const validatePdfFile = (f: PickedFile) => {
  const ok =
    (f.type && ALLOWED_PDF_TYPES.includes(f.type as any)) ||
    getExt(f.name) === 'pdf';
  if (!ok) {
    Alert.alert('Formato inválido', `"${f.name}" no es un PDF válido.`);
  }
  return ok;
};
const validateImageFile = (f: PickedFile) => {
  const ok =
    (f.type && (ALLOWED_IMAGE_TYPES as readonly string[]).includes(f.type)) ||
    ['png', 'jpg', 'jpeg', 'webp'].includes(getExt(f.name));
  if (!ok) {
    Alert.alert(
      'Formato no permitido',
      `Solo PNG/JPEG/WEBP. Archivo: ${f.name}`
    );
  }
  return ok;
};
const validateAnyFile = (f: PickedFile) =>
  (f.type && ALLOWED_MIME_TYPES.includes(f.type)) || isAllowedByExt(f.name);

// ===== Pantalla =====
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

  // 👇 Usa PickedFile en móvil (no File del DOM)
  const [files, setFiles] = useState<{
    ot: PickedFile | null;
    sku: PickedFile | null;
    op: PickedFile | null;
    cardImage: PickedFile | null; // imagen de tarjeta
  }>({ ot: null, sku: null, op: null, cardImage: null });

  const [extraFiles, setExtraFiles] = useState<PickedFile[]>([]);

  const [areasOperator, setAreasOperator] = useState<
    { label: string; value: string; sheets: number }[]
  >([]);
  const [dropdowns, setDropdowns] = useState(1);
  const [openStates, setOpenStates] = useState<Record<number, boolean>>({});
  const [totalSheets, setTotalSheets] = useState(0);

  // === Carga de áreas, normalizando como en web ===
  useEffect(() => {
    getAreasOperator()
      .then((data: any[]) =>
        setAreasOperator(
          (data || []).map((a: any) => ({
            label: a.label,
            value: String(a.value),
            sheets: Number(a.sheets ?? a.sheets_count ?? 0),
          }))
        )
      )
      .catch(() => Alert.alert('Error', 'No se pudieron cargar las áreas'));
  }, []);

  // === Cálculo total_sheets igual a web ===
  useEffect(() => {
    const areasSum = (formData.areasOperatorIds || []).reduce((acc, id) => {
      const area = areasOperator.find((a) => String(a.value) === String(id));
      return acc + Number(area?.sheets ?? 0);
    }, 0);

    const quantity = Number(formData.quantity) || 0;
    const contacts = Number(formData.quantity_contacts) || 0;

    const hojasBase = contacts > 0 ? Math.ceil(quantity / contacts) : 0;
    const extraEmpalme = formData.tipoSeleccion === 1 ? 26 : 0;
    const merma = Math.ceil(hojasBase * 0.07);

    setTotalSheets(hojasBase + areasSum + extraEmpalme + merma);
  }, [
    formData.quantity,
    formData.quantity_contacts,
    formData.tipoSeleccion,
    formData.areasOperatorIds,
    areasOperator,
  ]);

  // === Reglas de flujo, igual a web ===
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
    '1': ['2', '3'],
    '2': ['2', '3', '4'],
    '3': ['2', '4', '6'],
    '4': ['5'],
    '5': ['3', '6'],
    '6': ['8', '9', '10', '7'],
    '7': ['8', '9', '10'],
    '8': ['9', '10', '7'],
    '9': ['7', '9', '10'],
    '10': ['7', '10'],
  };

  const askEmpalmeOrCollector = (): Promise<number> =>
    new Promise((resolve) => {
      Alert.alert(
        'Empalme',
        'Elige una opción',
        [
          { text: 'Empalme', onPress: () => resolve(0) },
          { text: 'Collator', onPress: () => resolve(1) },
        ],
        { cancelable: true }
      );
    });

  const handleAreaChange = (rawValue: any, index: number) => {
    const value = String(rawValue ?? '');

    setFormData((prev) => {
      const updated = [...prev.areasOperatorIds];

      // 1) Primera área debe ser 1 o vacío
      if (index === 0) {
        if (value !== '' && value !== '1') {
          Alert.alert(
            'Área inicial incorrecta',
            'La primera área debe ser Preprensa (ID: 1).',
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
          return prev;
        }
        updated[0] = value;
        for (let k = 1; k < updated.length; k++) updated[k] = '';
        return { ...prev, areasOperatorIds: updated };
      }

      // 2) Validar secuencia
      const previousValue = prev.areasOperatorIds[index - 1] || '';
      if (!previousValue) {
        Alert.alert('Área inválida', 'Selecciona primero el área anterior.');
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
          'No permitido',
          `Después de ${
            AREA_NAMES[previousValue] ?? previousValue
          } solo puede ir: ${allowedNames}`
        );
        return prev;
      }

      updated[index] = value;
      for (let k = index + 1; k < updated.length; k++) updated[k] = '';

      if (value === '4') {
        setTimeout(() => {
          askEmpalmeOrCollector().then((tipo) =>
            setFormData((p) => ({ ...p, tipoSeleccion: tipo }))
          );
        }, 0);
      }

      return { ...prev, areasOperatorIds: updated };
    });
  };

  // ===== File pickers =====
  const handlePickPdf = async (type: 'ot' | 'sku' | 'op') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const picked: PickedFile = {
      name: asset.name ?? 'archivo.pdf',
      size: asset.size ?? null,
      uri: asset.uri,
      type: asset.mimeType ?? guessTypeFromName(asset.name) ?? 'application/pdf',
    };

    if (!validatePdfFile(picked)) return;

    const baseCount =
      (files.ot ? 1 : 0) +
      (files.sku ? 1 : 0) +
      (files.op ? 1 : 0) +
      (files.cardImage ? 1 : 0);
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
  };

  const handlePickCardImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/png', 'image/jpeg', 'image/webp', 'image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const picked: PickedFile = {
      name: asset.name ?? 'imagen',
      size: asset.size ?? null,
      uri: asset.uri,
      type: asset.mimeType ?? guessTypeFromName(asset.name) ?? 'image/*',
    };

    if (!validateImageFile(picked)) return;

    const baseCount =
      (files.ot ? 1 : 0) +
      (files.sku ? 1 : 0) +
      (files.op ? 1 : 0) +
      (files.cardImage ? 1 : 0);
    const replacing = files.cardImage ? 1 : 0;
    const newTotal = baseCount - replacing + 1 + extraFiles.length;

    if (newTotal > MAX_TOTAL_FILES) {
      Alert.alert(
        'Límite de archivos',
        `Con este archivo superas el máximo de ${MAX_TOTAL_FILES} por orden.`
      );
      return;
    }

    setFiles((prev) => ({ ...prev, cardImage: picked }));
  };

  const removeMainFile = (type: 'ot' | 'sku' | 'op') =>
    setFiles((prev) => ({ ...prev, [type]: null }));
  const removeCardImage = () => setFiles((prev) => ({ ...prev, cardImage: null }));

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

    const validNew = picked.filter(validateAnyFile);
    if (validNew.length < picked.length) {
      Alert.alert('Formato no permitido', 'Solo PDF/PNG/JPEG/WEBP.');
    }

    const baseCount =
      (files.ot ? 1 : 0) +
      (files.sku ? 1 : 0) +
      (files.op ? 1 : 0) +
      (files.cardImage ? 1 : 0);
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

  const removeExtraFileAt = (index: number) =>
    setExtraFiles((prev) => prev.filter((_, i) => i !== index));

  // ===== Submit (igual a web: cardImage obligatorio) =====
  const handleSubmit = async () => {
    const {
      ot_id,
      mycard_id,
      quantity,
      comments,
      areasOperatorIds,
      priority,
    } = formData;

    if (!ot_id.trim() || !mycard_id.trim() || !quantity.trim() || !comments.trim()) {
      Alert.alert('Datos incompletos', 'Todos los campos son obligatorios excepto la prioridad.');
      return;
    }
    if (areasOperatorIds.length < 3) {
      Alert.alert('Mínimo 3 áreas', 'Debes seleccionar al menos 3 áreas.');
      return;
    }
    if (areasOperatorIds[0] !== '1') {
      Alert.alert('Área inicial', 'La primera área debe ser Preprensa (ID: 1).');
      return;
    }
    if (!files.ot || !files.sku || !files.op || !files.cardImage) {
      Alert.alert('Archivos faltantes', 'Debes subir OT, SKU, OP (PDF) y la imagen de tarjeta.');
      return;
    }

    const totalFiles =
      (files.ot ? 1 : 0) +
      (files.sku ? 1 : 0) +
      (files.op ? 1 : 0) +
      (files.cardImage ? 1 : 0) +
      extraFiles.length;

    if (extraFiles.length > MAX_ATTACHMENTS) {
      Alert.alert('Límite de adjuntos', `Máximo ${MAX_ATTACHMENTS} adjuntos.`);
      return;
    }
    if (totalFiles > MAX_TOTAL_FILES) {
      Alert.alert('Límite total', `Máximo ${MAX_TOTAL_FILES} archivos por orden.`);
      return;
    }

    try {
      await createWorkOrder(
        {
          ...formData,
          total_sheets: totalSheets,
          areasOperatorIds: areasOperatorIds.filter((v) => v !== ''),
          priority,
        },
        {
          ot: files.ot,
          sku: files.sku,
          op: files.op,
          cardImage: files.cardImage,
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
        quantity_contacts: '24',
        tipoSeleccion: 0,
        areasOperatorIds: [],
        priority: false,
      });
      setFiles({ ot: null, sku: null, op: null, cardImage: null });
      setDropdowns(1);
      setExtraFiles([]);
    } catch (err: any) {
      // Intenta traer metadatos de error propagados desde createWorkOrder
      const msg = [
        '❌ Error creando OT:',
        err?.message ? `\n• message: ${err.message}` : '',
        err?.status ? `\n• status: ${err.status}` : '',
        err?.url ? `\n• url: ${err.url}` : '',
        err?.responseText ? `\n• body: ${err.responseText}` : '',
      ].join('');
    
      console.error('[createWorkOrder] fallo:', err);
      Alert.alert('Error al enviar', msg || 'Revisa la consola para más detalles.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Crear nueva orden de trabajo</Text>

      <ScrollView style={styles.scrollArea}>
        <TextInput
          placeholder="Número de Orden"
          style={[styles.input, focusedInput === 'ot_id' && styles.inputFocused]}
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
          style={[styles.input, focusedInput === 'mycard_id' && styles.inputFocused]}
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
          style={[styles.input, focusedInput === 'quantity' && styles.inputFocused]}
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
          style={[styles.input, focusedInput === 'total_sheets' && styles.inputFocused]}
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
          placeholder="Cantidad de Contactos"
          style={[styles.input, focusedInput === 'quantity_contacts' && styles.inputFocused]}
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
          style={[styles.input, focusedInput === 'comments' && styles.inputFocused, { height: 80 }]}
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
            key={i}
            style={styles.input}
            dropDownContainerStyle={styles.dropdown}
            textStyle={{ fontSize: 16, color: '#000' }}
            placeholderStyle={{ color: '#888' }}
            labelStyle={{ fontSize: 16 }}
            items={areasOperator}
            listMode="SCROLLVIEW"
            open={!!openStates[i]}
            setOpen={(val) => {
              const isOpen = typeof val === 'function' ? val(!!openStates[i]) : val;
              setOpenStates((prev) => {
                const ns: Record<number, boolean> = {};
                Object.keys(prev).forEach((k) => (ns[+k] = false));
                ns[i] = isOpen;
                return ns;
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
          <TouchableOpacity
            onPress={() =>
              setDropdowns((d) => {
                setOpenStates((prev) => ({ ...prev, [d]: false }));
                return d + 1;
              })
            }
            style={styles.smallBtn}
          >
            <Text style={styles.smallBtnText}>➕ Área</Text>
          </TouchableOpacity>

          {dropdowns > 1 && (
            <TouchableOpacity
              onPress={() => {
                setDropdowns((d) => {
                  setOpenStates((prev) => {
                    const updated = { ...prev };
                    delete updated[d - 1];
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
              style={[styles.smallBtn, { backgroundColor: '#fee2e2' }]}
            >
              <Text style={[styles.smallBtnText, { color: '#b91c1c' }]}>
                ➖ Quitar
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ====== Archivos Obligator ios ====== */}
        <Text style={styles.sectionTitle}>Archivos PDF (OT, SKU, OP)</Text>
        {(['ot', 'sku', 'op'] as const).map((type) => (
          <View key={type} style={styles.fileInputBox}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handlePickPdf(type)}
            >
              <Text style={styles.uploadText}>📄 Subir {type.toUpperCase()}</Text>
            </TouchableOpacity>

            {files[type] && (
              <View style={styles.uploadedFileRow}>
                <Text style={styles.fileLabel} numberOfLines={1}>
                  {files[type]?.name}
                </Text>
                <TouchableOpacity onPress={() => removeMainFile(type)}>
                  <Text style={styles.removeFile}>✖</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* ====== Imagen de tarjeta ====== */}
        <Text style={styles.sectionTitle}>Imagen de Tarjeta (PNG/JPEG/WEBP)</Text>
        <View style={styles.fileInputBox}>
          <TouchableOpacity style={styles.uploadButton} onPress={handlePickCardImage}>
            <Text style={styles.uploadText}>🖼️ Subir imagen de tarjeta</Text>
          </TouchableOpacity>

          {files.cardImage && (
            <View style={[styles.uploadedFileRow, { alignItems: 'center' }]}>
              <Text style={[styles.fileLabel, { flex: 1 }]} numberOfLines={1}>
                {files.cardImage.name}
              </Text>
              <Image
                source={{ uri: files.cardImage.uri }}
                style={{ width: 56, height: 56, borderRadius: 8, marginRight: 8 }}
              />
              <TouchableOpacity onPress={removeCardImage}>
                <Text style={styles.removeFile}>✖</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ====== Adjuntos adicionales ====== */}
        <Text style={styles.sectionTitle}>Adjuntos adicionales (PDF/Imágenes)</Text>
        <View style={styles.fileInputBox}>
          <TouchableOpacity style={styles.uploadButton} onPress={handlePickExtraFiles}>
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
                {extraFiles.length} archivo(s) añadidos. Máximo {MAX_ATTACHMENTS} adjuntos. Límite total: {MAX_TOTAL_FILES}.
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
    height: 44,
    fontSize: 16,
    borderRadius: 18,
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
    gap: 10,
  },
  smallBtn: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  smallBtnText: {
    color: '#111827',
    fontWeight: '600',
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
    gap: 8,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 8,
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