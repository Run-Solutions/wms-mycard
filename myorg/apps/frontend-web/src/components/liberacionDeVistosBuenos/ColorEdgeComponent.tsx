'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styled from 'styled-components';
import { submitExtraColor, sendInconformidadCQM } from '@/api/recepcionCQM';
import { OperatorAdvancedTable } from './util/QuestionTable';
import WorkOrderInfo from './util/WorkOrderInfo';

interface Props {
  workOrder: any;
}
type Answer = {
  reviewed: boolean;
  sample_quantity: number;
  id?: number;
  FormAnswerResponse?: any[];
  color_edge?: string;
};

export default function ColorEdgeComponent({ workOrder }: Props) {
  const router = useRouter();
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Último FormAnswer NO revisado
  const index = workOrder?.answers
    ?.map((a: Answer, i: number) => ({ ...a, index: i }))
    .reverse()
    .find((a: Answer) => a.reviewed === false)?.index;

  // Derivados seguros
  const currentAnswer: Answer | undefined =
    typeof index === 'number' ? workOrder?.answers?.[index] : undefined;
  const formQuestions = workOrder?.area?.formQuestions ?? [];

  const handleSubmit = async () => {
    const formAnswerId = currentAnswer?.id; // id de FormAnswer
    if (!formAnswerId) {
      alert('No se encontró el ID del formulario.');
      return;
    }
    const payload = { form_answer_id: formAnswerId };
    try {
      await submitExtraColor(payload);
      router.push('/liberacionDeVistosBuenos');
    } catch (error) {
      console.log('Error al guardar la respuesta: ', error);
    }
  };

  const handleSubmitInconformidad = async () => {
    if (!inconformidad.trim()) {
      alert('Debes ingresar una inconformidad antes de continuar.');
      return;
    }
    try {
      await sendInconformidadCQM(workOrder?.id, inconformidad);
      router.push('/liberacionDeVistosBuenos');
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  };

  // Si no hay respuesta pendiente
  if (!currentAnswer) {
    return (
      <Container>
        <Title>Área a evaluar: Color Edge</Title>
        <WorkOrderInfo workOrder={workOrder} />
        <NewData>
          <SectionTitle>No hay respuestas pendientes por revisar</SectionTitle>
          <p style={{ color: '#6b7280' }}>
            Todas las respuestas parecen estar revisadas.
          </p>
        </NewData>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Área a evaluar: Color Edge</Title>

      <WorkOrderInfo workOrder={workOrder} />

      <NewData>
        <SectionTitle>Respuestas del operador</SectionTitle>
        <NewDataWrapper>
          <OperatorAdvancedTable
            questions={formQuestions}
            answers={currentAnswer?.FormAnswerResponse ?? []}
            mode="doble"
            readOnly
            columns={['Respuesta']}
          />
          <InputGroup style={{ width: '50%' }}>
            <Label>Color Edge:</Label>
            <Input
              type="text"
              value={currentAnswer?.color_edge ?? 'No se reconoce la muestra enviada'}
              readOnly
            />
            <Label>Muestras entregadas:</Label>
            <Input
              type="number"
              value={currentAnswer?.sample_quantity ?? ('No se reconoce la muestra enviada' as any)}
              readOnly
            />
          </InputGroup>
        </NewDataWrapper>
      </NewData>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <RechazarButton onClick={() => setShowInconformidad(true)}>
          Rechazar
        </RechazarButton>
        <AceptarButton onClick={() => setShowConfirmModal(true)}>
          Aprobado
        </AceptarButton>
      </div>

      {showConfirmModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>¿Estás segura de aprobar?</ModalTitle>
            <ModalActions>
              <Button
                style={{ backgroundColor: '#BBBBBB' }}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit();
                }}
              >
                Sí, aprobar
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {showInconformidad && (
        <ModalOverlay>
          <ModalBox>
            <h4>Registrar Inconformidad</h4>
            <h3>
              Por favor, describe la inconformidad detectada con las respuestas
              entregadas.
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
                  if (!inconformidad.trim()) {
                    alert('Debes ingresar una inconformidad antes de continuar.');
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
  width: 50%;
`;

const NewDataWrapper = styled.div`
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  width: 100%;
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

const AceptarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 1.5rem;
  background-color: #0038a8;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: flex;
  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #1d4ed8;
    outline: none;
  }
`;

const RechazarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 1.5rem;
  background-color: #bbbbbb;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: block;
  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #a0a0a0;
    outline: none;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  color: black;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 400px;
  text-align: center;
`;

const ModalTitle = styled.h3`
  margin-bottom: 1rem;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: #005bb5;
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