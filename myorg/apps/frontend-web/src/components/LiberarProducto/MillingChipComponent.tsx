'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styled from 'styled-components';
import {
  submitToCQMMillingChip,
  releaseProductFromMillingChip,
} from '@/api/liberarProducto';
import { useAuthContext } from '@/context/AuthContext';
import { calcularCantidadPorLiberar } from './util/calcularCantidadPorLiberar';

interface Props {
  workOrder: any;
}
interface PartialRelease {
  validated: boolean;
  quantity: number;
}

export default function MillingChipComponent({ workOrder }: Props) {
  const router = useRouter();
  const isDisabled = workOrder.status === 'En proceso';
  const [showModal, setShowModal] = useState(false);
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };
  const shouldDisableLiberar = () => {
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
      'Enviado a auditoria parcial',
      'En inconformidad CQM',
    ];
    const nextCorteStatuses = ['Enviado a auditoria parcial'];

    const isCurrentInvalid = currentInvalidStatuses.includes(
      currentFlow.status?.trim()
    );
    const isNextInvalid = nextInvalidStatuses.includes(
      nextFlow?.status?.trim()
    );
    const afterCorte =
      nextCorteStatuses.includes(currentFlow?.status?.trim()) &&
      nextFlow?.area?.id >= 6;
    const isNextInvalidAndNotValidated =
      nextInvalidStatuses.includes(nextFlow?.status?.trim()) &&
      !allParcialsValidated;

    return (
      isDisabled ||
      isCurrentInvalid ||
      afterCorte ||
      isNextInvalidAndNotValidated ||
      isNextInvalid
    );
  };
  const shouldDisableCQM = () => {
    const estadosBloqueados = [
      'Enviado a CQM',
      'En Calidad',
      'Listo',
      'Enviado a auditoria parcial',
      'Enviado a Auditoria',
    ];
    const statusesToCheck = [
      currentFlow.status,
      nextFlow?.status,
      lastCompletedOrPartial.status,
    ];
    const tieneStatusBloqueado = statusesToCheck.some((status) =>
      estadosBloqueados.includes(status)
    );
    return tieneStatusBloqueado || Number(cantidadporliberar) === 0;
  };
  //Para guardar las respuestas
  const [responses, setResponses] = useState<
    { questionId: number; answer: boolean }[]
  >([]);
  const [sampleQuantity, setSampleQuantity] = useState<number | string>('');
  const [revisarTecnologia, setRevisarTecnologia] = useState('');
  const [validarKVC, setValidarKVC] = useState('');
  const [goodQuantity, setGoodQuantity] = useState<number | string>('');
  const [badQuantity, setBadQuantity] = useState<number | string>('');
  const [excessQuantity, setExcessQuantity] = useState<number | string>('');
  // Para controlar qué preguntas están marcadas
  const [checkedQuestions, setCheckedQuestions] = useState<number[]>([]);
  // Función para manejar el cambio en el campo de muestras y color edge
  const handleSampleQuantityChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSampleQuantity(e.target.value);
  };
  const handleCheckboxChange = (questionId: number, isChecked: boolean) => {
    setResponses((prevResponses) => {
      const updateResponses = prevResponses.filter(
        (response) => response.questionId !== questionId
      );
      if (isChecked) {
        updateResponses.push({ questionId, answer: isChecked });
      }
      return updateResponses;
    });

    // Actualizar visualmente el checkbox
    setCheckedQuestions((prev) =>
      isChecked ? [...prev, questionId] : prev.filter((id) => id !== questionId)
    );
  };

  console.log('El mismo workOrder (workOrder)', workOrder);
  const flowList = [...workOrder.workOrder.flow];

  const { user } = useAuthContext();
  const currentUserId = user?.id;

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

  if (!currentFlow) {
    alert('No tienes una orden activa para esta área.');
    return;
  }
  const currentIndex = flowList.findIndex(
    (item) => item.id === currentFlow?.id
  );
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

  const allParcialsValidated = currentFlow.partialReleases?.every(
    (r: PartialRelease) => r.validated
  );

  // Para mandar la OT a evaluacion por CQM
  const handleSubmit = async () => {
    const flowId = currentFlow.id;
    const numValue = Number(sampleQuantity);
    if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0) {
      alert('Por favor, ingresa una cantidad de muestra válida.');
      return;
    }
    if (responses.length === 0) {
      alert('Por favor, selecciona al menos una respuesta antes de enviar.');
      return;
    }
    const payload = {
      question_id: responses.map((response) => response.questionId),
      work_order_flow_id: flowId,
      work_order_id: currentFlow.workOrder.id,
      area_id: currentFlow.area.id,
      response: responses.map((response) => response.answer),
      reviewed: false,
      user_id: currentFlow.assigned_user,
      sample_quantity: Number(sampleQuantity),
      revisar_tecnologia: revisarTecnologia,
      validar_kvc: validarKVC,
    };
    try {
      await submitToCQMMillingChip(payload);
      router.push('/liberarProducto');
    } catch (error) {
      console.log('Error al guardar la respuesta: ', error);
    }
  };

  // Para Liberar el producto cuando ya ha pasado por CQM
  const [showConfirm, setShowConfirm] = useState(false);
  const handleLiberarClick = () => {
    const numValue = Number(goodQuantity);
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
  const handleMillingChipSubmit = async () => {
    const payload = {
      workOrderId: workOrder.workOrder.id,
      workOrderFlowId: currentFlow.id,
      areaId: workOrder.area.id,
      assignedUser: currentFlow.assigned_user,
      releaseQuantity: Number(sampleQuantity),
      goodQuantity: Number(goodQuantity),
      badQuantity: Number(badQuantity),
      excessQuantity: Number(excessQuantity),
      comments: document.querySelector('textarea')?.value || '',
      formAnswerId: currentFlow.answers[0].id,
    };

    console.log('datos a enviar', payload);

    try {
      await releaseProductFromMillingChip(payload);
      router.push('/liberarProducto');
    } catch (error) {
      console.log('Error al enviar datos:', error);
    }
  };

  const cantidadporliberar = calcularCantidadPorLiberar(
    currentFlow,
    lastCompletedOrPartial
  );
  console.log('Cantidad final por liberar:', cantidadporliberar);

  return (
    <>
      <Container>
        <Title>Área: Milling Chip</Title>

        <DataWrapper>
          <InfoItem>
            <Label>Número de Orden:</Label>
            <Value>{workOrder.workOrder.ot_id}</Value>
          </InfoItem>
          <InfoItem>
            <Label>ID del Presupuesto:</Label>
            <Value>{workOrder.workOrder.mycard_id}</Value>
          </InfoItem>
          <InfoItem style={{ backgroundColor: '#eaeaf5', borderRadius: '8px' }}>
            <Label>Cantidad:</Label>
            <Value>{workOrder.workOrder.quantity}</Value>
          </InfoItem>
        </DataWrapper>
        <DataWrapper style={{ marginTop: '20px' }}>
          <InfoItem>
            <Label>Usuario del area previa:</Label>
            <Value>{lastCompletedOrPartial.user.username}</Value>
          </InfoItem>
          <InfoItem>
            <Label>
              {(lastCompletedOrPartial.areaResponse &&
                lastCompletedOrPartial.partialReleases.length === 0) ||
              lastCompletedOrPartial.areaResponse
                ? 'Cantidad entregada:'
                : lastCompletedOrPartial.partialReleases?.some(
                    (r: PartialRelease) => r.validated
                  )
                ? 'Cantidad entregada validada:'
                : 'Cantidad faltante por liberar:'}
            </Label>
            <Value>
              {(lastCompletedOrPartial.areaResponse &&
                lastCompletedOrPartial.partialReleases.length === 0) ||
              lastCompletedOrPartial.areaResponse
                ? // Mostrar cantidad según sub-área disponible
                  lastCompletedOrPartial.areaResponse.prepress?.plates ??
                  lastCompletedOrPartial.areaResponse.impression
                    ?.release_quantity ??
                  lastCompletedOrPartial.areaResponse.serigrafia
                    ?.release_quantity ??
                  lastCompletedOrPartial.areaResponse.empalme
                    ?.release_quantity ??
                  lastCompletedOrPartial.areaResponse.laminacion
                    ?.release_quantity ??
                  lastCompletedOrPartial.areaResponse.corte?.good_quantity ??
                  lastCompletedOrPartial.areaResponse.colorEdge
                    ?.good_quantity ??
                  lastCompletedOrPartial.areaResponse.hotStamping
                    ?.good_quantity ??
                  lastCompletedOrPartial.areaResponse.millingChip
                    ?.good_quantity ??
                  lastCompletedOrPartial.areaResponse.personalizacion
                    ?.good_quantity ??
                  'Sin cantidad'
                : lastCompletedOrPartial.partialReleases?.some(
                    (r: PartialRelease) => r.validated
                  )
                ? lastCompletedOrPartial.partialReleases
                    .filter((release: PartialRelease) => release.validated)
                    .reduce(
                      (sum: number, release: PartialRelease) =>
                        sum + release.quantity,
                      0
                    )
                : (lastCompletedOrPartial.workOrder?.quantity ?? 0) -
                  (lastCompletedOrPartial.partialReleases?.reduce(
                    (sum: number, release: PartialRelease) =>
                      sum + release.quantity,
                    0
                  ) ?? 0)}
            </Value>
          </InfoItem>
          {workOrder?.partialReleases?.length > 0 && (
            <InfoItem>
              <Label>Cantidad por Liberar:</Label>
              <Value>{cantidadporliberar}</Value>
            </InfoItem>
          )}
        </DataWrapper>
        <InfoItem style={{ marginTop: '20px' }}>
          <Label>Comentarios:</Label>
          <Value>{workOrder.workOrder.comments}</Value>
        </InfoItem>
        <NewData>
          <SectionTitle>Datos de Producción</SectionTitle>
          <NewDataWrapper>
            <InputGroup>
              <Label>Buenas:</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 2"
                value={goodQuantity}
                onChange={(e) => setGoodQuantity(e.target.value)}
                disabled={isDisabled}
              />
              <Label>Malas:</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 2"
                value={badQuantity}
                onChange={(e) => setBadQuantity(e.target.value)}
                disabled={isDisabled}
              />
              <Label>Excedente:</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 2"
                value={excessQuantity}
                onChange={(e) => setExcessQuantity(e.target.value)}
                disabled={isDisabled}
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
              <ConfirmButton onClick={handleMillingChipSubmit}>
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
            <Table>
              <thead>
                <tr>
                  <th>Pregunta</th>
                  <th>Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.area.formQuestions
                  .filter(
                    (question: { role_id: number | null }) =>
                      question.role_id === null
                  )
                  .map((question: { id: number; title: string }) => (
                    <tr key={question.id}>
                      <td>{question.title}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={checkedQuestions.includes(question.id)}
                          onChange={(e) =>
                            handleCheckboxChange(question.id, e.target.checked)
                          }
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
            <InputGroup style={{ paddingTop: '30px', width: '70%' }}>
              <Label>Revisar Tecnología De Chip y Color Vs Ot:</Label>
              <Input
                type="text"
                placeholder="Ej: "
                value={revisarTecnologia}
                onChange={(e) => setRevisarTecnologia(e.target.value)}
              />
            </InputGroup>
            <InputGroup style={{ paddingTop: '20px', width: '70%' }}>
              <Label>
                Validar y Anotar KCV (Intercambio De Llaves), Carga De
                Aplicación o Prehabilitación (Si Aplica):
              </Label>
              <Input
                type="text"
                placeholder="Ej: "
                value={validarKVC}
                onChange={(e) => setValidarKVC(e.target.value)}
              />
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
            <div style={{ display: 'flex', gap: '1rem' }}>
              <CloseButton onClick={closeModal}>Cerrar</CloseButton>
              <SubmitButton onClick={handleSubmit}>
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
  background: white;
  padding: 2rem;
  margin-top: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

const NewData = styled.div``;

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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
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
