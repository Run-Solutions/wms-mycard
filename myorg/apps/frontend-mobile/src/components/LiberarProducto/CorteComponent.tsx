import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  submitToCQMCorte,
  releaseProductFromCorte,
} from '../../api/liberarProducto';
import { updateWorkOrderAreas } from '../../api/seguimientoDeOts';
import { useAuth } from '../../contexts/AuthContext';
import { calcularCantidadPorLiberar } from './util/calcularCantidadPorLiberar';
import BadQuantityModal from './util/BadQuantityModal';
import { AreaData } from './PersonalizacionComponent';
import SelectionQuestionTable from './util/FormQuestionTable';
import WorkOrderInfo from './util/WorkOrderInfo';
import { usePartialReleaseControls } from './util/disablePartialTime';

interface PartialRelease {
  validated: boolean;
  quantity: number;
  bad_quantity?: number;
  material_quantity?: number;
}

const CQM_BLOCKED_STATUSES = [
  'Enviado a CQM',
  'En Calidad',
  'Listo',
  'Pendiente parcial',
] as const;

const AFTER_CORTE_BLOCKED_STATUSES = [
  'Enviado a CQM',
  'En Calidad',
  'Listo',
  'Pendiente',
  'Pendiente parcial',
  'Enviado a auditoria parcial',
  'En inconformidad CQM',
  'Enviado a Auditoria',
] as const;

const CURRENT_INVALID_FOR_PARTIAL = [
  'Enviado a CQM',
  'En Calidad',
  'Parcial',
  'Enviado a auditoria parcial',
  'Pendiente',
  'Pendiente parcial',
  'En proceso',
] as const;

const NEXT_INVALID_FOR_PARTIAL = [
  'Enviado a CQM',
  'Listo',
  'En Calidad',
  'Enviado a auditoria parcial',
  'Pendiente',
  'Pendiente parcial',
  'En inconformidad CQM',
] as const;

const NEXT_CORTE_STATUSES = ['Enviado a auditoria parcial'] as const;

const CorteComponent = ({ workOrder }: { workOrder: any }) => {
  console.log('Order', workOrder);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const currentUserId = user?.sub;

  const isDisabled = workOrder.status === 'En proceso';

  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [areaBadQuantities, setAreaBadQuantities] = useState<{
    [areaName: string]: string;
  }>({});

  const [goodQuantity, setGoodQuantity] = useState('');
  const [excessQuantity, setExcessQuantity] = useState('');
  const [noProcessQuantity, setNoProcessQuantity] = useState('');
  const [materialBadQuantity, setMaterialBadQuantity] = useState<string>('0');
  const [lastAreaBadQuantity, setLastBadQuantity] = useState<string>('0');

  const [responses, setResponses] = useState<
    { questionId: number; answer: boolean }[]
  >([]);
  const [sampleQuantity, setSampleQuantity] = useState('');
  const [comments, setComments] = useState('');

  const [showCqmModal, setShowCqmModal] = useState(false);
  const [showQuality, setShowQuality] = useState<boolean>(false);

  const [flowListState, setFlowListState] = useState<any[]>(() => [
    ...(workOrder?.workOrder?.flow ?? []),
  ]);
  const flowList: any[] = useMemo(() => flowListState, [flowListState]);
  const currentFlow = useMemo(
    () =>
      workOrder?.workOrder?.flow?.find(
        (f: any) =>
          f.area_id === workOrder?.area?.id &&
          [
            'Pendiente',
            'En proceso',
            'Parcial',
            'Pendiente parcial',
            'Listo',
            'Enviado a CQM',
            'En Calidad',
            'Enviado a auditoria parcial',
          ].includes(f.status) &&
          f.user?.id === currentUserId
      ),
    [workOrder, currentUserId]
  );
  if (!currentFlow) {
    alert('No tienes una orden activa para esta área.');
    return;
  }
  const currentIndex = useMemo(
    () => flowList.findIndex((item) => item?.id === currentFlow?.id),
    [flowList, currentFlow]
  );

  const lastCompletedOrPartial = useMemo(
    () => (currentIndex > 0 ? flowList[currentIndex - 1] : null),
    [flowList, currentIndex]
  );

  const nextFlow = useMemo(
    () =>
      currentIndex !== -1 && currentIndex < flowList.length - 1
        ? flowList[currentIndex + 1]
        : null,
    [flowList, currentIndex]
  );

  const cantidadporliberar = useMemo(
    () => calcularCantidadPorLiberar(currentFlow, lastCompletedOrPartial),
    [currentFlow, lastCompletedOrPartial]
  );

  const visibleQuestions: any[] = useMemo(
    () =>
      workOrder?.area?.formQuestions?.filter((q: any) => q.role_id === null) ??
      [],
    [workOrder]
  );
  const answersByQuestion = useMemo(() => {
    const map: Record<number, boolean | undefined> = {};
    for (const r of responses) map[r.questionId] = r.answer;
    return map;
  }, [responses]);

  const checkedRespuestaOK = useMemo(
    () =>
      visibleQuestions
        .filter((q: any) => answersByQuestion[q.id] === true)
        .map((q: any) => q.id),
    [visibleQuestions, answersByQuestion]
  );

  const checkedRespuestaNG = useMemo(
    () =>
      visibleQuestions
        .filter((q: any) => answersByQuestion[q.id] === false)
        .map((q: any) => q.id),
    [visibleQuestions, answersByQuestion]
  );
  const statusesToCheck = useMemo(
    () => [
      currentFlow?.status,
      nextFlow?.status,
      lastCompletedOrPartial?.status,
    ],
    [currentFlow, nextFlow, lastCompletedOrPartial]
  );

  const { disableAfterCorteCQM, disablePartial, cooldown } =
    usePartialReleaseControls({
      flow: currentFlow,
      cantidadPorLiberar: cantidadporliberar,
      withCountdown: true,
      statusesToCheck,
      blockedForCQM: [...CQM_BLOCKED_STATUSES],
      blockedForCQM_AfterCorte: [...AFTER_CORTE_BLOCKED_STATUSES],
    });

  const allParcialsValidated = useMemo(
    () =>
      currentFlow?.partialReleases?.every((r: PartialRelease) => r.validated) ??
      false,
    [currentFlow]
  );

  const shouldDisableCQM = () => disableAfterCorteCQM;
  const shouldDisableLiberar = () => {
    const cleanedStatuses = [
      currentFlow?.status,
      nextFlow?.status,
      lastCompletedOrPartial?.status,
    ]
      .map((s) => s?.trim?.() ?? '')
      .filter(Boolean);

    const byCantidad = Number(cantidadporliberar) === 0;
    const byCooldown = !currentFlow?.areaResponse && !!cooldown?.isLocked;
    const hasBlockedStatus = cleanedStatuses.some((s) =>
      AFTER_CORTE_BLOCKED_STATUSES.includes(s as any)
    );

    // Caso especial: CQM bloqueado solo por tiempo -> permitir liberación parcial
    if (byCooldown && !hasBlockedStatus && !byCantidad) return false;

    const isCurrentInvalid = CURRENT_INVALID_FOR_PARTIAL.includes(
      (currentFlow?.status ?? '').trim()
    );
    const isNextInvalid = NEXT_INVALID_FOR_PARTIAL.includes(
      (nextFlow?.status ?? '').trim()
    );
    const afterCorte =
      NEXT_CORTE_STATUSES.includes((currentFlow?.status ?? '').trim() as any) &&
      (nextFlow?.area?.id ?? 0) >= 6;
    const isNextInvalidAndNotValidated =
      NEXT_INVALID_FOR_PARTIAL.includes((nextFlow?.status ?? '').trim()) &&
      !allParcialsValidated;

    return (
      disablePartial ||
      !!isDisabled ||
      isCurrentInvalid ||
      afterCorte ||
      isNextInvalidAndNotValidated ||
      isNextInvalid
    );
  };

  const handleSubmitToCQM = async () => {
    const flowId = currentFlow.id;
    const numValue = Number(sampleQuantity);

    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0) {
      Alert.alert('Cantidad de muestra inválida');
      return;
    }
    // Construir arrays Alineados según el ORDEN de visibleQuestions
    const question_id: number[] = [];
    const response: boolean[] = [];

    visibleQuestions.forEach((q: any) => {
      const ans = answersByQuestion[q.id];
      if (ans !== undefined) {
        question_id.push(q.id);
        response.push(!!ans);
      }
    });
    // Exigir todas respondidas (o ajusta a tu regla)
    if (question_id.length !== visibleQuestions.length) {
      Alert.alert('Completa todas las preguntas y cantidad de muestra.');
      return;
    }

    const payload = {
      question_id,
      work_order_flow_id: currentFlow.id,
      work_order_id: currentFlow.workOrder.id,
      area_id: currentFlow.area.id,
      response,
      reviewed: false,
      user_id: currentFlow.assigned_user,
      sample_quantity: Number(sampleQuantity),
    };

    try {
      await submitToCQMCorte(payload);
      Alert.alert('Formulario enviado a CQM');
      navigation.goBack();
      setShowCqmModal(false);
    } catch (err) {
      Alert.alert('Error al Enviar a Calidad/CQM.');
    }
  };

  const warned = useRef(false);
  const loggedOnce = useRef(false);

  useEffect(() => {
    if (loggedOnce.current) return; // evita duplicado del StrictMode
    console.log('workOrder', workOrder);
    console.log('currentFlow', currentFlow);
    console.log('nextFlow', nextFlow);
    console.log('lastCompletedOrPartial', lastCompletedOrPartial);
    loggedOnce.current = true;
  }, [workOrder, currentFlow, nextFlow, lastCompletedOrPartial]);
  useEffect(() => {
    if (!currentFlow && !warned.current) {
      alert('No tienes una orden activa para esta área.');
      warned.current = true;
    }
  }, [currentFlow]);
  

  if (!currentFlow) return null; // Falla segura en render


  const handleCorteSubmit = async () => {
    const numValue = Number(goodQuantity);
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0) {
      Alert.alert('Cantidad de muestra inválida');
      return;
    }
    const payload = {
      workOrderId: workOrder.workOrder.id,
      workOrderFlowId: currentFlow.id,
      areaId: workOrder.area.id,
      assignedUser: currentFlow.assigned_user,
      goodQuantity: Number(goodQuantity),
      badQuantity: Number(lastAreaBadQuantity),
      materialBadQuantity: Number(materialBadQuantity),
      noProcessQuantity: Number(noProcessQuantity),
      excessQuantity: Number(excessQuantity),
      comments,
      formAnswerId: currentFlow.answers?.[0]?.id,
    };

    try {
      await releaseProductFromCorte(payload);
      setShowConfirm(false);
      Alert.alert('Producto liberado correctamente');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error del servidor al liberar.');
    }
  };

  const previousFlows = useMemo(
    () =>
      flowList.slice(0, currentIndex + 1).filter((flow) => flow.area_id !== 1),
    [flowList, currentIndex]
  );

  const handleOpenBadQuantityModal = () => {
    const initialValues: { [key: string]: string } = {};

    previousFlows.forEach((flow) => {
      const areaKey = flow.area.name.toLowerCase().replace(/\s/g, '');

      let badQuantity: number | null | undefined = null;
      let matBadQuantity: number | null | undefined = null;

      // Primero, busca en areaResponse
      if (flow.areaResponse?.impression) {
        badQuantity = flow.areaResponse.impression.bad_quantity;
      } else if (flow.areaResponse?.serigrafia) {
        badQuantity = flow.areaResponse.serigrafia.bad_quantity;
      } else if (flow.areaResponse?.empalme) {
        badQuantity = flow.areaResponse.empalme.bad_quantity;
      } else if (flow.areaResponse?.laminacion) {
        badQuantity = flow.areaResponse.laminacion.bad_quantity;
      } else if (flow.areaResponse?.corte) {
        badQuantity = flow.areaResponse.corte.bad_quantity;
        matBadQuantity = flow.areaResponse.corte.material_quantity;
      }

      // Fallback: sumar parciales
      if (
        (badQuantity === null || badQuantity === undefined) &&
        flow.partialReleases?.length > 0
      ) {
        badQuantity = flow.partialReleases.reduce(
          (sum: number, r: PartialRelease) => sum + (r.bad_quantity ?? 0),
          0
        );
        matBadQuantity = flow.partialReleases.reduce(
          (sum: number, r: PartialRelease) => sum + (r.material_quantity ?? 0),
          0
        );
      }
      initialValues[`${areaKey}_bad`] =
        badQuantity !== null && badQuantity !== undefined
          ? String(badQuantity)
          : '';

      initialValues[`${areaKey}_material`] =
        matBadQuantity !== null && matBadQuantity !== undefined
          ? String(matBadQuantity)
          : '';
    });

    setAreaBadQuantities(initialValues);
    setShowBadQuantity(true);
    console.log('Valores iniciales para malas por área:', initialValues);
  };
  const normalizedAreas: AreaData[] = previousFlows.map((item) => ({
    id: item.area?.id ?? item.id,
    name: item.area?.name ?? item.name ?? '',
    malas: item.malas ?? 0,
    defectuoso: item.defectuoso ?? 0,

    // Valores ficticios para completar el tipo requerido
    status: item.status ?? '',
    response: item.areaResponse ?? {},
    answers: item.answers ?? [],
    usuario: item.user?.username ?? '',
    auditor: '',
    buenas: 0,
    cqm: 0,
    excedente: 0,
    muestras: 0,
  }));

  const handleSaveChanges = async () => {
    const toInt = (v: any) => {
      const n = parseInt(String(v ?? '0').trim(), 10);
      return Number.isFinite(n) ? n : 0;
    };

    const payload = {
      areas: previousFlows.flatMap((flow) => {
        const areaKey = flow.area.name.toLowerCase().replace(/\s/g, '');

        const blockMap: Record<string, string> = {
          impresion: 'impression',
          serigrafia: 'serigrafia',
          empalme: 'empalme',
          laminacion: 'laminacion',
          // corte: 'corte', // 👈 NO lo usamos aquí; corte se manda en handleCorteSubmit
        };

        const block = blockMap[areaKey] || 'otros';

        // ⛔️ No mandes nada si el área no es de las soportadas o si es Corte
        if (block === 'otros' || areaKey === 'corte') return [];

        const blockData = flow.areaResponse?.[block];

        // 🔒 Si no existe registro en BD para ese bloque (sin id), NO lo envíes (evita 400)
        if (!blockData?.id) return [];

        const badKey = `${areaKey}_bad`;
        const materialKey = `${areaKey}_material`;

        const bad_quantity = toInt(areaBadQuantities[badKey]);
        const material_quantity =
          flow.area.id > 6 ? toInt(areaBadQuantities[materialKey]) : undefined;

        // ✅ Enviamos aunque los números sean 0; el backend ya tiene el bloque creado (id)
        return [
          {
            areaId: flow.area_id,
            block,
            blockId: blockData.id,
            formId: blockData.form_auditory_id ?? null,
            cqmId: blockData.form_answer_id ?? null,
            data: {
              bad_quantity,
              ...(material_quantity !== undefined && { material_quantity }),
            },
          },
        ];
      }),
    };

    if (!payload.areas.length) {
      alert('No hay cambios para guardar.');
      return;
    }

    try {
      await updateWorkOrderAreas(workOrder.workOrder.ot_id, payload);

      // Refresca estado local SOLO con lo enviado
      setFlowListState((prev) => {
        const byArea = new Map(payload.areas.map((a: any) => [a.areaId, a]));
        return prev.map((f) => {
          const upd = byArea.get(f.area_id);
          if (!upd) return f;

          const newAreaResponse = { ...(f.areaResponse ?? {}) };
          const existingBlock = newAreaResponse[upd.block] ?? {};
          newAreaResponse[upd.block] = {
            ...existingBlock,
            ...upd.data,
            id: upd.blockId ?? existingBlock.id ?? null,
            form_auditory_id:
              upd.formId ?? existingBlock.form_auditory_id ?? null,
            form_answer_id: upd.cqmId ?? existingBlock.form_answer_id ?? null,
          };

          return { ...f, areaResponse: newAreaResponse };
        });
      });

      alert('Cambios guardados correctamente');
    } catch (err) {
      console.error(err);
      alert('Error al guardar los cambios');
    }
  };
  const sumaBadQuantity = useMemo(() => {
    const bad = Number(lastAreaBadQuantity) || 0;
    const mat =
      (currentFlow?.area?.id ?? 0) >= 6 ? Number(materialBadQuantity) || 0 : 0;
    return bad + mat;
  }, [lastAreaBadQuantity, materialBadQuantity, currentFlow?.area?.id]);

  const handleToggleRespuesta = (
    questionId: number,
    _columnIndex: number,
    type: 'ok' | 'ng',
    checked: boolean
  ) => {
    setResponses((prev) => {
      const without = prev.filter((r) => r.questionId !== questionId);
      if (type === 'ok') {
        return checked ? [...without, { questionId, answer: true }] : without;
      }
      // type === 'ng'
      return checked ? [...without, { questionId, answer: false }] : without;
    });
  };
  const disableLiberarButton = shouldDisableLiberar();
  const disableLiberarCQM = shouldDisableCQM();
  const isListo = workOrder.status === 'Listo';

  const orderQuantity: number = useMemo(
    () =>
      workOrder?.workOrder?.quantity ??
      workOrder?.workOrder?.quantity_total ??
      workOrder?.quantity ??
      0,
    [workOrder]
  );

  const hasNextFlow = Boolean(nextFlow);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Área: Corte</Text>

      <WorkOrderInfo
        workOrder={workOrder}
        lastCompletedOrPartial={lastCompletedOrPartial}
        cantidadporliberar={cantidadporliberar}
      />

      <Text style={styles.label}>Cantidad a liberar</Text>
      <Text style={styles.label}>Buenas:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        keyboardType="numeric"
        placeholder="Ej: 100"
        value={goodQuantity}
        onChangeText={(text) => {
          if (text === '') return setGoodQuantity('');

          const n = Number(text);
          if (Number.isNaN(n) || n < 0) return;

          // aplicar clamp como en web
          const clamped = hasNextFlow ? n : Math.min(n, orderQuantity);
          setGoodQuantity(String(clamped));
        }}
      />
      <Text style={styles.label}>Malas:</Text>
      <TouchableOpacity
        onPress={handleOpenBadQuantityModal}
        activeOpacity={0.7}
      >
        <TextInput
          style={styles.input}
          theme={{ roundness: 30 }}
          mode="outlined"
          activeOutlineColor="#000"
          keyboardType="numeric"
          placeholder={sumaBadQuantity > 0 ? sumaBadQuantity.toString() : '0'}
          value={String(sumaBadQuantity)}
          editable={false} // deshabilita edición
          pointerEvents="none" // evita que se abra el teclado
        />
      </TouchableOpacity>
      <Text style={styles.label}>Sin procesar:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        keyboardType="numeric"
        placeholder="Ej: 100"
        value={noProcessQuantity}
        onChangeText={setNoProcessQuantity}
      />
      <Text style={styles.label}>Excedente:</Text>
      <TextInput
        style={styles.input}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        keyboardType="numeric"
        placeholder="Ej: 100"
        value={excessQuantity}
        onChangeText={setExcessQuantity}
      />

      <Text style={styles.label}>Comentarios:</Text>
      <TextInput
        style={styles.textarea}
        theme={{ roundness: 30 }}
        mode="outlined"
        activeOutlineColor="#000"
        multiline
        placeholder="Agrega comentarios..."
        value={comments}
        onChangeText={setComments}
      />

      <TouchableOpacity
        style={[
          styles.button,
          disableLiberarCQM && styles.disabledButton,
          isListo && styles.greenDisabledButton,
        ]}
        onPress={() => !disableLiberarCQM && setShowCqmModal(true)}
        disabled={disableLiberarCQM}
      >
        <Text style={styles.buttonText}>Enviar a Calidad/CQM</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.buttonSecondary,
          disableLiberarButton && styles.disabledButton,
        ]}
        onPress={() => !disableLiberarButton && setShowConfirm(true)}
        disabled={disableLiberarButton}
      >
        <Text style={styles.buttonText}>Liberar Producto</Text>
      </TouchableOpacity>

      <View style={{ marginBottom: 60 }}></View>

      {/* Modal para marcar malas por areas previas al liberar */}
      <BadQuantityModal
        visible={showBadQuantity}
        areas={normalizedAreas}
        areaBadQuantities={areaBadQuantities}
        setAreaBadQuantities={setAreaBadQuantities}
        onConfirm={({ lastAreaBad, lastAreaMaterial }) => {
          setShowBadQuantity(false);
          handleSaveChanges();
          setMaterialBadQuantity(String(lastAreaMaterial));
          setLastBadQuantity(String(lastAreaBad));
        }}
        onClose={() => setShowBadQuantity(false)}
      />

      {/* Modal CQM */}
      <Modal visible={showCqmModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#fdfaf6' }}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalTitle}>
              Preguntas del Área: {workOrder.area.name}
            </Text>

            <SelectionQuestionTable
              formQuestions={workOrder.area.formQuestions}
              roleId={null}
              columns={['Respuesta']}
              checkedQuestions={[
                { ok: checkedRespuestaOK, ng: checkedRespuestaNG },
              ]}
              onToggle={handleToggleRespuesta}
            />

            {/* Muestras */}
            <Text style={styles.label}>Muestras:</Text>
            <TextInput
              style={styles.input}
              theme={{ roundness: 30 }}
              mode="outlined"
              activeOutlineColor="#000"
              keyboardType="numeric"
              placeholder="Ej: 2"
              value={sampleQuantity}
              onChangeText={setSampleQuantity}
            />

            {/* Sección expandible de calidad */}
            <TouchableOpacity
              onPress={() => setShowQuality((prev) => !prev)}
              style={styles.toggleSection}
            >
              <Text style={styles.subtitle}>
                Preguntas de Calidad {showQuality ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {showQuality && (
              <>
                <SelectionQuestionTable
                  formQuestions={workOrder.area.formQuestions}
                  roleId={3}
                  columns={['Respuesta']}
                  checkedQuestions={[
                    { ok: checkedRespuestaOK, ng: checkedRespuestaNG },
                  ]}
                  readOnly={true}
                  onToggle={handleToggleRespuesta}
                />
              </>
            )}

            {/* Botones */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCqmModal(false)}
              >
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSubmitToCQM}
              >
                <Text style={styles.modalButtonText}>Enviar Respuestas</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal confirmación de liberación */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>¿Deseas liberar este producto?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleCorteSubmit}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default CorteComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 2,
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
  label: { fontWeight: '600', marginTop: 12, fontSize: 16, marginBottom: 8 },
  labelDetail: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  value: { marginBottom: 8 },
  valueDetail: {
    fontWeight: 'normal',
    fontSize: 16,
  },
  input: {
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 30,
    fontSize: 16,
  },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    minHeight: 30,
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
  cardDetail: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
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
    backgroundColor: '#0038A8',
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
    paddingTop: 80, // mejor control que marginTop
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
  greenDisabledButton: {
    backgroundColor: '#4CAF50',
    opacity: 1,
  },
  modalBoxScrollable: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  areaLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
  },
  areaInputsContainer: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  inputGroup: {
    width: '100%',
  },
});
