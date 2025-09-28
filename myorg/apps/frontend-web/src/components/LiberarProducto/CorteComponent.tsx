'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useRef } from 'react';
import styled from 'styled-components';

import {
  submitToCQMCorte,
  releaseProductFromCorte,
} from '@/api/liberarProducto';
import { updateWorkOrderAreas } from '@/api/seguimientoDeOts';

import { useAuthContext } from '@/context/AuthContext';

import { calcularCantidadPorLiberar } from './util/calcularCantidadPorLiberar';
import BadQuantityModal from './util/BadQuantityModal';
import SelectionQuestionTable from './util/FormQuestionTable';
import WorkOrderInfo from './util/WorkOrderInfo';
import { usePartialReleaseControls } from './util/disablePartialTime';
import { AreaData } from './PersonalizacionComponent';

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

export default function CorteComponent({ workOrder }: Props) {
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
  const commentsRef = useRef<HTMLTextAreaElement | null>(null);

  const [flowListState, setFlowListState] = useState<any[]>(() => [
    ...(workOrder?.workOrder?.flow ?? []),
  ]);
  const flowList: any[] = useMemo(() => flowListState, [flowListState]);

  const currentFlow = workOrder.workOrder.flow.find(
    (f: any) =>
      f.area_id === workOrder.area.id &&
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

  // ------- Efectos de seguridad -------
  const warned = useRef(false);
  const loggedOnce = useRef(false);

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
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

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

    if (Number.isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0) {
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
    };

    try {
      await submitToCQMCorte(payload);
      router.push('/liberarProducto');
    } catch (error) {
      console.log('Error al guardar la respuesta: ', error);
    }
  };

  const handleLiberarClick = () => {
    const numValue = Number(goodQuantity);
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0) {
      alert('Por favor, ingresa una cantidad de muestra válida.');
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

  const [qualitySectionOpen, setQualitySectionOpen] = useState(false);
  const toggleQualitySection = () => {
    setQualitySectionOpen(!qualitySectionOpen);
  };

  const handleCorteSubmit = async () => {
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
      await releaseProductFromCorte(payload);
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
  };

  const normalizedAreas: AreaData[] = useMemo(
    () =>
      previousFlows.map((item) => ({
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
        return [{
          areaId: flow.area_id,
          block,
          blockId: blockData.id,
          formId: blockData.form_auditory_id ?? null,
          cqmId: blockData.form_answer_id ?? null,
          data: {
            bad_quantity,
            ...(material_quantity !== undefined && { material_quantity }),
          },
        }];
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
            form_auditory_id: upd.formId ?? existingBlock.form_auditory_id ?? null,
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
    const mat = (currentFlow?.area?.id ?? 0) >= 6 ? Number(materialBadQuantity) || 0 : 0;
    return bad + mat;
  }, [lastAreaBadQuantity, materialBadQuantity, currentFlow?.area?.id]);

  return (
    <>
      <Container>
        <Title>Área: Corte</Title>

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
              status={currentFlow?.status || lastCompletedOrPartial?.status}
              cantidadporliberar={String(cantidadporliberar)}
              onClick={openModal}
              disabled={shouldDisableCQM()}
            >
              Enviar a Calidad/CQM
            </CqmButton>
          </NewDataWrapper>
          <InputGroup>
            <SectionTitle>Comentarios</SectionTitle>
            <Textarea
              ref={commentsRef}
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
          onConfirm={({ lastAreaBad, lastAreaMaterial }) => {
            setShowBadQuantity(false);
            handleSaveChanges();
            setMaterialBadQuantity(String(lastAreaMaterial));
            setLastBadQuantity(String(lastAreaBad));
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
              <ConfirmButton onClick={handleCorteSubmit}>
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
              <Label>Muestras:</Label>
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
  color: #1f2937;
`;

const NewData = styled.div``;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: #374151;
`;

const Label = styled.label`
  font-weight: 600;
  color: #6b7280;
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
  status: string;
  cantidadporliberar: string;
  disabled?: boolean;
}

const CqmButton = styled.button<CqmButtonProps>`
  margin-top: 2rem;
  height: 48px;
  background-color: ${({ status, disabled, cantidadporliberar }) => {
    if (status === 'Listo') return '#22c55e'; // verde
    if (
      ['Enviado a CQM', 'En Calidad'].includes(status) ||
      Number(cantidadporliberar) === 0 ||
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
  cursor: ${({ status, cantidadporliberar, disabled }) => {
    if (
      ['Enviado a CQM', 'En Calidad', 'Listo'].includes(status) ||
      Number(cantidadporliberar) === 0 ||
      disabled
    )
      return 'not-allowed';
    return 'pointer';
  }};

  &:hover {
    background-color: ${({ status, cantidadporliberar, disabled }) => {
      if (status === 'Listo') return '#16a34a'; // verde hover
      if (
        ['Enviado a CQM', 'En Calidad'].includes(status) ||
        Number(cantidadporliberar) === 0 ||
        disabled
      )
        return '#9ca3af'; // gris hover igual
      return '#1d4ed8'; // azul hover
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
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
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
