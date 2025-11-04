'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styled from 'styled-components';
import {
  releaseProductFromImpress,
  submitToCQMImpression,
} from '@/api/liberarProducto';
import { useAuthContext } from '@/context/AuthContext';
import { calcularCantidadPorLiberar } from './util/calcularCantidadPorLiberar';
import SelectionQuestionTable from './util/FormQuestionTable';
import { WorkOrderHojasInfo } from './util/WorkOrderInfo';
import { usePartialReleaseControls } from './util/disablePartialTime';

interface Props {
  workOrder: any;
}
interface PartialRelease {
  validated: boolean;
  quantity: number;
}

export default function ImpresionComponent({ workOrder }: Props) {
  const router = useRouter();
  // Para bloquear liberacion hasta que sea aprobado por CQM
  const isDisabled = workOrder.status === 'En proceso';
  // Para mostrar formulario de CQM y enviarlo
  const [showModal, setShowModal] = useState(false);
  const [checkedFrenteOK, setCheckedFrenteOK] = useState<number[]>([]);
  const [checkedFrenteNG, setCheckedFrenteNG] = useState<number[]>([]);

  // ✅ Vuelta
  const [checkedVueltaOK, setCheckedVueltaOK] = useState<number[]>([]);
  const [checkedVueltaNG, setCheckedVueltaNG] = useState<number[]>([]);
  const openModal = () => {
    setShowModal(true);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeModal = () => {
    setShowModal(false);
  };
  console.log('El mismo workOrder (workOrder)', workOrder);
  const { user } = useAuthContext();
  const currentUserId = user?.id;

  const flowList = [...workOrder.workOrder.flow];
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
      ].includes(f.status) &&
      f.user?.id === currentUserId
  );
  if (!currentFlow) {
    alert('No tienes una orden activa para esta área.');
    return;
  }
  const allParcialsValidated = currentFlow.partialReleases?.every(
    (r: PartialRelease) => r.validated
  );
  const currentIndex = flowList.findIndex((item) => item.id === currentFlow.id);
  console.log('el currentIndex', currentIndex);
  // Anterior (si hay)
  const lastCompletedOrPartial =
    currentIndex > 0 ? flowList[currentIndex - 1] : null;
  // Siguiente (si hay)
  const nextFlow =
    currentIndex !== -1 && currentIndex < flowList.length - 1
      ? flowList[currentIndex + 1]
      : null;
  console.log('El flujo actual (currentFlow)', currentFlow);
  console.log('El siguiente flujo (nextFlow)', nextFlow);
  console.log('Ultimo parcial o completado', lastCompletedOrPartial);
  const cantidadporliberar = calcularCantidadPorLiberar(
    currentFlow,
    lastCompletedOrPartial
  );
  console.log('Cantidad final por liberar:', cantidadporliberar);
  const statusesToCheck = [
    currentFlow?.status,
    nextFlow?.status,
    lastCompletedOrPartial?.status,
  ];

  const { disableCQM, disablePartial, cooldown } = usePartialReleaseControls({
    flow: currentFlow,
    cantidadPorLiberar: cantidadporliberar,
    withCountdown: true,

    // 🔎 acá decides contra qué comparar:
    statusesToCheck, // revisa current + next + last
    blockedForCQM: [
      'Enviado a CQM',
      'En Calidad',
      'Listo',
      'Pendiente parcial',
    ],
    blockedForCQM_AfterCorte: [
      'Enviado a CQM',
      'En Calidad',
      'Listo',
      'Pendiente',
      'Pendiente parcial',
      'Enviado a auditoria parcial',
      'En inconformidad CQM',
      'Enviado a Auditoria',
    ],
  });

  const shouldDisableCQM = () => disableCQM;
  const shouldDisableLiberar = () => {
    // 1) Detectar si CQM está bloqueado SOLO por cooldown (<24h y sin otras razones)
    const estadosBloqueadosCQM = ['Enviado a CQM', 'En Calidad', 'Listo'];
    const estadosBloqueadosNext = ['Pendiente parcial'];

    const byStatusCQM = estadosBloqueadosCQM.includes(
      currentFlow.status?.trim?.() ?? ''
    );
    const byNextCQM = estadosBloqueadosNext.includes(
      nextFlow?.status?.trim?.() ?? ''
    );
    const byCantidad = Number(cantidadporliberar) === 0;

    // cooldown aplica solo si NO hay areaResponse
    const byCooldown = !currentFlow.areaResponse && !!cooldown?.isLocked;

    const cqmBloqueadoSoloPorTiempo =
      byCooldown && !byStatusCQM && !byNextCQM && !byCantidad;

    // 👉 Regla pedida: si CQM está bloqueado SOLO por tiempo, habilitamos "Liberación parcial"
    if (cqmBloqueadoSoloPorTiempo) {
      return false; // NO deshabilitar el botón de liberar parcial
    }

    // 2) Si no es el caso anterior, aplicamos tus reglas + base del hook para parciales
    const currentInvalidStatuses = [
      'Enviado a CQM',
      'En Calidad',
      'Parcial',
      'En proceso',
    ];
    const nextInvalidStatuses = [
      'Enviado a CQM',
      'Listo',
      'En Calidad',
      'Pendiente parcial',
      'Enviado a auditoria parcial',
      'En inconformidad CQM',
    ];

    const isCurrentInvalid = currentInvalidStatuses.includes(
      currentFlow.status?.trim?.() ?? ''
    );
    const isNextInvalid = nextInvalidStatuses.includes(
      nextFlow?.status?.trim?.() ?? ''
    );
    const isNextInvalidAndNotValidated =
      nextInvalidStatuses.includes(nextFlow?.status?.trim?.() ?? '') &&
      !allParcialsValidated;

    // disablePartial (del hook) bloquea por cantidad=0 o estados finales
    return (
      disablePartial ||
      isDisabled ||
      isCurrentInvalid ||
      isNextInvalidAndNotValidated ||
      isNextInvalid
    );
  };

  //Para guardar las respuestas
  const [responses, setResponses] = useState<
    { questionId: number; answer: boolean }[]
  >([]);
  const [sampleQuantity, setSampleQuantity] = useState<number>(0);
  // Para controlar qué preguntas están marcadas
  const [checkedQuestionsFrente, setCheckedQuestionsFrente] = useState<
    number[]
  >([]);
  const [checkedQuestionsVuelta, setCheckedQuestionsVuelta] = useState<
    number[]
  >([]);
  // Función para manejar el cambio en el campo de muestras
  const handleSampleQuantityChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value);
    setSampleQuantity(isNaN(value) ? 0 : value);
  };
  const handleCheckboxChange = (
    questionId: number,
    isChecked: boolean,
    setCheckedQuestions: React.Dispatch<React.SetStateAction<number[]>>
  ) => {
    setResponses((prevResponses) => {
      const updateResponses = prevResponses.filter(
        (response) => response.questionId !== questionId
      );
      if (isChecked) {
        updateResponses.push({ questionId, answer: isChecked });
      }
      return updateResponses;
    });
    setCheckedQuestions((prev) =>
      isChecked ? [...prev, questionId] : prev.filter((id) => id !== questionId)
    );
  };

  const handleCheckboxChangeFrente = (
    questionId: number,
    isChecked: boolean
  ) => {
    handleCheckboxChange(questionId, isChecked, setCheckedQuestionsFrente);
  };
  const handleCheckboxChangeVuelta = (
    questionId: number,
    isChecked: boolean
  ) => {
    handleCheckboxChange(questionId, isChecked, setCheckedQuestionsVuelta);
  };
  const handleToggleFrenteVuelta = (
    questionId: number,
    columnIndex: number, // 0 = Frente, 1 = Vuelta
    type: 'ok' | 'ng',
    checked: boolean
  ) => {
    if (columnIndex === 0) {
      // FRENTE
      if (type === 'ok') {
        setCheckedFrenteOK((prev) =>
          checked
            ? Array.from(new Set([...prev, questionId]))
            : prev.filter((id) => id !== questionId)
        );
        // Quita la contraria en el mismo tick
        setCheckedFrenteNG((prev) => prev.filter((id) => id !== questionId));
      } else {
        setCheckedFrenteNG((prev) =>
          checked
            ? Array.from(new Set([...prev, questionId]))
            : prev.filter((id) => id !== questionId)
        );
        setCheckedFrenteOK((prev) => prev.filter((id) => id !== questionId));
      }
    } else {
      // VUELTA
      if (type === 'ok') {
        setCheckedVueltaOK((prev) =>
          checked
            ? Array.from(new Set([...prev, questionId]))
            : prev.filter((id) => id !== questionId)
        );
        setCheckedVueltaNG((prev) => prev.filter((id) => id !== questionId));
      } else {
        setCheckedVueltaNG((prev) =>
          checked
            ? Array.from(new Set([...prev, questionId]))
            : prev.filter((id) => id !== questionId)
        );
        setCheckedVueltaOK((prev) => prev.filter((id) => id !== questionId));
      }
    }
  };

  // Para ver las preguntas de calidad
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const toggleQuestions = () => {
    setQuestionsOpen(!questionsOpen);
  };
  const [qualitySectionOpen, setQualitySectionOpen] = useState(false);
  const toggleQualitySection = () => {
    setQualitySectionOpen(!qualitySectionOpen);
  };

  const tarjetasporliberar = sampleQuantity * 24;

  // Para mandar la OT a evaluacion por CQM
  const handleSubmit = async () => {
    // 0) Validar muestras
    const numValue = Number(sampleQuantity);
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0) {
      alert('Por favor, ingresa una cantidad de muestra válida.');
      return;
    }

    // 1) Preguntas VISIBLES
    const visibleQuestions = (workOrder.area.formQuestions ?? [])
      // .slice(ini, fin) // <-- si tu tabla usa slice, aplícalo aquí
      .filter((q: any) => q.role_id === null);

    // 2) Helper: estado por columna (0=Frente, 1=Vuelta)
    const getAnswerFor = (
      qid: number,
      colIndex: number
    ): boolean | undefined => {
      if (colIndex === 0) {
        if (checkedFrenteOK.includes(qid)) return true;
        if (checkedFrenteNG.includes(qid)) return false;
        return undefined;
      } else {
        if (checkedVueltaOK.includes(qid)) return true;
        if (checkedVueltaNG.includes(qid)) return false;
        return undefined;
      }
    };

    // 3) Construcción estricta + validación de "todas respondidas"
    const question_id: number[] = [];
    const frente: boolean[] = [];
    const vuelta: boolean[] = [];

    for (const q of visibleQuestions) {
      const a0 = getAnswerFor(q.id, 0);
      const a1 = getAnswerFor(q.id, 1);
      if (a0 === undefined || a1 === undefined) {
        alert('Completa todas las preguntas y cantidad de muestra.');
        return;
      }
      question_id.push(q.id);
      frente.push(a0);
      vuelta.push(a1);
    }

    // 4) Payload sólo con visibles
    const payload = {
      question_id,
      work_order_flow_id: currentFlow.id,
      work_order_id: currentFlow.workOrder.id,
      area_id: currentFlow.area.id,
      frente,
      vuelta,
      reviewed: false,
      user_id: currentFlow.assigned_user,
      sample_quantity: Number(sampleQuantity),
    };
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitToCQMImpression(payload);
      router.push('/liberarProducto');
    } catch (error) {
      console.log('Error al guardar la respuesta: ', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Para Liberar el producto cuando ya ha pasado por CQM
  const [showConfirm, setShowConfirm] = useState(false);
  const handleLiberarClick = () => {
    const numValue = Number(sampleQuantity);
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0) {
      alert('Por favor, ingresa una cantidad de muestra válida.');
      return;
    }

    if (lastCompletedOrPartial.partialReleases.length > 0) {
      const totalValidatedQuantity = lastCompletedOrPartial.partialReleases
        .filter(
          (release: { validated: boolean; quantity: number }) =>
            release.validated
        )
        .reduce(
          (sum: number, release: { quantity: number }) =>
            sum + release.quantity,
          0
        );

      console.log('Total validado:', totalValidatedQuantity);
    }

    setShowConfirm(true); // Si pasa todas las validaciones, ahora sí abre el modal
  };
  const handleImpressSubmit = async () => {
    if (isSubmitting) return; // evita doble clic
    setIsSubmitting(true);
    const payload = {
      workOrderId: workOrder.workOrder.id,
      workOrderFlowId: currentFlow.id,
      areaId: workOrder.area.id,
      assignedUser: currentFlow.assigned_user,
      releaseQuantity: Number(tarjetasporliberar),
      comments: document.querySelector('textarea')?.value || '',
      formAnswerId: currentFlow.answers[0].id,
    };
    try {
      await releaseProductFromImpress(payload);
      router.push('/liberarProducto');
    } catch (error) {
      console.log('Error al enviar datos:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Container>
        <Title>Área: Impresion</Title>
        <WorkOrderHojasInfo
          workOrder={workOrder}
          lastCompletedOrPartial={lastCompletedOrPartial}
          cantidadporliberar={cantidadporliberar}
        />

        <NewData>
          <SectionTitle>Datos de Producción</SectionTitle>
          <NewDataWrapper>
            <InputGroup>
              <Label>Cantidad a Liberar (Hojas Frente / Hojas Vuelta):</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 2"
                value={sampleQuantity}
                onChange={handleSampleQuantityChange}
              />
            </InputGroup>
            <InputGroup>
              <Label>Cantidad a liberar (TARJETAS):</Label>
              <Input
                type="number"
                value={tarjetasporliberar}
                disabled
                readOnly
              />
            </InputGroup>
            <CqmButton
              status={currentFlow.status || lastCompletedOrPartial.status}
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
              placeholder="Agrega un comentario adicional..."
              disabled={isDisabled}
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
              <ConfirmButton onClick={handleImpressSubmit}>
                {isSubmitting ? 'Liberando...' : 'Confirmar'}
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
              roleId={null} // Calidad
              columns={['Hoja Frente', 'Hoja Vuelta']}
              checkedQuestions={[
                { ok: checkedFrenteOK, ng: checkedFrenteNG },
                { ok: checkedVueltaOK, ng: checkedVueltaNG },
              ]}
              onToggle={handleToggleFrenteVuelta}
            />
            <InputGroup style={{ paddingTop: '30px' }}>
              <Label style={{ color: '#374151' }}>Muestras:</Label>
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
                  roleId={3} // Calidad
                  columns={[]}
                  checkedQuestions={[
                    { ok: checkedFrenteOK, ng: checkedFrenteNG },
                    { ok: checkedVueltaOK, ng: checkedVueltaNG },
                  ]}
                  onToggle={() => {}} // no hace nada
                  readOnly // <- nuevo prop para deshabilitar
                />
                <SectionTitle style={{ color: '#374151' }}>
                  Tonos y/o Densidades Contra
                </SectionTitle>
                <RadioGroup>
                  <RadioLabel>
                    <Radio type="radio" name="prueba" value="color" disabled />
                    Prueba de color
                  </RadioLabel>
                  <RadioLabel>
                    <Radio type="radio" name="prueba" value="perfil" disabled />
                    Muestra física
                  </RadioLabel>
                  <RadioLabel>
                    <Radio type="radio" name="prueba" value="fisica" disabled />
                    Prueba digital
                  </RadioLabel>
                </RadioGroup>
              </>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <CloseButton onClick={closeModal}>Cerrar</CloseButton>
              <SubmitButton onClick={handleSubmit}>
                {isSubmitting ? 'Enviando...' : 'Enviar Respuestas'}
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
  width: 50%;
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
