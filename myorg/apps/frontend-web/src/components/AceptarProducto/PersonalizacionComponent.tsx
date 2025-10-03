'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  acceptWorkOrderFlowAfterCorte,
  registrarInconformidadAuditory,
} from '@/api/aceptarProducto';
import WorkOrderInfo from './util/WorkOrderInfo';
import { computeAreaDefaults, areaKeyById } from './util/helper';

type PersonalizacionData = {
  good_quantity: number | string;
  bad_quantity: number | string;
  excess_quantity: number | string;
  sample_quantity: string;
  auditor: string;
  comments: string;
};
interface Props {
  workOrder: any;
}
type PartialRelease = {
  area: string;
  quantity: string;
  bad_quantity: string;
  excess_quantity: string;
  observation: string;
  validated: boolean;
};

export default function PersonalizacionComponentAccept({ workOrder }: Props) {
  console.log('WorkOrder recibida', workOrder);
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState<string>('');

  const [defaultValues, setDefaultValues] = useState<PersonalizacionData>({
    good_quantity: '',
    bad_quantity: '',
    excess_quantity: '',
    sample_quantity: '',
    auditor: '',
    comments: '',
  });

  console.log('El mismo workOrder (workOrder)', workOrder);
  const flowList = [...workOrder.workOrder.flow];
  // Índice del flow actual basado en su id
  const currentIndex = flowList.findIndex((item) => item.id === workOrder.id);
  console.log('el currentIndex', currentIndex);
  // Flow actual
  const currentFlow = currentIndex !== -1 ? flowList[currentIndex] : null;
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

  const isAcceptDisabled = () =>
    lastCompletedOrPartial.status === 'Enviado a CQM' ||
    lastCompletedOrPartial.status === 'En Inconformidad CQM' ||
    lastCompletedOrPartial.status === 'En inconformidad auditoria' ||
    lastCompletedOrPartial.status === 'Enviado a auditoria parcial' ||
    lastCompletedOrPartial.status === 'Enviado a Auditoria' ||
    lastCompletedOrPartial.status === 'En auditoria' ||
    lastCompletedOrPartial.status === 'En Calidad';

  useEffect(() => {
    const areaKey = areaKeyById[10]; 
    const vals = computeAreaDefaults<PersonalizacionData>(
      areaKey,
      lastCompletedOrPartial
    );
    console.log('Vals', vals);
    if (vals) setDefaultValues(vals);
  }, [workOrder, lastCompletedOrPartial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defaultValues.good_quantity) {
      alert(
        'Por favor, asegurate de que no haya inconformidades con las cantidades entregadas.'
      );
      return;
    }
    const flowId = workOrder?.id;
    try {
      await acceptWorkOrderFlowAfterCorte(flowId);
      router.push('/aceptarProducto');
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  };

  const handleSubmitInconformidad = async () => {
    const lastAnswer = lastCompletedOrPartial.id;
    console.log(lastAnswer);
    if (!lastAnswer) {
      alert(
        'No se encontró el formulario de auditoría para registrar la inconformidad.'
      );
      return;
    }
    console.log(inconformidad);
    if (!inconformidad.trim()) {
      alert('Por favor, describe la inconformidad antes de continuar.');
      return;
    }
    try {
      await registrarInconformidadAuditory(lastAnswer, inconformidad);
      router.push('/aceptarProducto');
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  };

  return (
    <Container>
      <Title>Área: {workOrder?.area.name || 'No definida'}</Title>

      <WorkOrderInfo
        workOrder={workOrder}
        lastCompletedOrPartial={lastCompletedOrPartial}
        defaultValues={defaultValues}
      />

      <NewData>
        <SectionTitle>Datos de Producción</SectionTitle>
        <NewDataWrapper>
          <InputGroup>
            <Label>Buenas:</Label>
            <Input
              type="number"
              name="release_quantity"
              value={defaultValues.good_quantity}
              disabled
            />
            <Label>Excedente:</Label>
            <Input
              type="number"
              name="release_quantity"
              value={defaultValues.excess_quantity}
              disabled
            />
          </InputGroup>
          <InconformidadButton
            onClick={() => setShowInconformidad(true)}
            disabled={isAcceptDisabled()}
          >
            Inconformidad
          </InconformidadButton>
        </NewDataWrapper>
        <InputGroup>
          <SectionTitle>Comentarios</SectionTitle>
          <Textarea value={defaultValues.comments} disabled />
        </InputGroup>
      </NewData>
      <AceptarButton
        onClick={() => setShowConfirm(true)}
        disabled={isAcceptDisabled()}
      >
        Aceptar recepción del producto
      </AceptarButton>
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
              <ConfirmButton onClick={handleSubmit}>Confirmar</ConfirmButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
      {showInconformidad && (
        <ModalOverlay>
          <ModalBox>
            <h4>Registrar Inconformidad</h4>
            <h3>
              Por favor, describe la inconformidad detectada con la cantidad
              entregada.
            </h3>
            <Textarea
              value={inconformidad}
              onChange={(e) => setInconformidad(e.target.value)}
              placeholder="Escribe aquí la inconformidad..."
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              <CancelButton onClick={() => setShowInconformidad(false)}>
                Cancelar
              </CancelButton>
              <ConfirmButton
                onClick={() => {
                  console.log('Hpli');
                  if (!inconformidad.trim()) {
                    alert(
                      'Debes ingresar una inconformidad antes de continuar.'
                    );
                    return;
                  }
                  handleSubmitInconformidad();
                  setShowInconformidad(false);
                }}
              >
                Guardar
              </ConfirmButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </Container>
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
  gap: 8rem;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  width: 50%;
  padding-top: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  color: black;
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
  height: 120px;
  padding: 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  color: black;
  margin-top: 0.5rem;
  font-size: 1rem;
  resize: vertical;

  &:focus {
    border-color: #0038a8;
    outline: none;
  }
`;

const AceptarButton = styled.button<{ disabled?: boolean }>`
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
`;

const InconformidadButton = styled.button<{ disabled?: boolean }>`
  height: 50px;
  background-color: ${({ disabled }) => (disabled ? '#D1D5DB' : '#A9A9A9')};
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  align-self: flex-end;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${({ disabled }) => (disabled ? '#D1D5DB' : '#8d8d92')};
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  color: black;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
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
