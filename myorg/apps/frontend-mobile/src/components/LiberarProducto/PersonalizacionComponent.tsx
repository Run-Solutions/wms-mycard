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
import BadQuantityModal, {
  AreaForBadQty,
  BadQuantityModalResult,
} from './util/BadQuantityModal';
import MachineSection from './util/MachineSection';
import WorkOrderInfo from './util/WorkOrderInfo';
import { usePartialReleaseControls } from './util/disablePartialTime';
import { getPrevAreaGoodPlusExcess } from '../AceptarAuditoria/util/lastWorkOrder';
import {
  getCurrentFlowPartialsTotal,
  getCurrentInputTotal,
  exceedsPrevAreaSum,
} from './util/helpers';
import {
  BlockKey,
  blockSupportsMaterial,
  computeAreaQuantities,
  loadBadQuantitySummaryAsync,
  mapDetailsToSummary,
  normalizeAreaKey,
  populateInitialValuesFromSummary,
  resolveBlockKey,
  saveBadQuantitySummaryAsync,
} from './util/areaMappings';

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
  const partialReleases = useMemo(
    () =>
      Array.isArray(currentFlow?.partialReleases)
        ? currentFlow.partialReleases
        : [],
    [currentFlow?.partialReleases]
  );

  const flowForControls = useMemo(() => {
    if (!currentFlow) {
      return {
        id: 0,
        status: '',
        areaResponse: null,
        workOrder: { quantity: 0 },
        partialReleases: [],
      };
    }

    return {
      id: currentFlow.id ?? 0,
      status: currentFlow.status ?? '',
      areaResponse: currentFlow.areaResponse ?? null,
      workOrder: { quantity: currentFlow.workOrder?.quantity ?? 0 },
      partialReleases,
    };
  }, [currentFlow, partialReleases]);

  const { disableAfterCorteCQM, disablePartial, cooldown } =
    usePartialReleaseControls({
      flow: flowForControls,
      cantidadPorLiberar: cantidadporliberar,
      withCountdown: true,
      statusesToCheck,
      blockedForCQM: [...CQM_BLOCKED_STATUSES],
      blockedForCQM_AfterCorte: [...AFTER_CORTE_BLOCKED_STATUSES],
    });

  const allParcialsValidated = useMemo(
    () =>
      partialReleases.length > 0
        ? partialReleases.every((r: PartialRelease) => r.validated)
        : false,
    [partialReleases]
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
    const workOrderKey = workOrder?.workOrder?.ot_id ?? '';
    const sourceFlows = Array.isArray(workOrder?.workOrder?.flow)
      ? workOrder.workOrder.flow
      : [];

    const hydratedFlows = sourceFlows.map((flow: any) => {
      const flowId = flow?.id ?? flow?.flow_id;
      const existingSummary = Array.isArray(flow?.badQuantitySummary)
        ? flow.badQuantitySummary
        : [];
      const detailSummary = mapDetailsToSummary(flow?.badQuantityDetails ?? []);

      const cachedSummary =
        !existingSummary.length &&
        !detailSummary.length &&
        workOrderKey &&
        flowId
          ? loadBadQuantitySummaryAsync(workOrderKey, flowId) ?? []
          : [];

      const summary = existingSummary.length
        ? existingSummary
        : detailSummary.length
        ? detailSummary
        : cachedSummary;

      return summary.length ? { ...flow, badQuantitySummary: summary } : flow;
    });

    setFlowListState(hydratedFlows);
  }, [workOrder?.workOrder?.flow, workOrder?.workOrder?.ot_id]);

  const targetAreaId = workOrder?.area?.id ?? null;

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

  // total actual “digitado” si lo necesita separado
  const totalActualDigitado = useMemo(
    () =>
      getCurrentInputTotal({
        cqm_quantity,
        goodQuantity,
        lastAreaBadQuantity,
        materialBadQuantity,
        excessQuantity,
        noProcessQuantity,
      }),
    [
      cqm_quantity,
      goodQuantity,
      lastAreaBadQuantity,
      materialBadQuantity,
      excessQuantity,
      noProcessQuantity,
    ]
  );

  console.log('totalParcialesActuales', totalParcialesActuales);

  const handleLiberarClick = async () => {
    const numValue = Number(goodQuantity);

    const orderQty = Number(workOrder?.workOrder?.quantity ?? 0);
    const goodQty = Number(goodQuantity ?? 0);
    const noProc = Number(noProcessQuantity ?? 0);

    // Suma de quantities de los partial releases del flujo actual
    const sumPartialQty = (currentFlow?.partialReleases ?? []).reduce(
      (acc: any, pr: any) => acc + Number(pr?.quantity ?? 0),
      0
    );

    // Producción considerada para la validación
    const producedSoFar = goodQty + sumPartialQty;
    const partialsActual = currentFlow?.partialReleases ?? [];
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0) {
      Alert.alert('Por favor, ingresa una cantidad válida para Buenas.');
      return;
    } else if (
      cqm_quantity +
        (Number(goodQuantity) +
          Number(lastAreaBadQuantity) +
          Number(materialBadQuantity) +
          Number(excessQuantity) +
          totalParcialesActuales) >
      prevAreaSum
    ) {
      Alert.alert(
        'La cantidad total a liberar el mayor a la entregada por parte del área previa.'
      );
      return;
    } else if (
      partialsActual.length > 0 &&
      Number(goodQuantity) +
        Number(lastAreaBadQuantity) +
        Number(excessQuantity) >
        cantidadporliberar
    ) {
      Alert.alert(
        `La cantidad total a liberar es diferente a la entregada no procesada por la parcialidad anterior ${cantidadporliberar}.`
      );
      return;
    } else if (
      producedSoFar < orderQty &&
      noProc === 0 &&
      currentFlow?.areaResponse == null
    ) {
      alert(`La cantidad de excedente ${Number(excessQuantity)} es invalida.`);
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

  const previousFlows = useMemo(
    () =>
      flowList.slice(0, currentIndex + 1).filter((flow) => flow.area_id !== 1),
    [flowList, currentIndex]
  );

  const handleOpenBadQuantityModal = () => {
    const initialValues: Record<string, string> = {};

    previousFlows.forEach((flow) => {
      (flow?.badQuantityDetails ?? []).forEach((detail: any) => {
        if (detail?.source_area_id === currentFlow?.area_id) {
          const areaName = normalizeAreaKey(detail?.targetArea?.name ?? '');
          initialValues[`${areaName}_bad`] =
            detail?.bad_quantity != null ? String(detail.bad_quantity) : '0';
          initialValues[`${areaName}_material`] =
            detail?.material_quantity != null
              ? String(detail.material_quantity)
              : '0';
        }
      });
    });

    setAreaBadQuantities(initialValues);
    setShowBadQuantity(true);
  };

  const normalizedAreas: AreaForBadQty[] = useMemo(
    () =>
      previousFlows.map((item) => ({
        supportsMaterial: blockSupportsMaterial(
          resolveBlockKey(item.area?.name ?? '')
        ),
        id: item.area?.id ?? item.id,
        name: item.area?.name ?? item.name ?? '',
        malas: item.malas ?? 0,
        defectuoso: item.defectuoso ?? 0,
        status: item.status ?? '',
        response: item.areaResponse ?? {},
        answers: item.answers ?? [],
        usuario: item.user?.username ?? '',
        auditor: '',
        buenas: 0,
        cqm: 0,
        excedente: 0,
        muestras: 0,
      })),
    [previousFlows]
  );

  const handleSaveChanges = async (
    modalInputs?: BadQuantityModalResult['inputsByArea']
  ) => {
    const toInt = (v: any) => {
      const n = parseInt(String(v ?? '0').trim(), 10);
      return Number.isFinite(n) ? n : 0;
    };

    const inputsMap = new Map(
      (modalInputs ?? []).map((item) => [item.areaId, item.values])
    );

    const payload = {
      areas: previousFlows.flatMap((flow) => {
        const areaName = flow.area?.name ?? '';
        const areaKey = normalizeAreaKey(areaName);
        console.log(areaKey, 'areaKey');

        // ✅ Tipar blockMap para que sus valores sean BlockKey
        const blockMap: Partial<Record<string, BlockKey>> = {
          impresion: 'impression',
          serigrafia: 'serigrafia',
          empalme: 'empalme',
          laminacion: 'laminacion',
          corte: 'corte',
          coloredge: 'colorEdge',
          millingchip: 'millingChip',
          hotstamping: 'hotStamping',
        };

        if (areaKey === 'personalizacion') return [] as any;

        // ✅ mappedBlock ahora es BlockKey | undefined
        const mappedBlock = blockMap[areaKey];
        // ✅ blockKey queda BlockKey | null
        const blockKey: BlockKey | null =
          mappedBlock ?? resolveBlockKey(areaName);
        if (!blockKey) return [] as any;

        const blockData = flow.areaResponse?.[blockKey];
        const blockId = blockData?.id ?? null;
        if (!blockId) return [] as any;

        const supportsMaterial = blockSupportsMaterial(blockKey);
        const formId = blockData?.form_auditory_id ?? null;
        const cqmId = blockData?.form_answer_id ?? null;

        const badKey = `${areaKey}_bad`;
        const materialKey = `${areaKey}_material`;

        const data: Record<string, number> = {
          bad_quantity: toInt(areaBadQuantities[badKey]),
        };

        if (supportsMaterial) {
          data.material_quantity = toInt(areaBadQuantities[materialKey]);
        }

        const inputsForArea = inputsMap.get(flow.area_id) ?? [];

        return {
          areaId: flow.area_id,
          block: blockKey, // ✅ typed
          blockId,
          formId,
          cqmId,
          data,
          inputsByArea: inputsForArea,
        };
      }),
      sourceAreaId: currentFlow?.area_id ?? workOrder?.area?.id ?? null,
      sourceWorkOrderFlowId: currentFlow?.id ?? null,
      badQuantitySummary: modalInputs ?? [],
    };

    try {
      const response = await updateWorkOrderAreas(
        workOrder?.workOrder?.ot_id,
        payload
      );

      const serverAreas = Array.isArray(response?.updatedAreas)
        ? response.updatedAreas
        : [];
      const effectiveAreas = serverAreas.length ? serverAreas : payload.areas;

      const serverAreaMap = new Map(
        effectiveAreas.map((areaItem: any) => [areaItem.areaId, areaItem])
      );
      const fallbackMap = new Map(
        payload.areas.map((areaItem: any) => [areaItem.areaId, areaItem])
      );

      setFlowListState((prev) =>
        prev.map((flow) => {
          const areaUpdate =
            serverAreaMap.get(flow.area_id) ?? fallbackMap.get(flow.area_id);
          const updatedFlow = { ...flow };
          if (!areaUpdate) {
            if (flow.id === currentFlow?.id) {
              updatedFlow.badQuantitySummary = modalInputs ?? [];
            }
            return updatedFlow;
          }

          const newAreaResponse = { ...(updatedFlow.areaResponse ?? {}) };
          const existingBlock = newAreaResponse[areaUpdate.block] ?? {};
          newAreaResponse[areaUpdate.block] = {
            ...existingBlock,
            ...(areaUpdate.data ?? {}),
            id: areaUpdate.blockId ?? existingBlock.id ?? null,
            form_auditory_id:
              areaUpdate.formId ?? existingBlock.form_auditory_id ?? null,
            form_answer_id:
              areaUpdate.cqmId ?? existingBlock.form_answer_id ?? null,
          };

          updatedFlow.areaResponse = newAreaResponse;

          if (flow.id === currentFlow?.id) {
            updatedFlow.badQuantitySummary = modalInputs ?? [];
          }

          return updatedFlow;
        })
      );

      if (currentFlow?.id) {
        saveBadQuantitySummaryAsync(
          workOrder?.workOrder?.ot_id,
          currentFlow.id,
          modalInputs ?? []
        );
      }

      const baseValues: Record<string, string> = {};
      previousFlows.forEach((flow) => {
        const areaName = flow.area?.name ?? '';
        const areaKey = normalizeAreaKey(areaName);
        if (!areaKey) return;

        // ✅ resolver el BlockKey con el mismo tipado
        const blockMapLocal: Partial<Record<string, BlockKey>> = {
          impresion: 'impression',
          serigrafia: 'serigrafia',
          empalme: 'empalme',
          laminacion: 'laminacion',
          corte: 'corte',
          coloredge: 'colorEdge',
          millingchip: 'millingChip',
          hotstamping: 'hotStamping',
        };
        const mapped = blockMapLocal[areaKey];
        const resolvedBlock: BlockKey | null =
          mapped ?? resolveBlockKey(areaName);

        const supportsMat = blockSupportsMaterial(resolvedBlock);

        if (!(areaKey + '_bad' in baseValues)) {
          baseValues[`${areaKey}_bad`] = '0';
        }
        if (supportsMat && !(areaKey + '_material' in baseValues)) {
          baseValues[`${areaKey}_material`] = '0';
        }
      });

      setAreaBadQuantities(() => {
        const next: Record<string, string> = { ...baseValues };
        populateInitialValuesFromSummary(modalInputs ?? [], next);
        return next;
      });

      const currentAreaId = workOrder?.area?.id;
      if (currentAreaId) {
        const currentAreaUpdate =
          serverAreaMap.get(currentAreaId) ?? fallbackMap.get(currentAreaId);

        if (currentAreaUpdate?.data?.bad_quantity !== undefined) {
          setLastBadQuantity(String(currentAreaUpdate.data.bad_quantity ?? 0));
        }

        if (currentAreaUpdate?.data?.material_quantity !== undefined) {
          setMaterialBadQuantity(
            String(currentAreaUpdate.data.material_quantity ?? 0)
          );
        }
      }

      alert('Cambios guardados correctamente');
    } catch (err) {
      console.error('Error al guardar los cambios', err);
      alert('Error al guardar los cambios');
    }
  };

  const sumaBadQuantity = useMemo(() => {
    if (!Array.isArray(normalizedAreas) || normalizedAreas.length === 0) {
      const supportsMaterial = blockSupportsMaterial(
        resolveBlockKey(currentFlow?.area?.name ?? '')
      );
      const bad = Number(lastAreaBadQuantity) || 0;
      const mat = supportsMaterial ? Number(materialBadQuantity) || 0 : 0;
      return bad + mat;
    }

    return normalizedAreas.reduce((acc, area: any) => {
      const key = normalizeAreaKey(area.name);
      const bad = Number(areaBadQuantities[`${key}_bad`] ?? 0);
      const mat = area.supportsMaterial
        ? Number(areaBadQuantities[`${key}_material`] ?? 0)
        : 0;
      return acc + bad + mat;
    }, 0);
  }, [
    normalizedAreas,
    areaBadQuantities,
    lastAreaBadQuantity,
    materialBadQuantity,
    currentFlow?.area?.name,
  ]);

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
        onConfirm={({ inputsByArea }) => {
          const currentAreaInputs = inputsByArea.find(
            (item) => item.areaId === workOrder.area.id
          );

          if (currentAreaInputs) {
            const normalizeLabel = (value: string) =>
              value
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim()
                .toLowerCase();

            const findValue = (label: string) =>
              currentAreaInputs.values.find(
                (entry) => normalizeLabel(entry.label) === normalizeLabel(label)
              )?.value ?? 0;

            setLastBadQuantity(String(findValue('Malas')));
            setMaterialBadQuantity(String(findValue('Malo de fábrica')));
          }

          setShowBadQuantity(false);
          void handleSaveChanges(inputsByArea);
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
