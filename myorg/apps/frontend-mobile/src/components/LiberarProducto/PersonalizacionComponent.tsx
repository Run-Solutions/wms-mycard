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
  Switch,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import {
  submitToCQMPersonalizacion,
  releaseProductFromPersonalizacion,
} from '../../api/liberarProducto';
import { updateWorkOrderAreas } from '../../api/seguimientoDeOts';
import { useAuth } from '../../contexts/AuthContext';
import { calcularCantidadPorLiberar } from './util/calcularCantidadPorLiberar';
import BadQuantityModal from './util/BadQuantityModal';
import MachineSection from './util/MachineSection';
import WorkOrderInfo from './util/WorkOrderInfo';
import { usePartialReleaseControls } from './util/disablePartialTime';
import { getPrevAreaGoodPlusExcess } from '../AceptarAuditoria/util/lastWorkOrder';
import { getCurrentFlowPartialsTotal } from './util/helpers';

interface PartialRelease {
  validated: boolean;
  quantity: number;
}
export type AreaData = {
  id: number;
  name: string;
  status: string;
  response: {
    prepress: { id: number };
    impression: { id: number };
    serigrafia: { id: number };
    empalme: { id: number };
    laminacion: { id: number };
    corte: { id: number };
    colorEdge: { id: number };
    millingChip: { id: number };
    hotStamping: { id: number };
    personalizacion: { id: number };
    user: {
      username: string;
    };
  };
  answers: any;
  usuario: string;
  auditor: string;
  buenas: number;
  malas: number;
  cqm: number;
  excedente: number;
  defectuoso: number;
  muestras: number;
};
const slicesByOption: Record<string, [number, number]> = {
  etiquetadora: [0, 1],
  persos: [1, 10],
  otto: [20, 28],
  packsmart: [14, 15],
  embolsadora: [28, 30],
  laser: [0, 0], // sin preguntas
};

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

const PersonalizacionComponent = ({ workOrder }: { workOrder: any }) => {
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
  const [selectedOption, setSelectedOption] = useState('etiquetadora');
  const [verificarEtiqueta, setVerificarEtiqueta] = useState('');
  const [colorPersonalizacion, setColorPersonalizacion] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [sliceStart, sliceEnd] = slicesByOption[selectedOption] ?? [0, 0];
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

  const orderQuantity: number = useMemo(
    () =>
      workOrder?.workOrder?.quantity ??
      workOrder?.workOrder?.quantity_total ??
      workOrder?.quantity ??
      0,
    [workOrder]
  );

  const hasNextFlow = Boolean(nextFlow);

  const answersByQuestion = useMemo(() => {
    const map: Record<number, boolean | undefined> = {};
    for (const r of responses) map[r.questionId] = r.answer;
    return map;
  }, [responses]);

  const baseQuestions = useMemo(
    () =>
      workOrder?.area?.formQuestions?.filter((q: any) => q.role_id === null) ??
      [],
    [workOrder]
  );
  // 🔹 Las que realmente se ven según la opción elegida
  const activeQuestions = useMemo(() => {
    // Caso máquinas sin preguntas (p.ej. láser en tu mapeo [0,0])
    if (!sliceStart && !sliceEnd && selectedOption === 'laser') return [];
    // slice usa fin EXCLUSIVO
    return baseQuestions.slice(sliceStart, sliceEnd);
  }, [baseQuestions, sliceStart, sliceEnd, selectedOption]);

  const checkedRespuestaOK = useMemo(
    () =>
      activeQuestions
        .filter((q: any) => answersByQuestion[q.id] === true)
        .map((q: any) => q.id),
    [activeQuestions, answersByQuestion]
  );

  const checkedRespuestaNG = useMemo(
    () =>
      activeQuestions
        .filter((q: any) => answersByQuestion[q.id] === false)
        .map((q: any) => q.id),
    [activeQuestions, answersByQuestion]
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

    // Construir arrays alineados **sólo** con visibleQuestions por slice
    const question_id: number[] = [];
    const response: boolean[] = [];

    activeQuestions.forEach((q: any) => {
      const ans = answersByQuestion[q.id];
      if (ans !== undefined) {
        question_id.push(q.id);
        response.push(!!ans);
      }
    });
    const mustAnswerAll = activeQuestions.length > 0;
    if (mustAnswerAll && question_id.length !== activeQuestions.length) {
      alert('Completa todas las preguntas y cantidad de muestra.');
      return;
    }

    const basePayload = {
      question_id,
      work_order_flow_id: flowId,
      work_order_id: currentFlow.workOrder.id,
      area_id: currentFlow.area.id,
      response,
      reviewed: false,
      user_id: currentFlow.assigned_user,
      sample_quantity: Number(sampleQuantity),
      tipo_personalizacion: selectedOption,
    };
    let aditionalFields = {};
    if (selectedOption === 'etiquetadora') {
      aditionalFields = {
        verificar_etiqueta: verificarEtiqueta,
      };
    } else if (selectedOption === 'persos') {
      aditionalFields = {
        color_personalizacion: colorPersonalizacion,
        codigo_barras: codigoBarras,
      };
    } else if (selectedOption === 'laser') {
      aditionalFields = {};
    }
    const payload = {
      ...basePayload,
      ...aditionalFields,
    };

    try {
      await submitToCQMPersonalizacion(payload);
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

  const prevAreaSum = useMemo(
    () => getPrevAreaGoodPlusExcess(workOrder),
    [workOrder]
  );
  console.log('prevAreaSum', prevAreaSum);

  const cqm_quantity = (workOrder?.answers ?? []).reduce(
    (total: number, answer: { sample_quantity?: number | string }) =>
      total + (Number(answer?.sample_quantity) || 0),
    0
  );
  console.log('cqm', cqm_quantity);

  // Si quieres loguear los parciales del flow actual
  const totalParcialesActuales = useMemo(
    () =>
      getCurrentFlowPartialsTotal(
        currentFlow /* , { includeUnvalidated: false } */
      ),
    [currentFlow]
  );

  const handleLiberarClick = () => {
    const numValue = Number(goodQuantity);
    if (
      Number.isNaN(numValue) ||
      !Number.isInteger(numValue) ||
      numValue <= 0
    ) {
      alert('Por favor, ingresa una cantidad válida para Buenas.');
      return;
    } else if (
      cqm_quantity +
        Number(goodQuantity) +
        Number(lastAreaBadQuantity) +
        Number(materialBadQuantity) +
        Number(excessQuantity) +
        Number(noProcessQuantity)  + totalParcialesActuales>
      prevAreaSum
    ) {
      alert(
        'La cantidad total a liberar el mayor a la entregada por parte del área previa.'
      );
      return;
    }

    const partials = lastCompletedOrPartial?.partialReleases ?? [];
    if (Array.isArray(partials) && partials.length > 0) {
      const totalValidatedQuantity = partials
        .filter((release: PartialRelease) => release.validated)
        .reduce((sum: number, r: PartialRelease) => sum + (r.quantity ?? 0), 0);
      console.log('Total validado:', totalValidatedQuantity);
    }

    setShowConfirm(true);
  };

  const handlePersonalizacionSubmit = async () => {
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
      await releaseProductFromPersonalizacion(payload);
      setShowConfirm(false);
      Alert.alert('Producto liberado correctamente');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error del servidor al liberar.');
    }
  };

  const previousFlows = flowList
    .slice(0, currentIndex + 1)
    .filter((flow) => flow.area_id !== 1);

  console.log('Áreas anteriores sin Preprensa:', previousFlows);

  const handleOpenBadQuantityModal = () => {
    const initialValues: { [areaName: string]: string } = {
      ...areaBadQuantities,
    };

    previousFlows.forEach((flow) => {
      const areaName = flow.area.name;

      let badQuantity: number | null | undefined = null;
      let materialBadQuantity: number | null | undefined = null;

      // Primero, busca en areaResponse
      if (flow.areaResponse?.impression) {
        badQuantity = flow.areaResponse.impression.bad_quantity;
      } else if (flow.areaResponse?.serigrafia) {
        badQuantity = flow.areaResponse.serigrafia.bad_quantity;
      } else if (flow.areaResponse?.laminacion) {
        badQuantity = flow.areaResponse.laminacion.bad_quantity;
      } else if (flow.areaResponse?.corte) {
        badQuantity = flow.areaResponse.corte.bad_quantity;
        materialBadQuantity = flow.areaResponse.corte.material_quantity;
      } else if (flow.areaResponse?.colorEdge) {
        badQuantity = flow.areaResponse.colorEdge.bad_quantity;
        materialBadQuantity = flow.areaResponse.colorEdge.material_quantity;
      } else if (flow.areaResponse?.hotStamping) {
        badQuantity = flow.areaResponse.hotStamping.bad_quantity;
        materialBadQuantity = flow.areaResponse.hotStamping.material_quantity;
      } else if (flow.areaResponse?.millingChip) {
        badQuantity = flow.areaResponse.millingChip.bad_quantity;
        materialBadQuantity = flow.areaResponse.millingChip.material_quantity;
      } else if (flow.areaResponse?.personalizacion) {
        badQuantity = flow.areaResponse.personalizacion.bad_quantity;
        materialBadQuantity =
          flow.areaResponse.personalizacion.material_quantity;
      }

      // Si sigue sin valor, busca en partialReleases
      if (
        (badQuantity === null || badQuantity === undefined) &&
        flow.partialReleases?.length > 0
      ) {
        badQuantity = flow.partialReleases.reduce(
          (sum: number, release: any) => {
            return sum + (release.bad_quantity ?? 0);
          },
          0
        );
        materialBadQuantity = flow.partialReleases.reduce(
          (sum: number, release: any) => {
            return sum + (release.material_quantity ?? 0);
          },
          0
        );
      }
      // ⚠️ SOLO setear si no están ya definidos
      if (initialValues[`${areaName}_bad`] === undefined) {
        initialValues[`${areaName}_bad`] =
          badQuantity !== null && badQuantity !== undefined
            ? String(badQuantity)
            : '';
      }

      if (
        flow.area.id >= 6 &&
        initialValues[`${areaName}_material`] === undefined
      ) {
        initialValues[`${areaName}_material`] =
          materialBadQuantity !== null && materialBadQuantity !== undefined
            ? String(materialBadQuantity)
            : '';
      }
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
          corte: 'corte',
          'color edge': 'colorEdge',
          'hot stamping': 'hotStamping',
          'milling chip': 'millingChip',
        };

        const block = blockMap[areaKey] || 'otros';
        if (block === 'otros' || areaKey === 'personalizacion') return [];

        const blockData = flow.areaResponse?.[block];
        if (!blockData?.id) return [];

        const badKey = `${areaKey}_bad`;
        const materialKey = `${areaKey}_material`;

        const bad_quantity = toInt(areaBadQuantities[badKey]);
        const material_quantity =
          flow.area.id > 6 ? toInt(areaBadQuantities[materialKey]) : undefined;
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

    console.log('Payload a enviar:', payload);

    try {
      await updateWorkOrderAreas(workOrder.workOrder.ot_id, payload);
      setFlowListState((prev) => {
        const byArea = new Map(payload.areas.map((a: any) => [a.areaId, a]));
        return prev.map((f) => {
          const upd = byArea.get(f.area_id);
          if (!upd) return f;

          const newAreaResponse = { ...(f.areaResponse ?? {}) };
          const existingBlock = newAreaResponse[upd.block] ?? {};
          newAreaResponse[upd.block] = {
            ...existingBlock,
            ...upd.data, // bad_quantity y (opcional) material_quantity
            // Conserva ids si los tenías
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

  const isListo = currentFlow.status === 'Listo';

  const firstQuestion = workOrder.area.formQuestions?.[0];

  console.log(disableLiberarButton, disableLiberarCQM);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Área: Personalización</Text>

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
        onPress={() => !disableLiberarButton && handleLiberarClick()}
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
      <Modal
        visible={showCqmModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ScrollView
          style={{ flex: 1 }} // ocupa la pantalla
          contentContainerStyle={styles.modalContent} // sin flex:1 aquí
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          <Text style={styles.title}>
            Preguntas del Área: {workOrder.area.name}
          </Text>

          {/* Tabs */}
          <View style={styles.tabs}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                'etiquetadora',
                'persos',
                'laser',
                'packsmart',
                'otto',
                'embolsadora',
              ].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.tab,
                    { marginRight: 10 },
                    selectedOption === opt && styles.tabSelected,
                  ]}
                  onPress={() => setSelectedOption(opt)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedOption === opt && styles.tabTextSelected,
                    ]}
                  >
                    {opt === 'persos'
                      ? "Persos's"
                      : opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tabla de preguntas */}
          {selectedOption === 'etiquetadora' && firstQuestion && (
            <>
              <MachineSection
                visible={selectedOption === 'etiquetadora'}
                machine="etiquetadora"
                questions={workOrder.area.formQuestions}
                areaId={10}
                roleId={null}
                questionSlice={[0, 1]} // ✅ Solo la primera pregunta
                columns={['Respuesta']} // una columna => pares OK/NG
                checkedQuestions={[
                  { ok: checkedRespuestaOK, ng: checkedRespuestaNG },
                ]}
                onToggle={handleToggleRespuesta}
                extras={
                  <>
                    <Text style={styles.label}>
                      Verificar Tipo De Etiqueta Vs Ot Y Pegar Utilizada:
                    </Text>
                    <TextInput
                      placeholder="Ej:"
                      value={verificarEtiqueta}
                      onChangeText={setVerificarEtiqueta}
                      style={styles.input}
                      theme={{ roundness: 30 }}
                      mode="outlined"
                      activeOutlineColor="#000"
                    />
                  </>
                }
              />
            </>
          )}
          {selectedOption === 'persos' && (
            <>
              <MachineSection
                visible={selectedOption === 'persos'}
                machine="persos"
                questions={workOrder.area.formQuestions}
                areaId={10}
                roleId={null}
                questionSlice={[1, 10]} // ✅ Solo la primera pregunta
                columns={['Respuesta']} // una columna => pares OK/NG
                checkedQuestions={[
                  { ok: checkedRespuestaOK, ng: checkedRespuestaNG },
                ]}
                onToggle={handleToggleRespuesta}
                extras={
                  <>
                    <Text style={styles.label}>Color De Personalización:</Text>
                    <TextInput
                      placeholder="Ej: "
                      value={colorPersonalizacion}
                      onChangeText={setColorPersonalizacion}
                      style={styles.input}
                      theme={{ roundness: 30 }}
                      mode="outlined"
                      activeOutlineColor="#000"
                    />
                    {/* Campo de muestras */}
                    <Text style={styles.label}>
                      Tipo de Código de Barras Que Se Personaliza:
                    </Text>
                    <TextInput
                      placeholder="Ej: "
                      value={codigoBarras}
                      onChangeText={setCodigoBarras}
                      style={styles.input}
                      theme={{ roundness: 30 }}
                      mode="outlined"
                      activeOutlineColor="#000"
                    />
                  </>
                }
              />
            </>
          )}
          {selectedOption === 'otto' && (
            <>
              <MachineSection
                visible={selectedOption === 'otto'}
                machine="otto"
                questions={workOrder.area.formQuestions}
                areaId={10}
                roleId={null}
                questionSlice={[20, 28]} // ✅ Solo la primera pregunta
                columns={['Respuesta']} // una columna => pares OK/NG
                checkedQuestions={[
                  { ok: checkedRespuestaOK, ng: checkedRespuestaNG },
                ]}
                onToggle={handleToggleRespuesta}
                extras={<></>}
              />
            </>
          )}
          {selectedOption === 'laser' && (
            <>
              <Text>No hay preguntas por parte del operador.</Text>
            </>
          )}
          {selectedOption === 'packsmart' && (
            <>
              <MachineSection
                visible={selectedOption === 'packsmart'}
                machine="packsmart"
                questions={workOrder.area.formQuestions}
                areaId={10}
                roleId={null} // ver nota abajo para filtrar por rol
                questionSlice={[14, 15]} // ✅ solo la pregunta en índice 14 (fin exclusivo)
                columns={['Respuesta']} // una columna => pares OK/NG
                checkedQuestions={[
                  { ok: checkedRespuestaOK, ng: checkedRespuestaNG },
                ]}
                onToggle={handleToggleRespuesta}
                extras={<></>}
              />
            </>
          )}

          {selectedOption === 'embolsadora' && (
            <>
              <MachineSection
                visible={selectedOption === 'embolsadora'}
                machine="embolsadora"
                questions={workOrder.area.formQuestions}
                areaId={10}
                roleId={null}
                questionSlice={[28, 30]} // ✅ Solo la primera pregunta
                columns={['Respuesta']} // una columna => pares OK/NG
                checkedQuestions={[
                  { ok: checkedRespuestaOK, ng: checkedRespuestaNG },
                ]}
                onToggle={handleToggleRespuesta}
                extras={<></>}
              />
            </>
          )}

          {/* Campo de muestras */}
          <Text style={styles.label}>Muestras:</Text>
          <TextInput
            placeholder="Ej: 2"
            value={sampleQuantity}
            onChangeText={setSampleQuantity}
            style={styles.input}
            theme={{ roundness: 30 }}
            mode="outlined"
            activeOutlineColor="#000"
            keyboardType="numeric"
          />

          {/* Preguntas de calidad */}
          <TouchableOpacity onPress={() => setShowQuality(!showQuality)}>
            <Text style={styles.qualityTitle}>
              Preguntas de Calidad {showQuality ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          {selectedOption === 'persos' && showQuality && (
            <ScrollView style={styles.scrollArea}>
              {workOrder.area.formQuestions.slice(13, 16).map((q: any) => (
                <View key={q.id} style={styles.qualityRow}>
                  <Text style={styles.qualityQuestion}>{q.title}</Text>
                </View>
              ))}
              <Text style={styles.label}>
                Validar Carga De Aplicación (PersoMaster):
              </Text>
              <TextInput
                placeholder="Ej:"
                style={styles.input}
                theme={{ roundness: 30 }}
                mode="outlined"
                activeOutlineColor="#000"
                editable={false}
              />
            </ScrollView>
          )}
          {selectedOption === 'laser' && showQuality && (
            <ScrollView style={styles.scrollArea}>
              {workOrder.area.formQuestions
                .slice(9, 13)
                .filter(
                  (question: { role_id: number | null }) =>
                    question.role_id === 3
                )
                .map((q: any) => (
                  <View key={q.id} style={styles.qualityRow}>
                    <Text style={styles.qualityQuestion}>{q.title}</Text>
                  </View>
                ))}
              <Text style={styles.label}>
                Verificar Script / Layout Vs Ot / Autorizacion:
              </Text>
              <TextInput
                placeholder="Ej:"
                style={styles.input}
                theme={{ roundness: 30 }}
                mode="outlined"
                activeOutlineColor="#000"
                editable={false}
              />
              <Text style={styles.label}>
                Validar, Anotar KVC (Llaves), Carga de Aplicación o
                Prehabilitación:
              </Text>
              <TextInput
                placeholder="Ej:"
                style={styles.input}
                theme={{ roundness: 30 }}
                mode="outlined"
                activeOutlineColor="#000"
                editable={false}
              />
              <Text style={styles.label}>
                Describir Apariencia Del Quemado Del Laser (Color):
              </Text>
              <TextInput
                placeholder="Ej:"
                style={styles.input}
                theme={{ roundness: 30 }}
                mode="outlined"
                activeOutlineColor="#000"
                editable={false}
              />
            </ScrollView>
          )}
          {['etiquetadora', 'packsmart', 'otto', 'embolsadora'].includes(
            selectedOption
          ) &&
            showQuality && (
              <>
                {/* Botones */}
                <Text>No hay preguntas</Text>
              </>
            )}

          {/* Botones */}
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowCqmModal(false)}
            >
              <Text style={styles.cancelText}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmitToCQM}
            >
              <Text style={styles.submitText}>Enviar Respuestas</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
                onPress={handlePersonalizacionSubmit}
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

export default PersonalizacionComponent;

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
    marginTop: 20,
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
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  tabSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  tabText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  tabTextSelected: {
    color: '#fff',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableCellBold: {
    fontWeight: 'bold',
  },

  qualityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelBtn: {
    backgroundColor: '#d1d5db',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  cancelText: {
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 10,
    flex: 1,
  },
  submitText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
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
  modalContent: {
    padding: 20,
    paddingBottom: 40, // deja espacio para los botones
    marginTop: 20,
    backgroundColor: '#fdfaf6',
  },
});
