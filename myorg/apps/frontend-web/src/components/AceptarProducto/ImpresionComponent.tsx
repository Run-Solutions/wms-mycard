'use client'

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styled from "styled-components";

type ImpressionData = {
  release_quantity: string;
  comments: string;
};

interface Props {
  workOrder: any;
}

export default function ImpresionComponentAccept({ workOrder }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState<string>('');

  const [defaultValues, setDefaultValues] = useState<ImpressionData>({
    release_quantity: "",
    comments: "",
  });

  const lastCompleted = [...workOrder.workOrder.flow]
  .reverse()
  .find((item) => item.status === "Completado");
  const previousArea = lastCompleted?.area.id;

  console.log('area previa',previousArea);

  useEffect(() => {
    // Al iniciar, configuramos los valores predeterminados y actuales
    const lastCompleted = [...workOrder.workOrder.flow]
      .reverse()
      .find((item) => item.status === "Completado");
    console.log('Area previa', lastCompleted);
    if (lastCompleted?.areaResponse?.impression) {
      const vals: ImpressionData = {
        release_quantity: lastCompleted.areaResponse.impression.release_quantity || "",
        comments: lastCompleted.areaResponse.impression.comments || "",
      };
      setDefaultValues(vals);
    }
  }, [workOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defaultValues.release_quantity) {
      alert('Por favor, asegurate de que no haya inconformidades con las cantidades entregadas.');
      return;
    }
    const token = localStorage.getItem('token');
    const flowId = workOrder.id;
    console.log(flowId);
    try {
      const res = await fetch(`http://localhost:3000/work-order-flow/${flowId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/aceptarProducto');
      }
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  }

  const handleSubmitInconformidad = async () => {
    const token = localStorage.getItem('token');
    console.log(lastCompleted.id);
    console.log(inconformidad);
    try {
      const res = await fetch(`http://localhost:3000/work-order-flow/${lastCompleted.id}/inconformidad`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({inconformidad}),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/aceptarProducto');
      }
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  }

  return (
    <Container>
      <Title>Área: {workOrder?.area.name || "No definida"}</Title>
      <DataWrapper>
        <InfoItem>
          <Label>Número de Orden:</Label>
          <Value>{workOrder.workOrder.ot_id}</Value>
        </InfoItem>
        <InfoItem>
          <Label>ID del Presupuesto:</Label>
          <Value>{workOrder.workOrder.mycard_id}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Área que lo envía:</Label>
          <Value>{lastCompleted?.area.name || "No definida"}</Value>
        </InfoItem>
      </DataWrapper>
      <NewData>
        <SectionTitle>Datos de Producción</SectionTitle>
        <NewDataWrapper>
          <InputGroup>
            <Label>Cantidad entregada:</Label>
            <Input type="number" name="release_quantity" value={defaultValues.release_quantity} disabled/>
          </InputGroup>
          <InconformidadButton onClick={() => setShowInconformidad(true)}>Inconformidad</InconformidadButton>
        </NewDataWrapper>
        <InputGroup>
          <SectionTitle>Comentarios</SectionTitle>
          <Textarea value={defaultValues.comments} disabled />
        </InputGroup>
      </NewData>
      <AceptarButton onClick={() => setShowConfirm(true)}>Aceptar recepción del producto</AceptarButton>
      {showConfirm && (
        <ModalOverlay>
          <ModalBox>
            <h4>¿Estás segura/o que deseas liberar este producto?</h4>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <CancelButton onClick={() => setShowConfirm(false)}>Cancelar</CancelButton>
              <ConfirmButton onClick={handleSubmit}>Confirmar</ConfirmButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
      {showInconformidad && (
        <ModalOverlay>
          <ModalBox>
            <h4>Registrar Inconformidad</h4>
            <h3>Por favor, describe la inconformidad detectada con la cantidad entregada.</h3>
            <Textarea
              value={inconformidad}
              onChange={(e) => setInconformidad(e.target.value)}
              placeholder="Escribe aquí la inconformidad..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <CancelButton onClick={() => setShowInconformidad(false)}>Cancelar</CancelButton>
              <ConfirmButton onClick={() => {
                console.log('Hpli');
                if (!inconformidad.trim()) {
                  alert('Debes ingresar una inconformidad antes de continuar.');
                  return;
                }
                handleSubmitInconformidad();
                setShowInconformidad(false);
              }}>Guardar</ConfirmButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </Container>
  );
};

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
  gap: 2rem;
`;

const InfoItem = styled.div`
  flex: 1;
  min-width: 200px;
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
    border-color: #2563eb;
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
    border-color: #2563eb;
    outline: none;
  }
`;

const AceptarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 2rem;
  background-color: ${({ disabled }) => (disabled ? "#9CA3AF" : "#2563EB")};
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${({ disabled }) =>
      disabled ? "#9CA3AF" : "#1D4ED8"};
  }
`;

const InconformidadButton = styled.button<{ disabled?: boolean }>`
  height: 50px;
  background-color: ${({ disabled }) => (disabled ? "#D1D5DB" : "#2563EB")};
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  align-self: flex-end;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${({ disabled }) =>
      disabled ? "#D1D5DB" : "#1D4ED8"};
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
  accent-color: #2563eb;
`;

const ModalOverlay = styled.div`
  position: fixed;
  color: black;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
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
  background-color: #2563eb;
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