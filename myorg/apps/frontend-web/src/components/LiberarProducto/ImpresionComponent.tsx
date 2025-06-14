'use client'

import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";
import { releaseProductFromImpress, submitToCQMImpression } from "@/api/liberarProducto";
import { useAuthContext } from '@/context/AuthContext';

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
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };
  const shouldDisableLiberar = () => {
    const currentInvalidStatuses = ['Enviado a CQM', 'En Calidad', 'Parcial', 'En proceso'];
    const nextInvalidStatuses = ['Enviado a CQM', 'Listo', 'En Calidad', 'Pendiente parcial'];
  
    const isCurrentInvalid = currentInvalidStatuses.includes(currentFlow.status?.trim());
    const isNextInvalid = nextInvalidStatuses.includes(nextFlow?.status?.trim());
    const isNextInvalidAndNotValidated = nextInvalidStatuses.includes(nextFlow?.status?.trim()) && !allParcialsValidated;
  
    return isDisabled || isCurrentInvalid || isNextInvalidAndNotValidated || isNextInvalid;
  };
  const shouldDisableCQM = () => {
    const estadosBloqueados = ['Enviado a CQM', 'En Calidad', 'Listo'];
    const isDisabled =
      estadosBloqueados.includes(currentFlow.status) ||
      estadosBloqueados.includes(lastCompletedOrPartial.status) ||
      estadosBloqueados.includes(nextFlow?.status) || // nextFlow puede ser opcional
      Number(cantidadporliberar) === 0;
  
    return isDisabled;
  };
  //Para guardar las respuestas 
  const [responses, setResponses] = useState<{ questionId: number, answer: boolean }[]>([]);
  const [sampleQuantity, setSampleQuantity] = useState<number>(0);
  // Para controlar qué preguntas están marcadas
  const [checkedQuestionsFrente, setCheckedQuestionsFrente] = useState<number[]>([]);
  const [checkedQuestionsVuelta, setCheckedQuestionsVuelta] = useState<number[]>([]);
  // Función para manejar el cambio en el campo de muestras
  const handleSampleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleCheckboxChangeFrente = (questionId: number, isChecked: boolean) => {
    handleCheckboxChange(questionId, isChecked, setCheckedQuestionsFrente);
  };
  const handleCheckboxChangeVuelta = (questionId: number, isChecked: boolean) => {
    handleCheckboxChange(questionId, isChecked, setCheckedQuestionsVuelta);
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

  const handleSelectAllFrente = (isChecked: boolean) => {
    const questionIds = workOrder.area.formQuestions.filter((q: any) => q.role_id === null).map((q: any) => q.id);
    if (isChecked) {
      setCheckedQuestionsFrente(questionIds);
      setResponses((prevResponses) => {
        const updatedResponses = prevResponses.filter(
          (response) => !questionIds.includes(response.questionId)
        );
        const newResponses = questionIds.map((id: number) => ({
          questionId: id,
          answer: true,
        }));
        return [...updatedResponses, ...newResponses];
      });
    } else {
      setCheckedQuestionsFrente([]);
      setResponses((prevResponses) =>
        prevResponses.filter((response) => !questionIds.includes(response.questionId))
      );
    }
  };
  const handleSelectAllVuelta = (isChecked: boolean) => {
    const questionIds = workOrder.area.formQuestions.filter((q: any) => q.role_id === null).map((q: any) => q.id);;
    if (isChecked) {
      setCheckedQuestionsVuelta(questionIds);
      setResponses((prevResponses) => {
        const updatedResponses = prevResponses.filter(
          (response) => !questionIds.includes(response.questionId)
        );
        const newResponses = questionIds.map((id: number) => ({
          questionId: id,
          answer: true,
        }));
        return [...updatedResponses, ...newResponses];
      });
    } else {
      setCheckedQuestionsVuelta([]);
      setResponses((prevResponses) =>
        prevResponses.filter((response) => !questionIds.includes(response.questionId))
      );
    }
  };

  console.log("El mismo workOrder (workOrder)", workOrder);
  const flowList = [...workOrder.workOrder.flow];

  const { user } = useAuthContext();
  const currentUserId = user?.id;

  const currentFlow = workOrder.workOrder.flow.find(
    (f: any) =>
      f.area_id === workOrder.area.id &&
      ['Pendiente', 'En proceso', 'Parcial', 'Pendiente parcial', 'Listo', 'Enviado a CQM', 'En Calidad'].includes(f.status) &&
      f.user?.id === currentUserId
  );
  if (!currentFlow) {
    alert("No tienes una orden activa para esta área.");
    return;
  }
  const currentIndex = flowList.findIndex((item) => item.id === currentFlow.id);
  console.log('el currentIndex', currentIndex);
  // Anterior (si hay)
  const lastCompletedOrPartial = currentIndex > 0 ? flowList[currentIndex - 1] : null;
  // Siguiente (si hay)
  const nextFlow = currentIndex !== -1 && currentIndex < flowList.length - 1
    ? flowList[currentIndex + 1]
    : null;
  console.log("El flujo actual (currentFlow)", currentFlow);
  console.log("El siguiente flujo (nextFlow)", nextFlow);
  console.log("Ultimo parcial o completado", lastCompletedOrPartial);

  const allParcialsValidated = currentFlow.partialReleases?.every(
    (r: PartialRelease) => r.validated
  );

  const tarjetasporliberar = sampleQuantity * 24;

  // Para mandar la OT a evaluacion por CQM
  const handleSubmit = async () => {
    const questions = workOrder.area.formQuestions.filter((q: any) => q.role_id === null);
    const flowId = currentFlow.id;
    if (checkedQuestionsFrente.length === 0) {
      alert('Por favor, selecciona al menos una respuesta antes de enviar.');
      return;
    }
    const payload = {
      question_id: questions.map((q: any) => q.id),
      work_order_flow_id: flowId,
      work_order_id: currentFlow.workOrder.id,
      area_id: currentFlow.area.id,
      frente: questions.map((q: any) => checkedQuestionsFrente.includes(q.id)),
      vuelta: questions.map((q: any) => checkedQuestionsVuelta.includes(q.id)),
      reviewed: false,
      user_id: currentFlow.assigned_user,
      sample_quantity: Number(sampleQuantity),
    };
    const isFrenteVueltaValid = payload.frente.includes(true) || payload.vuelta.includes(true);
    // Validamos que no haya campos vacíos
    const isPayloadEmpty = !payload.question_id.length || !isFrenteVueltaValid || Number(sampleQuantity) <= 0;
    if (isPayloadEmpty) {
      alert('Por favor, asegúrate de completar todas las preguntas, seleccionar al menos una respuesta en "Frente" o "Vuelta" y establecer la cantidad de muestra antes de enviar.');
      return; // Evitamos el envío si los datos no son válidos
    }
    try {
      await submitToCQMImpression(payload);
      router.push('/liberarProducto');
    } catch (error) {
      console.log('Error al guardar la respuesta: ', error);
    }
  }
  
  // Para Liberar el producto cuando ya ha pasado por CQM
  const [showConfirm, setShowConfirm] = useState(false); 
  const handleLiberarClick = () => {
    if (Number(sampleQuantity) <= 0) {
      alert('Por favor, ingresa una cantidad de muestra válida.');
      return;
    }
  
    if (lastCompletedOrPartial.partialReleases.length > 0) {
      const totalValidatedQuantity = lastCompletedOrPartial.partialReleases
        .filter((release: { validated: boolean, quantity: number }) => release.validated)
        .reduce((sum: number, release: { quantity: number }) => sum + release.quantity, 0);
    
      console.log('Total validado:', totalValidatedQuantity);
    }
  
    setShowConfirm(true); // Si pasa todas las validaciones, ahora sí abre el modal
  };
  const handleImpressSubmit = async () => {
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
    }
  };

  let cantidadporliberar = 0;
  const totalLiberado = currentFlow.partialReleases?.reduce(
    (sum: number, release: PartialRelease) => sum + release.quantity,
    0
  ) ?? 0;
  console.log('Total liberado:', totalLiberado);
  const validados = lastCompletedOrPartial.partialReleases
    ?.filter((r: PartialRelease) => r.validated)
    .reduce((sum: number, r: PartialRelease) => sum + r.quantity, 0) ?? 0;
  console.log('Cantidad validada:', validados);
 // ✅ 1. Preprensa tiene prioridad
  if (lastCompletedOrPartial.area?.name === 'preprensa') {
    cantidadporliberar = currentFlow.workOrder.quantity - totalLiberado;
  }
  // ✅ 2. Si hay validados en otras áreas
  else if (validados > 0) {
    let resta = validados - totalLiberado;
    if (resta < 0) {
      cantidadporliberar = 0;
    } else {
      cantidadporliberar = resta;
    }
  }
  // ✅ 3. Si hay liberaciones sin validar
  else if (totalLiberado > 0) {
    cantidadporliberar = currentFlow.workOrder.quantity - totalLiberado;
  }
  // ✅ 4. Si no hay nada, usar la cantidad entregada
  else {
    cantidadporliberar =
      lastCompletedOrPartial.areaResponse.prepress?.plates ??
      lastCompletedOrPartial.areaResponse.impression?.release_quantity ??
      lastCompletedOrPartial.areaResponse.serigrafia?.release_quantity ??
      lastCompletedOrPartial.areaResponse.empalme?.release_quantity ??
      lastCompletedOrPartial.areaResponse.laminacion?.release_quantity ??
      lastCompletedOrPartial.areaResponse.corte?.good_quantity ??
      lastCompletedOrPartial.areaResponse.colorEdge?.good_quantity ??
      lastCompletedOrPartial.areaResponse.hotStamping?.good_quantity ??
      lastCompletedOrPartial.areaResponse.millingChip?.good_quantity ??
      lastCompletedOrPartial.areaResponse.personalizacion?.good_quantity ??
      currentFlow.workOrder.quantity ??
      0;
  }

  const cantidadHojasRaw = Number(workOrder?.workOrder.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;

  return (
    <>
    <Container>
      <Title>Área: Impresion</Title>

      <DataWrapper style={{ gap: '2px'}}>
        <InfoItem>
          <Label>Número de Orden:</Label>
          <Value>{workOrder.workOrder.ot_id}</Value>
        </InfoItem>
        <InfoItem>
          <Label>ID del Presupuesto:</Label>
          <Value>{workOrder.workOrder.mycard_id}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Cantidad (TARJETAS):</Label>
          <Value>{workOrder.workOrder.quantity || "No definida"}</Value>
        </InfoItem>
        <InfoItem style={{ backgroundColor: '#eaeaf5', borderRadius: '8px'}}>
          <Label>Cantidad (HOJAS):</Label>
          <Value>{cantidadHojas}</Value>
        </InfoItem>
      </DataWrapper>
      <DataWrapper style={{ marginTop: '20px'}}>
        <InfoItem>
          <Label>Área que lo envía:</Label>
          <Value>{lastCompletedOrPartial.area.name}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Usuario del area previa:</Label>
          <Value>{lastCompletedOrPartial.user.username}</Value>
        </InfoItem>
        <InfoItem>
          <Label>{lastCompletedOrPartial.areaResponse ? ('Cantidad entregada:') : lastCompletedOrPartial.partialReleases?.some((r: PartialRelease) => r.validated) ? 'Cantidad entregada validada:' : 'Cantidad faltante por liberar:'}</Label>
          <Value>
            {lastCompletedOrPartial.areaResponse
              ? (
                // Mostrar cantidad según sub-área disponible
                lastCompletedOrPartial.areaResponse.prepress?.plates ??
                lastCompletedOrPartial.areaResponse.impression?.release_quantity ??
                lastCompletedOrPartial.areaResponse.serigrafia?.release_quantity ??
                lastCompletedOrPartial.areaResponse.empalme?.release_quantity ??
                lastCompletedOrPartial.areaResponse.laminacion?.release_quantity ??
                lastCompletedOrPartial.areaResponse.corte?.good_quantity ??
                lastCompletedOrPartial.areaResponse.colorEdge?.good_quantity ??
                lastCompletedOrPartial.areaResponse.hotStamping?.good_quantity ??
                lastCompletedOrPartial.areaResponse.millingChip?.good_quantity ??
                lastCompletedOrPartial.areaResponse.personalizacion?.good_quantity ??
                'Sin cantidad'
              )
              : lastCompletedOrPartial.partialReleases?.some((r: PartialRelease) => r.validated)
              ? (
                lastCompletedOrPartial.partialReleases
                  .filter((release: PartialRelease) => release.validated)
                  .reduce((sum: number, release: PartialRelease) => sum + release.quantity, 0)
              )
              : 
              (lastCompletedOrPartial.workOrder?.quantity ?? 0) - (lastCompletedOrPartial.partialReleases?.reduce((sum: number, release: PartialRelease) => sum + release.quantity, 0) ?? 0)
            }
          </Value>
        </InfoItem>
          {workOrder?.partialReleases?.length > 0 && (
          <InfoItem >
            <Label>Cantidad por Liberar:</Label>
            <Value>{cantidadporliberar}</Value>
          </InfoItem>
          )}
      </DataWrapper>
        <InfoItem style={{ marginTop: '20px'}}>
          <Label>Comentarios:</Label>
          <Value>{workOrder.workOrder.comments}</Value>
        </InfoItem>
      <NewData>
        <SectionTitle>Datos de Producción</SectionTitle>
        <NewDataWrapper>
          <InputGroup>
            <Label>Cantidad a Liberar (HOJAS):</Label>
            <Input type="number" min='0' placeholder="Ej: 2" value={sampleQuantity} onChange={handleSampleQuantityChange} />
          </InputGroup>
          <InputGroup>
            <Label>Cantidad a liberar (TARJETAS):</Label>
            <Input type="number" value={tarjetasporliberar} disabled readOnly />
          </InputGroup>
          <CqmButton status={currentFlow.status || lastCompletedOrPartial.status} cantidadporliberar={String(cantidadporliberar)} onClick={openModal} disabled={shouldDisableCQM()}>Enviar a CQM</CqmButton>
        </NewDataWrapper>
        <InputGroup>
          <SectionTitle>Comentarios</SectionTitle>
          <Textarea placeholder="Agrega un comentario adicional..." disabled={isDisabled}/>
        </InputGroup>
      </NewData>
      <LiberarButton disabled={shouldDisableLiberar()} onClick={handleLiberarClick}>Liberar Producto</LiberarButton>
    </Container>

    {/* Modal para enviar a liberacion */}
    {showConfirm && (
        <ModalOverlay>
          <ModalBox>
            <h4>¿Estás segura/o que deseas liberar este producto?</h4>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <CancelButton onClick={() => setShowConfirm(false)}>Cancelar</CancelButton>
              <ConfirmButton onClick={handleImpressSubmit}>Confirmar</ConfirmButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}

    {/* Modal para enviar a CQM */}
    {showModal && (
      <ModalOverlay>
        <ModalContent>
          <ModalTitle>Preguntas del Área: {workOrder.area.name}</ModalTitle>
          <Table>
          <thead>
            <tr>
              <th>Pregunta</th>
              <th>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Hoja Frente
                  <input
                    type="checkbox"
                    checked={workOrder.area.formQuestions
                      .filter((q: any) => q.role_id === null)
                      .every((q: any) => checkedQuestionsFrente.includes(q.id))}
                    onChange={(e) => handleSelectAllFrente(e.target.checked)}
                    style={{ marginLeft: '8px' }}
                  />
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Hoja Vuelta
                  <input
                    type="checkbox"
                    checked={workOrder.area.formQuestions
                      .filter((q: any) => q.role_id === null)
                      .every((q: any) => checkedQuestionsVuelta.includes(q.id)
                    )}
                    onChange={(e) => handleSelectAllVuelta(e.target.checked)}
                    style={{ marginLeft: '8px' }}
                  />
                </div>
              </th>
            </tr>
          </thead>
            <tbody>
              {workOrder.area.formQuestions
              .filter((question: { role_id: number | null }) => question.role_id === null)
              .map((question: { id: number; title: string }) => (
                <tr key={question.id}>
                  <td>{question.title}</td>
                  <td><input type="checkbox" checked={checkedQuestionsFrente.includes(question.id)} onChange={(e) => handleCheckboxChangeFrente(question.id, e.target.checked)}/></td>
                  <td><input type="checkbox" checked={checkedQuestionsVuelta.includes(question.id)} onChange={(e) => handleCheckboxChangeVuelta(question.id, e.target.checked)}/></td>
                </tr>
              ))}
            </tbody>
          </Table>
          <InputGroup style={{ paddingTop: '30px'}}>
            <Label>Muestras:</Label>
            <Input type="number" placeholder="Ej: 2" value={sampleQuantity} onChange={handleSampleQuantityChange}/>
          </InputGroup>
          <ModalTitle style={{ marginTop: '1.5rem', marginBottom: '0.3rem'}}>
            Preguntas de Calidad
            <button onClick={toggleQualitySection} style={{ marginLeft: '10px',cursor: "pointer", border: "none", background: "transparent", fontSize: "1.2rem" }}>{qualitySectionOpen ? '▼' : '▶'}</button>
          </ModalTitle>
          {qualitySectionOpen && (
          <>
          <Table>
            <thead>
              <tr>
                <th>Pregunta</th>
                <th>
                  <button onClick={toggleQuestions} style={{ marginLeft: "8px", cursor: "pointer", border: "none", background: "transparent" }}>{questionsOpen ? '▼' : '▶'}</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {questionsOpen && workOrder.area.formQuestions
              .filter((question: { role_id: number | null }) => question.role_id === 3)
              .map((question: { id: number; title: string }) => (
                <tr key={question.id}>
                  <td>{question.title}</td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </Table>
          <SectionTitle>Tipo de Prueba</SectionTitle>
          <RadioGroup>
            <RadioLabel>
              <Radio type="radio" name="prueba" value="color" disabled/>
              Prueba de color
            </RadioLabel>
            <RadioLabel>
              <Radio type="radio" name="prueba" value="perfil" disabled/>
              Muestra física
            </RadioLabel>
            <RadioLabel>
              <Radio type="radio" name="prueba" value="fisica" disabled/>
              Prueba digital
            </RadioLabel>
          </RadioGroup>
          </>
          )}
          <div style={{ display: 'flex', gap: '1rem'}}>
            <CloseButton onClick={closeModal}>Cerrar</CloseButton>
            <SubmitButton onClick={handleSubmit}>Enviar Respuestas</SubmitButton>
          </div>
        </ModalContent>
      </ModalOverlay>
    )}
  </>
  );
}

// =================== Styled Components ===================

const Container = styled.div`
  background: white;
  padding: 2rem;
  margin-top: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1f2937;
`;

const NewData = styled.div`
  
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: #374151;
`;

const DataWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const InfoItem = styled.div`
  flex: 1;
  padding: 5px;
  min-width: 150px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #6b7280;
  width: 50%;
`;

const Value = styled.div`
  margin-top: 0.25rem;
  font-weight: 500;
  color: #111827;
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
    border-color: #0038A8;
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
    border-color: #0038A8;
    outline: none;
  }
`;

const LiberarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 2rem;
  background-color: ${({ disabled }) => disabled ? '#9CA3AF' : '#0038A8'};
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.7 : 1};

  &:hover {
    background-color: ${({ disabled }) => disabled ? '#9CA3AF' : '#1D4ED8'};
  }

  &:disabled {
    background-color: #9CA3AF;
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
    if (['Enviado a CQM', 'En Calidad'].includes(status) || Number(cantidadporliberar) === 0 || disabled) return '#9ca3af'; // gris
    return '#0038A8'; // azul
  }};
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  cursor: ${({ status, cantidadporliberar, disabled }) => {
    if (['Enviado a CQM', 'En Calidad', 'Listo'].includes(status) || Number(cantidadporliberar) === 0 || disabled)
      return 'not-allowed';
    return 'pointer';
  }};

  &:hover {
    background-color: ${({ status, cantidadporliberar, disabled }) => {
      if (status === 'Listo') return '#16a34a'; // verde hover
      if (['Enviado a CQM', 'En Calidad'].includes(status) || Number(cantidadporliberar) === 0 || disabled) return '#9ca3af'; // gris hover igual
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
  background: rgba(0,0,0,0.4);
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
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1f2937;
  text-align: center;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background-color: #f3f4f6;
    color: #374151;
  }
`;

const CloseButton = styled.button`
  margin-top: 1.5rem;
  background-color: #BBBBBB;
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
    outline: none
  }
`;

const SubmitButton = styled.button`
  margin-top: 1.5rem;
  background-color: #0038A8;
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
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  max-width: 400px;
  width: 90%;
`;

const ConfirmButton = styled.button`
  background-color: #0038A8;
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
  background-color: #BBBBBB;
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
  accent-color: #0038A8;
`;