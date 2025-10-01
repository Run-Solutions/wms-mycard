'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import {
  submitToCQMHotStamping,
  releaseProductFromHotStamping,
} from '@/api/liberarProducto';
import { updateWorkOrderAreas } from '@/api/seguimientoDeOts';

import { useAuthContext } from '@/context/AuthContext';

import { calcularCantidadPorLiberar } from './util/calcularCantidadPorLiberar';
import BadQuantityModal, {
  BadQuantityModalResult,
} from './util/BadQuantityModal';
import SelectionQuestionTable from './util/FormQuestionTable';
import WorkOrderInfo from './util/WorkOrderInfo';
import { usePartialReleaseControls } from './util/disablePartialTime';
import type { AreaForBadQty } from './util/BadQuantityModal';
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
  loadBadQuantitySummary,
  mapDetailsToSummary,
  normalizeAreaKey,
  populateInitialValuesFromSummary,
  resolveBlockKey,
  saveBadQuantitySummary,
} from './util/areaMappings';

interface Props {
  workOrder: any;
}

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

export default function HotStampingComponent({ workOrder }: Props) {
  const router = useRouter();
  const { user } = useAuthContext();
  const currentUserId = user?.id;

  const isDisabled = workOrder.status === 'En proceso';

  const [showModal, setShowModal] = useState(false);
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [areaBadQuantities, setAreaBadQuantities] = useState<
    Record<string, string>
  >({});

  const [goodQuantity, setGoodQuantity] = useState<number | string>('');
  const [excessQuantity, setExcessQuantity] = useState<number | string>('');
  const [noProcessQuantity, setNoProcessQuantity] = useState<number | string>(
    ''
  );
  const [materialBadQuantity, setMaterialBadQuantity] = useState<string>('0');
  const [lastAreaBadQuantity, setLastBadQuantity] = useState<string>('0');

  const [responses, setResponses] = useState<
    { questionId: number; answer: boolean }[]
  >([]);
  const [sampleQuantity, setSampleQuantity] = useState<number | string>('');
  const [qualitySectionOpen, setQualitySectionOpen] = useState(false);
  const [colorFoil, setColorFoil] = useState('');
  const [revisarPosicion, setRevisarPosicion] = useState<string>('');
  const [revisarPosicionChecks, setRevisarPosicionChecks] = useState<string[]>(
    []
  );
  const [imagenHolograma, setImagenHolograma] = useState<string>('');
  const [imagenHologramaChecks, setImagenHologramaChecks] = useState<string[]>(
    []
  );
  const commentsRef = useRef<HTMLTextAreaElement | null>(null);

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
  console.log('Cantidad por liberar:', cantidadporliberar);

  const orderQuantity: number = useMemo(
    () =>
      workOrder?.workOrder?.quantity ??
      workOrder?.workOrder?.quantity_total ??
      workOrder?.quantity ??
      0,
    [workOrder]
  );

  const hasNextFlow = Boolean(nextFlow);

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
        .filter((q) => answersByQuestion[q.id] === true)
        .map((q) => q.id),
    [visibleQuestions, answersByQuestion]
  );

  const checkedRespuestaNG = useMemo(
    () =>
      visibleQuestions
        .filter((q) => answersByQuestion[q.id] === false)
        .map((q) => q.id),
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

  // ------- Efectos de seguridad -------
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
          ? loadBadQuantitySummary(workOrderKey, flowId) ?? []
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
    if (loggedOnce.current) return;
    // Logs controlados (evitar duplicados de StrictMode)
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
      router.push('/liberarProducto'); // opcional
    }
  }, [currentFlow]);

  if (!currentFlow) return null; // Falla segura en render

  useEffect(() => {
    setFlowListState([...(workOrder?.workOrder?.flow ?? [])]);
  }, [workOrder]);

  // =================== Handlers ===================
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };

  const handleSampleQuantityChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSampleQuantity(e.target.value);
  };

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

  const handleSubmitToCQM = async () => {
    const flowId = currentFlow.id;
    const numValue = Number(sampleQuantity);

    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0) {
      alert('Por favor, ingresa una cantidad de muestra válida.');
      return;
    }

    // Alinear arrays con el ORDEN de visibleQuestions
    const question_id: number[] = [];
    const response: boolean[] = [];

    visibleQuestions.forEach((q: any) => {
      const ans = answersByQuestion[q.id];
      if (ans !== undefined) {
        question_id.push(q.id);
        response.push(!!ans);
      }
    });

    if (question_id.length !== visibleQuestions.length) {
      alert('Completa todas las preguntas y cantidad de muestra.');
      return;
    }

    const payload = {
      question_id: responses.map((r) => r.questionId),
      work_order_flow_id: flowId,
      work_order_id: currentFlow.workOrder.id,
      area_id: currentFlow.area.id,
      response: responses.map((r) => r.answer),
      reviewed: false,
      user_id: currentFlow.assigned_user,
      sample_quantity: Number(sampleQuantity),
      color_foil: colorFoil,
      revisar_posicion: revisarPosicion,
      imagen_holograma: imagenHolograma,
    };

    try {
      await submitToCQMHotStamping(payload);
      router.push('/liberarProducto');
    } catch (error) {
      console.log('Error al guardar la respuesta: ', error);
    }
  };

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

  console.log('totalParcialesActuales', totalParcialesActuales);

  const handleLiberarClick = () => {
    const numValue = Number(goodQuantity);
    const partialsActual = currentFlow?.partialReleases ?? [];
    if (
      Number.isNaN(numValue) ||
      !Number.isInteger(numValue) ||
      numValue <= 0
    ) {
      alert('Por favor, ingresa una cantidad válida para Buenas.');
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
      alert(
        'La cantidad total a liberar es mayor a la entregada por parte del área previa.'
      );
      return;
    } else if (
      partialsActual.length > 0 &&
      Number(goodQuantity) +
        Number(lastAreaBadQuantity) +
        Number(excessQuantity) >
        cantidadporliberar
    ) {
      alert(
        `La cantidad total a liberar es mayor a la entregada no procesada por la parcialidad anterior ${cantidadporliberar}.`
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

  const toggleQualitySection = () => {
    setQualitySectionOpen(!qualitySectionOpen);
  };

  const handleRevisarPosicionChange = (value: string) => {
    setRevisarPosicionChecks((prev) => {
      const newValues = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];

      // Generamos el string final
      const finalValue =
        newValues.length === 2 ? 'hologramafoil' : newValues[0] || '';

      setRevisarPosicion(finalValue);
      return newValues;
    });
  };

  const handleImagenHologramaChange = (value: string) => {
    setImagenHologramaChecks((prev) => {
      const newValues = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];

      const finalValue =
        newValues.length === 2 ? 'hologramafoil' : newValues[0] || '';

      setImagenHolograma(finalValue);
      return newValues;
    });
  };

  const handleHotStampingSubmit = async () => {
    const payload = {
      workOrderId: workOrder.workOrder.id,
      workOrderFlowId: currentFlow.id,
      areaId: workOrder.area.id,
      assignedUser: currentFlow.assigned_user,
      releaseQuantity: Number(sampleQuantity),
      goodQuantity: Number(goodQuantity),
      badQuantity: Number(lastAreaBadQuantity),
      materialBadQuantity: Number(materialBadQuantity),
      excessQuantity: Number(excessQuantity),
      noProcessQuantity: Number(noProcessQuantity),
      comments: commentsRef.current?.value?.trim() ?? '',
      formAnswerId: currentFlow?.answers?.[0]?.id,
    };

    try {
      await releaseProductFromHotStamping(payload);
      router.push('/liberarProducto');
    } catch (error) {
      console.log('Error al enviar datos:', error);
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
        };

        if (areaKey === 'hotstamping') return [] as any;

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
        saveBadQuantitySummary(
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

    return normalizedAreas.reduce((acc, area) => {
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


  return (
    <>
      <Container>
        <Title>Área: Hot Stamping</Title>

        <WorkOrderInfo
          workOrder={workOrder}
          lastCompletedOrPartial={lastCompletedOrPartial}
          cantidadporliberar={cantidadporliberar}
        />
        <NewData>
          <SectionTitle>Datos de Producción</SectionTitle>
          <NewDataWrapper>
            <InputGroup>
              <Label>Buenas:</Label>
              <Input
                type="number"
                min="0"
                max={hasNextFlow ? undefined : orderQuantity}
                placeholder="Ej: 2"
                value={goodQuantity}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') return setGoodQuantity('');
                  const n = Number(raw);
                  if (Number.isNaN(n) || n < 0) return;
                  const clamped = hasNextFlow ? n : Math.min(n, orderQuantity);
                  setGoodQuantity(String(clamped));
                }}
                disabled={shouldDisableLiberar()}
              />
              <Label>Malas:</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 2"
                value={sumaBadQuantity}
                onClick={handleOpenBadQuantityModal}
                readOnly
              />
              <Label>Sin procesar:</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 2"
                value={noProcessQuantity}
                onChange={(e) => setNoProcessQuantity(e.target.value)}
                disabled={shouldDisableLiberar()}
              />
              <Label>Excedente:</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 2"
                value={excessQuantity}
                onChange={(e) => setExcessQuantity(e.target.value)}
                disabled={shouldDisableLiberar()}
              />
            </InputGroup>
            <CqmButton
              $status={
                currentFlow?.status || lastCompletedOrPartial?.status || ''
              }
              $cantidadporliberar={String(cantidadporliberar)}
              onClick={openModal}
              disabled={shouldDisableCQM()}
            >
              Enviar a Calidad/CQM
            </CqmButton>
          </NewDataWrapper>
          <InputGroup>
            <SectionTitle>Comentarios</SectionTitle>
            <Textarea
              placeholder="Agrega un comentario adicional..."
              disabled={shouldDisableLiberar()}
            />
          </InputGroup>
        </NewData>
        <LiberarButton
          disabled={shouldDisableLiberar()}
          onClick={handleLiberarClick}
        >
          Liberar Producto
        </LiberarButton>
      </Container>

      {/* Modal para marcar malas por areas previas al liberar */}
      {showBadQuantity && (
        <BadQuantityModal
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
                  (entry) =>
                    normalizeLabel(entry.label) === normalizeLabel(label)
                )?.value ?? 0;

              setLastBadQuantity(String(findValue('Malas')));
              setMaterialBadQuantity(String(findValue('Malo de fábrica')));
            }

            setShowBadQuantity(false);
            void handleSaveChanges(inputsByArea);
          }}
          onClose={() => setShowBadQuantity(false)}
        />
      )}

      {/* Modal para enviar a liberacion */}
      {showConfirm && (
        <ModalOverlay>
          <ModalBox>
            <h4>¿Estás segura/o que deseas liberar este producto?</h4>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              <CancelButton onClick={() => setShowConfirm(false)}>
                Cancelar
              </CancelButton>
              <ConfirmButton onClick={handleHotStampingSubmit}>
                Confirmar
              </ConfirmButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* Modal para Enviar a Calidad/CQM */}
      {showModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Preguntas del Área: {workOrder.area.name}</ModalTitle>
            <SelectionQuestionTable
              formQuestions={workOrder.area.formQuestions}
              roleId={null} // Operación
              columns={['Respuesta']} // genera subcolumnas OK/NG
              checkedQuestions={[
                { ok: checkedRespuestaOK, ng: checkedRespuestaNG },
              ]}
              onToggle={handleToggleRespuesta}
            />
            <InputGroup style={{ paddingTop: '30px' }}>
              <Label>Color Foil:</Label>
              <Input
                type="text"
                placeholder="Ej: "
                value={colorFoil}
                onChange={(e) => setColorFoil(e.target.value)}
              />
            </InputGroup>
            <InputGroup style={{ paddingTop: '20px' }}>
              <Label>Revisar Posición Vs Ot:</Label>
              <RadioGroup>
                <RadioLabel>
                  <Radio
                    type="checkbox"
                    value="holograma"
                    checked={revisarPosicionChecks.includes('holograma')}
                    onChange={() => handleRevisarPosicionChange('holograma')}
                  />
                  Holograma
                </RadioLabel>
                <RadioLabel>
                  <Radio
                    type="checkbox"
                    value="foil"
                    checked={revisarPosicionChecks.includes('foil')}
                    onChange={() => handleRevisarPosicionChange('foil')}
                  />
                  Foil
                </RadioLabel>
              </RadioGroup>
            </InputGroup>
            <InputGroup style={{ paddingTop: '20px' }}>
              <Label>Imagen de Holograma Vs Ot:</Label>
              <RadioGroup>
                <RadioLabel>
                  <Radio
                    type="checkbox"
                    value="holograma"
                    checked={imagenHologramaChecks.includes('holograma')}
                    onChange={() => handleImagenHologramaChange('holograma')}
                  />
                  Holograma
                </RadioLabel>
                <RadioLabel>
                  <Radio
                    type="checkbox"
                    value="foil"
                    checked={imagenHologramaChecks.includes('foil')}
                    onChange={() => handleImagenHologramaChange('foil')}
                  />
                  Foil
                </RadioLabel>
              </RadioGroup>
            </InputGroup>
            <InputGroup style={{ paddingTop: '20px' }}>
              <Label style={{ paddingTop: '30px' }}>Muestras:</Label>
              <Input
                type="number"
                placeholder="Ej: 2"
                value={sampleQuantity}
                onChange={handleSampleQuantityChange}
              />
            </InputGroup>
            <ModalTitle style={{ marginTop: '1.5rem', marginBottom: '0.3rem' }}>
              Preguntas de Calidad
              <button
                onClick={toggleQualitySection}
                style={{
                  marginLeft: '10px',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '1.2rem',
                }}
              >
                {qualitySectionOpen ? '▼' : '▶'}
              </button>
            </ModalTitle>
            {qualitySectionOpen && (
              <>
                <SelectionQuestionTable
                  formQuestions={workOrder.area.formQuestions}
                  roleId={3} // Operación
                  columns={[]} // genera subcolumnas OK/NG
                  checkedQuestions={[
                    { ok: checkedRespuestaOK, ng: checkedRespuestaNG },
                  ]}
                  onToggle={handleToggleRespuesta}
                />
              </>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <CloseButton onClick={closeModal}>Cerrar</CloseButton>
              <SubmitButton onClick={handleSubmitToCQM}>
                Enviar Respuestas
              </SubmitButton>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
}

// =================== Styled Components ===================

const Container = styled.div`
  padding: 2rem;
  margin-top: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const NewData = styled.div``;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const Label = styled.label`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const NewDataWrapper = styled.div`
  display: flex;
  gap: 4rem;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  width: 50%;
`;

const Input = styled.input`
  width: 100%;
  color: black;
  padding: 0.75rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  outline: none;
  font-size: 1rem;
  transition: border 0.3s;

  &:focus {
    border-color: #0038a8;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 0.5rem;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #374151;
`;

const Radio = styled.input`
  accent-color: #0038a8;
`;

const Textarea = styled.textarea`
  width: 100%;
  color: black;
  height: 120px;
  padding: 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
  font-size: 1rem;
  resize: vertical;

  &:focus {
    border-color: #0038a8;
    outline: none;
  }
`;

const LiberarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 2rem;
  background-color: ${({ disabled }) => (disabled ? '#9CA3AF' : '#0038A8')};
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${({ disabled }) => (disabled ? '#9CA3AF' : '#1D4ED8')};
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

interface CqmButtonProps {
  $status: string;
  $cantidadporliberar: string;
  disabled?: boolean;
}

const CqmButton = styled.button<CqmButtonProps>`
  margin-top: 2rem;
  height: 48px;
  background-color: ${({ $status, disabled, $cantidadporliberar }) => {
    if ($status === 'Listo') return '#22c55e'; // verde
    if (
      ['Enviado a CQM', 'En Calidad'].includes($status) ||
      Number($cantidadporliberar) === 0 ||
      disabled
    )
      return '#9ca3af'; // gris
    return '#0038A8'; // azul
  }};
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  cursor: ${({ $status, $cantidadporliberar, disabled }) => {
    if (
      ['Enviado a CQM', 'En Calidad', 'Listo'].includes($status) ||
      Number($cantidadporliberar) === 0 ||
      disabled
    )
      return 'not-allowed';
    return 'pointer';
  }};

  &:hover {
    background-color: ${({ $status, $cantidadporliberar, disabled }) => {
      if ($status === 'Listo') return '#16a34a';
      if (
        ['Enviado a CQM', 'En Calidad'].includes($status) ||
        Number($cantidadporliberar) === 0 ||
        disabled
      )
        return '#9ca3af';
      return '#1d4ed8';
    }};
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  color: black;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  justify-content: center;
  max-width: 700px;
  max-height: 80%;
  overflow-y: auto;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1f2937;
  text-align: center;
`;

const CloseButton = styled.button`
  margin-top: 1.5rem;
  background-color: #bbbbbb;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: block;
  margin-left: auto;

  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #a0a0a0;
    outline: none;
  }
`;

const SubmitButton = styled.button`
  margin-top: 1.5rem;
  background-color: #0038a8;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: block;

  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover,
  &:focus {
    background-color: #1e40af;
    outline: none;
  }
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
`;

const ConfirmButton = styled.button`
  background-color: #0038a8;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;

  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover,
  &:focus {
    background-color: #1e40af;
    outline: none;
  }
`;

const CancelButton = styled.button`
  background-color: #bbbbbb;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;

  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover,
  &:focus {
    background-color: #a0a0a0;
    outline: none;
  }
`;
