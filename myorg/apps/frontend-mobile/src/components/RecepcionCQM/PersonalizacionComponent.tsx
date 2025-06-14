// myorg/apps/frontend-mobile/src/components/RecepcionCQM/MillingChipComponent.tsx

import React, { useState } from 'react';
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
import { useEffect } from 'react';

// Tipos y constantes globales
type Answer = {
  reviewed: boolean;
  sample_quantity: number;
};

const PersonalizacionComponent = ({ workOrder }: { workOrder: any }) => {
  // Hooks y estados
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [checkedQuestions, setCheckedQuestions] = useState<number[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState('');
  const [verificarScript, setVerificarScript] = useState('');
  const [validarKVC, setValidarKVC] = useState('');
  const [aparienciaQuemado, setAparienciaQuemado] = useState('');
  const [cargaAplicacion, setCargaAplicacion] = useState('');
  const [responses, setResponses] = useState<
    { questionId: number; answer: boolean }[]
  >([]);
  // Derivaciones
  const index = workOrder?.answers
    ?.map((a: Answer, i: number) => ({ ...a, index: i }))
    .reverse()
    .find((a: Answer) => a.reviewed === false)?.index;

  const questions =
    workOrder.area.formQuestions?.filter((q: any) => q.role_id === null) || [];
  const qualityQuestions =
    workOrder.area.formQuestions?.filter((q: any) => q.role_id === 3) || [];
  const currentFlow = [...workOrder.workOrder.flow].find(
    (f: any) => f.id === workOrder.id
  );
  const isDisabled = workOrder.status === 'En proceso';
  const nextFlowIndex =
    workOrder.workOrder.flow.findIndex((f: any) => f.id === workOrder.id) + 1;
  const nextFlow = workOrder.workOrder.flow[nextFlowIndex] ?? null;

  const allParcialsValidated = workOrder.partialReleases?.every(
    (r: { validated: boolean }) => r.validated
  );
  const tipoPersonalizacion = workOrder?.answers[index].tipo_personalizacion;
  useEffect(() => {
    const initial = selectedQuestions
      .filter((q) => q.role_id === 3)
      .map((q) => ({
        questionId: q.id,
        answer: false,
      }));
    setResponses(initial);
  }, [tipoPersonalizacion]);

  const handleCheckboxChange = (questionId: number) => {
    setCheckedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );

    setResponses((prev) =>
      prev.map((resp) =>
        resp.questionId === questionId
          ? { ...resp, answer: !resp.answer }
          : resp
      )
    );
  };

  const handleSubmit = async () => {
    const formAnswerId = workOrder.answers[index]?.id;
    if (!formAnswerId) {
      Alert.alert('No se encontró el Id del formulario');
      return;
    }

    const questions = workOrder.area.formQuestions.filter(
      (q: any) => q.role_id === 3
    );

    const isCheckedQuestionsValid = questions.some((q: any) =>
      checkedQuestions.includes(q.id)
    );

    const checkboxPayload = checkedQuestions.map((questionId: number) => ({
      question_id: questionId,
    }));

    const basePayload = {
      form_answer_id: formAnswerId,
    };
    let aditionalFields = {};
    if (workOrder?.answers[index].tipo_personalizacion === 'laser') {
      const checkboxPayload = responses.map(({ questionId, answer }) => ({
        question_id: questionId,
        answer: answer,
      }));
      aditionalFields = {
        verificar_script: verificarScript,
        validar_kvc_perso: validarKVC,
        apariencia_quemado: aparienciaQuemado,
        checkboxes: checkboxPayload,
      };
    } else if (workOrder?.answers[index].tipo_personalizacion === 'persos') {
      const checkboxPayload = responses.map(({ questionId, answer }) => ({
        question_id: questionId,
        answer: answer,
      }));
      aditionalFields = {
        carga_aplicacion: cargaAplicacion,
        checkboxes: checkboxPayload,
      };
    } else if (
      workOrder?.answers[index].tipo_personalizacion === 'etiquetadora'
    ) {
      aditionalFields = {};
    }
    const payload = {
      ...basePayload,
      ...aditionalFields,
    };

    try {
      const success = await submitExtraPersonalizacion(payload);
      setShowConfirmModal(false);
      Alert.alert('Producto evaluado correctamente');
      navigation.navigate('recepcionCQM');
    } catch (err) {
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
      navigation.navigate('recepcionCQM');
    } catch (error) {
      console.error(error);
      Alert.alert('Error al enviar la inconformidad.');
    }
  };

  //Para guardar las respuestas

  let selectedQuestions: { id: number; role_id: number | null }[] = [];

  if (tipoPersonalizacion === 'laser') {
    selectedQuestions = workOrder.area.formQuestions.slice(9, 13);
  } else if (tipoPersonalizacion === 'persos') {
    selectedQuestions = workOrder.area.formQuestions.slice(13, 17);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Área a evaluar: Personalización</Text>
      <View style={styles.card}>
        <Text style={styles.label}>OT:</Text>
        <Text style={styles.value}>{workOrder.workOrder.ot_id}</Text>

        <Text style={styles.label}>Id del Presupuesto:</Text>
        <Text style={styles.value}>{workOrder.workOrder.mycard_id}</Text>

        <Text style={styles.label}>Cantidad:</Text>
        <Text style={styles.value}>{workOrder.workOrder.quantity}</Text>

        <Text style={styles.label}>Operador:</Text>
        <Text style={styles.value}>{workOrder.user.username}</Text>

        <Text style={styles.label}>Comentarios:</Text>
        <Text style={styles.value}>{workOrder.workOrder.comments}</Text>
      </View>

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
          {/* Encabezado estilo tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
            <Text style={styles.tableCell}>Respuesta</Text>
          </View>

          {/* Preguntas normales */}
          {questions.slice(1, 10).map((q: any) => {
            const responses = workOrder.answers[
              index
            ]?.FormAnswerResponse?.find(
              (resp: any) => resp.question_id === q.id
            );
            console.log(responses);
            // Encuentra la respuesta del operador por pregunta_id
            const operatorResponse = responses?.response_operator;

            return (
              <View key={q.id} style={styles.tableRow}>
                {/* Pregunta */}
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.questionText}>{q.title}</Text>
                </View>

                {/* Respuesta */}
                <View
                  style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      operatorResponse && styles.radioDisabled,
                    ]}
                  >
                    {operatorResponse && <View style={styles.radioDot} />}
                  </View>
                </View>
              </View>
            );
          })}
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
          {/* Encabezado estilo tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
            <Text style={styles.tableCell}>Respuesta</Text>
          </View>

          {/* Preguntas normales */}
          {questions.slice(0, 1).map((q: any) => {
            const responses = workOrder.answers[
              index
            ]?.FormAnswerResponse?.find(
              (resp: any) => resp.question_id === q.id
            );
            console.log(responses);
            // Encuentra la respuesta del operador por pregunta_id
            const operatorResponse = responses?.response_operator;

            return (
              <View key={q.id} style={styles.tableRow}>
                {/* Pregunta */}
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.questionText}>{q.title}</Text>
                </View>

                {/* Respuesta */}
                <View
                  style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      operatorResponse && styles.radioDisabled,
                    ]}
                  >
                    {operatorResponse && <View style={styles.radioDot} />}
                  </View>
                </View>
              </View>
            );
          })}
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
          {/* Encabezado estilo tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
            <Text style={styles.tableCell}>Respuesta</Text>
          </View>

          {/* Preguntas normales */}
          {questions.slice(10, 15).map((q: any) => {
            const responses = workOrder.answers[
              index
            ]?.FormAnswerResponse?.find(
              (resp: any) => resp.question_id === q.id
            );
            console.log(responses);
            // Encuentra la respuesta del operador por pregunta_id
            const operatorResponse = responses?.response_operator;

            return (
              <View key={q.id} style={styles.tableRow}>
                {/* Pregunta */}
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.questionText}>{q.title}</Text>
                </View>

                {/* Respuesta */}
                <View
                  style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      operatorResponse && styles.radioDisabled,
                    ]}
                  >
                    {operatorResponse && <View style={styles.radioDot} />}
                  </View>
                </View>
              </View>
            );
          })}
          <Text style={styles.label}>Color De Personalización:</Text>
          <TextInput
            style={styles.input}
            value={
              workOrder?.answers[index].color_personalizacion ??
              'No se reconoce la muestra enviada'
            }
            editable={false}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
          <Text style={styles.label}>
            Tipo de Código de Barras Que Se Personaliza:
          </Text>
          <TextInput
            style={styles.input}
            value={
              workOrder?.answers[index].codigo_barras ??
              'No se reconoce la muestra enviada'
            }
            editable={false}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
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
          {/* Encabezado estilo tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
            <Text style={styles.tableCell}>Respuesta</Text>
          </View>

          {/* Preguntas normales */}
          {questions.slice(16, 23).map((q: any) => {
            const responses = workOrder.answers[
              index
            ]?.FormAnswerResponse?.find(
              (resp: any) => resp.question_id === q.id
            );
            console.log(responses);
            // Encuentra la respuesta del operador por pregunta_id
            const operatorResponse = responses?.response_operator;

            return (
              <View key={q.id} style={styles.tableRow}>
                {/* Pregunta */}
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.questionText}>{q.title}</Text>
                </View>

                {/* Respuesta */}
                <View
                  style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      operatorResponse && styles.radioDisabled,
                    ]}
                  >
                    {operatorResponse && <View style={styles.radioDot} />}
                  </View>
                </View>
              </View>
            );
          })}

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
          {/* Encabezado estilo tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
            <Text style={styles.tableCell}>Respuesta</Text>
          </View>

          {/* Preguntas normales */}
          {questions.slice(24, 25).map((q: any) => {
            const responses = workOrder.answers[
              index
            ]?.FormAnswerResponse?.find(
              (resp: any) => resp.question_id === q.id
            );
            console.log(responses);
            // Encuentra la respuesta del operador por pregunta_id
            const operatorResponse = responses?.response_operator;

            return (
              <View key={q.id} style={styles.tableRow}>
                {/* Pregunta */}
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.questionText}>{q.title}</Text>
                </View>

                {/* Respuesta */}
                <View
                  style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      operatorResponse && styles.radioDisabled,
                    ]}
                  >
                    {operatorResponse && <View style={styles.radioDot} />}
                  </View>
                </View>
              </View>
            );
          })}
          <Text style={styles.label}>Color De Personalización:</Text>
          <TextInput
            style={styles.input}
            value={
              workOrder?.answers[index].color_personalizacion ??
              'No se reconoce la muestra enviada'
            }
            editable={false}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
          />
          <Text style={styles.label}>
            Tipo de Código de Barras Que Se Personaliza:
          </Text>
          <TextInput
            style={styles.input}
            value={
              workOrder?.answers[index].codigo_barras ??
              'No se reconoce la muestra enviada'
            }
            editable={false}
            mode="outlined"
            activeOutlineColor="#000"
            theme={{ roundness: 30 }}
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
          {/* Encabezado estilo tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
            <Text style={styles.tableCell}>Respuesta</Text>
          </View>
          {/* Preguntas normales */}
          {workOrder.area.formQuestions
            .slice(9, 13)
            .filter((q: any) => q.role_id === 3)
            .map((q: any) => (
              <View key={q.id} style={styles.tableRow}>
                {/* Pregunta */}
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.questionText}>{q.title}</Text>
                </View>
                {/* Respuestas */}
                <View
                  style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}
                >
                  <TouchableOpacity
                    onPress={() => handleCheckboxChange(q.id)}
                    style={[
                      styles.radioCircle,
                      checkedQuestions.includes(q.id) && styles.checkedBox,
                    ]}
                  >
                    {checkedQuestions.includes(q.id) && (
                      <View style={styles.radioDot} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
          {/* Encabezado estilo tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Pregunta</Text>
            <Text style={styles.tableCell}>Respuesta</Text>
          </View>
          {/* Preguntas normales */}
          {workOrder.area.formQuestions
            .slice(13, 15)
            .filter((q: any) => q.role_id === 3)
            .map((q: any) => (
              <View key={q.id} style={styles.tableRow}>
                {/* Pregunta */}
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.questionText}>{q.title}</Text>
                </View>
                {/* Respuestas */}
                <View
                  style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}
                >
                  <TouchableOpacity
                    onPress={() => handleCheckboxChange(q.id)}
                    style={[
                      styles.radioCircle,
                      checkedQuestions.includes(q.id) && styles.checkedBox,
                    ]}
                  >
                    {checkedQuestions.includes(q.id) && (
                      <View style={styles.radioDot} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
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
  button: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 'auto',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
  buttonSecondary: {
    backgroundColor: '#9CA3AF',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    padding: 20,
  },
  questionText: {
    fontSize: 15,
    color: '#1f2937',
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
  scrollArea: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    marginTop: 60,
    backgroundColor: '#fdfaf6',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
  questionGroup: {
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  checkbox: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
  },
  checkedBox: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  checkboxText: {
    fontSize: 14,
    color: '#111827',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF', // gris como en web
    opacity: 0.7,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  checkboxBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  toggleSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  qualityRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  qualityQuestion: {
    fontSize: 14,
    color: '#374151',
  },
  radioDisabled: {
    padding: 8,
    borderWidth: 1,
    opacity: 0.4,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  radioGroup: {
    marginTop: 12,
    alignItems: 'flex-start',
  },

  radioLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  radioText: {
    fontSize: 16,
    color: '#1f2937',
  },
});
