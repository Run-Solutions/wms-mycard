// myorg/apps/frontend-mobile/src/components/LiberacionDeVistosBuenos/PersonalizacionComponent.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  submitExtraPersonalizacion,
  sendInconformidadCQM,
} from '../../api/recepcionCQM';
import { OperatorAdvancedTable } from './util/FormQuestionTable';
import SelectionQuestionTable from './util/SelectionQuestionTable';
import WorkOrderInfo from './util/WorkOrderInfo';

// Tipos y constantes globales
type Answer = {
  reviewed: boolean;
  sample_quantity: number;
};

const PersonalizacionComponent = ({ workOrder }: { workOrder: any }) => {
  // Hooks y estados
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState('');
  const [verificarScript, setVerificarScript] = useState('');
  const [validarKVC, setValidarKVC] = useState('');
  const [aparienciaQuemado, setAparienciaQuemado] = useState('');
  const [cargaAplicacion, setCargaAplicacion] = useState('');

  // Estructura para SelectionQuestionTable (una sola columna "Respuesta")
  type CheckedGroup = { ok: number[]; ng: number[] };
  // Estado para CQM (mi respuesta)
  const [cqmChecked, setCqmChecked] = useState<CheckedGroup[]>([
    { ok: [], ng: [] },
  ]);

  // Helper: según tipo de personalización, devolver el slice de preguntas del OPERADOR
  const getOperatorQuestions = () => {
    const qs = workOrder?.area?.formQuestions ?? [];
    if (!hasIndex) return [];
    switch (workOrder?.answers?.[index!]?.tipo_personalizacion) {
      case 'persos':
        return qs.slice(1, 10);
      case 'etiquetadora':
        return qs.slice(0, 1);
      case 'packsmart':
        return qs.slice(14, 20);
      case 'otto':
        return qs.slice(20, 28);
      case 'embolsadora':
        return qs.slice(28, 30);
      default:
        return [];
    }
  };

  const getCqmQuestions = () => {
    const qs = workOrder?.area?.formQuestions ?? [];
    if (!hasIndex) return [];
    switch (workOrder?.answers?.[index!]?.tipo_personalizacion) {
      case 'laser':
        return qs.slice(10, 13);
      case 'persos':
        return qs.slice(13, 15);
      default:
        return [];
    }
  };

  // Set de preguntas respondidas por CQM (OK o NG)
  const answeredIdsSet = useMemo(() => {
    const ok = new Set<number>(cqmChecked?.[0]?.ok ?? []);
    const ng = new Set<number>(cqmChecked?.[0]?.ng ?? []);
    return new Set<number>([...ok, ...ng]);
  }, [cqmChecked]);

  // Derivaciones
  // --- Derivaciones (mueve esto arriba, justo después de useState) ---
  const index =
    workOrder?.answers
      ?.map((a: Answer, i: number) => ({ ...a, index: i }))
      .reverse()
      .find((a: Answer) => a.reviewed === false)?.index ?? null;

  const hasIndex = index !== null && index !== undefined;

  const tipoPersonalizacion = workOrder?.answers[index].tipo_personalizacion;
  useEffect(() => {
    if (!hasIndex) {
      setCqmChecked([{ ok: [], ng: [] }]);
      return;
    }
    const cqmQs = getCqmQuestions();
    const far = workOrder?.answers?.[index!]?.FormAnswerResponse ?? [];
    const ok: number[] = [];
    const ng: number[] = [];
    cqmQs.forEach((q: any) => {
      const r = far.find((x: any) => x.question_id === q.id);
      if (r?.response_cqm === true) ok.push(q.id);
      else if (r?.response_cqm === false) ng.push(q.id);
    });
    setCqmChecked([{ ok, ng }]);
  }, [
    hasIndex,
    workOrder?.id,
    index,
    workOrder?.answers?.[index!]?.FormAnswerResponse,
  ]);

  const handleToggleCqm = (
    questionId: number,
    columnIndex: number, // siempre 0 en 'simple'
    type: 'ok' | 'ng',
    checked: boolean
  ) => {
    setCqmChecked((prev) => {
      const next = [...prev];
      const group = { ...(next[columnIndex] ?? { ok: [], ng: [] }) };

      // exclusividad: quita de ambos
      group.ok = group.ok.filter((id) => id !== questionId);
      group.ng = group.ng.filter((id) => id !== questionId);

      // añade si se marcó
      if (checked) {
        if (type === 'ok') group.ok.push(questionId);
        else group.ng.push(questionId);
      }
      next[columnIndex] = group;
      return next;
    });
  };

  // IDs de preguntas CQM visibles (role_id === 3) según el tipo
  const cqmQuestionIds = useMemo(
    () =>
      (getCqmQuestions() ?? [])
        .filter((q: any) => q?.role_id === 3)
        .map((q: any) => q.id as number),
    [
      // dependencias seguras para recalcular cuando cambie el tipo o el set de preguntas
      hasIndex,
      workOrder?.area?.formQuestions,
      workOrder?.answers?.[index!]?.tipo_personalizacion,
    ]
  );

  const handleSubmit = async () => {
    if (!hasIndex) {
      Alert.alert('No se encontró una respuesta pendiente para esta OT.');
      return;
    }
    const formAnswerId = workOrder.answers[index!]?.id;
    if (!formAnswerId) {
      Alert.alert('No se encontró el Id del formulario');
      return;
    }
    if (cqmQuestionIds.length > 0) {
      const unanswered = cqmQuestionIds.filter(
        (id: any) => !answeredIdsSet.has(id)
      );
      if (unanswered.length > 0) {
        Alert.alert('No se encontró el ID del formulario.');
        return;
      }
    }

    const okIds = new Set(cqmChecked?.[0]?.ok ?? []);
    const ngIds = new Set(cqmChecked?.[0]?.ng ?? []);
    const checkboxPayload = [
      ...Array.from(okIds).map((question_id) => ({
        question_id,
        answer: true,
      })),
      ...Array.from(ngIds).map((question_id) => ({
        question_id,
        answer: false,
      })),
    ];

    const basePayload = { form_answer_id: formAnswerId };
    const type = workOrder?.answers?.[index!]?.tipo_personalizacion;
    let aditionalFields: any = { checkboxes: checkboxPayload };

    if (type === 'laser') {
      aditionalFields = {
        ...aditionalFields,
        verificar_script: verificarScript || '',
        validar_kvc_perso: validarKVC || '',
        apariencia_quemado: aparienciaQuemado || '',
      };
    } else if (type === 'persos') {
      aditionalFields = {
        ...aditionalFields,
        carga_aplicacion: cargaAplicacion || '',
      };
    }

    const payload = { ...basePayload, ...aditionalFields };

    try {
      await submitExtraPersonalizacion(payload);
      setShowConfirmModal(false);
      Alert.alert('Producto evaluado correctamente');
      navigation.goBack();
    } catch {
      Alert.alert('Error al liberar el producto.');
    }
  };

  const handleInconformidad = async () => {
    if (!inconformidad.trim()) {
      Alert.alert('Por favor, ingresa un comentario de inconformidad.');
      return;
    }
    try {
      await sendInconformidadCQM(workOrder.id, inconformidad);
      setShowInconformidad(false);
      Alert.alert('Inconformidad enviada correctamente');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error al enviar la inconformidad.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Área a evaluar: Personalización</Text>
      <WorkOrderInfo workOrder={workOrder} />

      <Text style={styles.modalTitle}>Respuestas del operador</Text>
      <Text style={styles.label}>Tipo de Personalizacion:</Text>
      <TextInput
        style={styles.inputDetail}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        value={
          workOrder?.answers[index].tipo_personalizacion ??
          'No se reconoce la muestra enviada'
        }
        editable={false}
      />

      {workOrder?.answers[index].tipo_personalizacion === 'laser' && (
        <>
          <Text style={styles.label}>Muestras entregadas:</Text>
          <TextInput
            style={styles.inputDetail}
            theme={{ roundness: 30 }}
            mode="outlined"
            activeOutlineColor="#000"
            value={
              workOrder?.answers[index].sample_quantity !== null
                ? String(workOrder?.answers[index].sample_quantity)
                : 'No se reconoce la muestra enviada'
            }
            editable={false}
          />
        </>
      )}
      {workOrder?.answers[index].tipo_personalizacion === 'persos' && (
        <>
          <OperatorAdvancedTable
            questions={getOperatorQuestions()}
            answers={workOrder?.answers?.[index]?.FormAnswerResponse ?? []}
            mode="simple"
            readOnly
            columns={['Respuesta']}
          />
          <Text style={styles.label}>Color De Personalización:</Text>
          <TextInput
            style={styles.input}
            theme={{ roundness: 30 }}
            mode="outlined"
            activeOutlineColor="#000"
            value={
              workOrder?.answers[index].color_personalizacion ??
              'No se reconoce la muestra enviada'
            }
            editable={false}
          />
          <Text style={styles.label}>
            Tipo de Código de Barras Que Se Personaliza:
          </Text>
          <TextInput
            style={styles.input}
            theme={{ roundness: 30 }}
            mode="outlined"
            activeOutlineColor="#000"
            value={
              workOrder?.answers[index].codigo_barras ??
              'No se reconoce la muestra enviada'
            }
            editable={false}
          />
          {/* Muestras */}
          <Text style={styles.label}>Muestras entregadas:</Text>
          <TextInput
            style={styles.input}
            theme={{ roundness: 30 }}
            mode="outlined"
            activeOutlineColor="#000"
            value={
              typeof workOrder?.answers?.[index]?.sample_quantity === 'number'
                ? workOrder.answers[index].sample_quantity.toString()
                : ''
            }
            editable={false}
          />
        </>
      )}

      {workOrder?.answers[index].tipo_personalizacion === 'etiquetadora' && (
        <>
          <OperatorAdvancedTable
            questions={getOperatorQuestions()}
            answers={workOrder?.answers?.[index]?.FormAnswerResponse ?? []}
            mode="simple"
            readOnly
            columns={['Respuesta']}
          />
          <Text style={styles.label}>
            Verificar Tipo De Etiqueta Vs Ot Y Pegar Utilizada:
          </Text>
          <TextInput
            style={styles.input}
            theme={{ roundness: 30 }}
            mode="outlined"
            activeOutlineColor="#000"
            value={
              workOrder?.answers[index].verificar_etiqueta ??
              'No se reconoce la muestra enviada'
            }
            editable={false}
          />
          <Text style={styles.label}>Muestras entregadas:</Text>
          <TextInput
            style={styles.input}
            theme={{ roundness: 30 }}
            mode="outlined"
            activeOutlineColor="#000"
            value={
              typeof workOrder?.answers?.[index]?.sample_quantity === 'number'
                ? workOrder.answers[index].sample_quantity.toString()
                : ''
            }
            editable={false}
          />
        </>
      )}

      {workOrder?.answers[index].tipo_personalizacion === 'packsmart' && (
        <>
          <OperatorAdvancedTable
            questions={getOperatorQuestions()}
            answers={workOrder?.answers?.[index]?.FormAnswerResponse ?? []}
            mode="simple"
            readOnly
            columns={['Respuesta']}
          />
          {/* Muestras */}
          <Text style={styles.label}>Muestras entregadas:</Text>
          <TextInput
            style={styles.input}
            value={
              typeof workOrder?.answers?.[index]?.sample_quantity === 'number'
                ? workOrder.answers[index].sample_quantity.toString()
                : ''
            }
            editable={false}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
        </>
      )}

      {workOrder?.answers[index].tipo_personalizacion === 'otto' && (
        <>
          <OperatorAdvancedTable
            questions={getOperatorQuestions()}
            answers={workOrder?.answers?.[index]?.FormAnswerResponse ?? []}
            mode="simple"
            readOnly
            columns={['Respuesta']}
          />

          {/* Muestras */}
          <Text style={styles.label}>Muestras entregadas:</Text>
          <TextInput
            style={styles.input}
            value={
              typeof workOrder?.answers?.[index]?.sample_quantity === 'number'
                ? workOrder.answers[index].sample_quantity.toString()
                : ''
            }
            editable={false}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
        </>
      )}

      {workOrder?.answers[index].tipo_personalizacion === 'embolsadora' && (
        <>
          <OperatorAdvancedTable
            questions={getOperatorQuestions()}
            answers={workOrder?.answers?.[index]?.FormAnswerResponse ?? []}
            mode="simple"
            readOnly
            columns={['Respuesta']}
          />
          {/* Muestras */}
          <Text style={styles.label}>Muestras entregadas:</Text>
          <TextInput
            style={styles.input}
            value={
              typeof workOrder?.answers?.[index]?.sample_quantity === 'number'
                ? workOrder.answers[index].sample_quantity.toString()
                : ''
            }
            editable={false}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
        </>
      )}

      <Text style={[styles.modalTitle, { marginTop: 40 }]}>Mis respuestas</Text>

      {workOrder?.answers[index].tipo_personalizacion === 'laser' && (
        <>
          {getCqmQuestions().length > 0 ? (
            <SelectionQuestionTable
              formQuestions={getCqmQuestions()}
              roleId={3}
              columns={['Respuesta']}
              checkedQuestions={cqmChecked}
              onToggle={handleToggleCqm}
              readOnly={false}
            />
          ) : (
            <Text style={styles.label}>
              No hay preguntas por parte de calidad.
            </Text>
          )}
          <Text style={styles.label}>
            Verificar Script / Layout Vs Ot / Autorizacion:
          </Text>
          <TextInput
            style={styles.input}
            theme={{ roundness: 30 }}
            mode="outlined"
            activeOutlineColor="#000"
            placeholder="Ej: 2"
            value={verificarScript}
            onChangeText={setVerificarScript}
          />
          <Text style={styles.label}>
            Validar, Anotar KVC (Llaves), Carga de Aplicación o Prehabilitación:
          </Text>
          <TextInput
            style={styles.input}
            theme={{ roundness: 30 }}
            mode="outlined"
            activeOutlineColor="#000"
            placeholder="Ej: 2"
            value={validarKVC}
            onChangeText={setValidarKVC}
          />
          <Text style={styles.label}>
            Describir Apariencia Del Quemado Del Laser (Color):
          </Text>
          <TextInput
            style={styles.input}
            theme={{ roundness: 30 }}
            mode="outlined"
            activeOutlineColor="#000"
            placeholder="Ej: 2"
            value={aparienciaQuemado}
            onChangeText={setAparienciaQuemado}
          />
        </>
      )}

      {workOrder?.answers[index].tipo_personalizacion === 'persos' && (
        <>
          {getCqmQuestions().length > 0 ? (
            <SelectionQuestionTable
              formQuestions={getCqmQuestions()}
              roleId={3}
              columns={['Respuesta']}
              checkedQuestions={cqmChecked}
              onToggle={handleToggleCqm}
              readOnly={false}
            />
          ) : (
            <Text style={styles.label}>
              No hay preguntas por parte de calidad.
            </Text>
          )}
          <Text style={styles.label}>
            Validar Carga De Aplicación (PersoMaster)
          </Text>
          <TextInput
            style={styles.input}
            theme={{ roundness: 30 }}
            mode="outlined"
            activeOutlineColor="#000"
            placeholder="Ej: 2"
            value={cargaAplicacion}
            onChangeText={setCargaAplicacion}
          />
        </>
      )}

      {['etiquetadora', 'packsmart', 'otto', 'embolsadora'].includes(
        workOrder?.answers[index].tipo_personalizacion
      ) && (
        <>
          <Text style={styles.label}>
            No hay preguntas por parte de calidad.
          </Text>
        </>
      )}

      {/* Botones */}
      <View style={styles.modalButtonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowInconformidad(true)}
        >
          <Text style={styles.modalButtonText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => setShowConfirmModal(true)}
        >
          <Text style={styles.modalButtonText}>Aprobado</Text>
        </TouchableOpacity>
      </View>

      {/* Modal confirmación de liberación */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>¿Estás seguro/a de aprobar?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSubmit}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal inconformidad */}
      <Modal visible={showInconformidad} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>Describe la inconformidad:</Text>
            <TextInput
              value={inconformidad}
              onChangeText={setInconformidad}
              placeholder="Escribe la inconformidad..."
              multiline
              style={styles.textarea}
              theme={{ roundness: 30 }}
              mode="outlined"
              activeOutlineColor="#000"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowInconformidad(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleInconformidad}
              >
                <Text style={styles.modalButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default PersonalizacionComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 8,
    backgroundColor: '#fdfaf6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: 'black',
    padding: Platform.OS === 'ios' ? 10 : 0,
  },
  label: { fontWeight: '600', marginTop: 12, fontSize: 16 },
  value: { marginBottom: 0 },
  input: {
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 30,
    fontSize: 16,
  },
  inputDetail: {
    padding: 10,
    backgroundColor: '#fff',
    height: 30,
    fontSize: 16,
    marginTop: 7,
    marginBottom: 15,
  },
  textarea: {
    backgroundColor: '#fff',
    padding: 10,
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 18,
    width: '80%',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#A9A9A9',
    padding: 10,
    borderRadius: 18,
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#0038A8',
    padding: 10,
    borderRadius: 18,
    flex: 1,
  },
  modalButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});
