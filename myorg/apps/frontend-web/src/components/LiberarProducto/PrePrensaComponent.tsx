'use client';

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

interface Props {
  workOrder: any;
}
type PartialRelease = {
  area: string;
  quantity: number;
}

export default function PrePrensaComponent({ workOrder }: Props) {
  const [plates, setPlates] = useState('');
  const [positives, SetPositives] = useState('');
  const [testTypes, SetTestTypes] = useState('');
  const [comments, SetComments] = useState('');
  const [showConfirm, setShowConfirm] = useState(false); 

  const router = useRouter();

  const currentFlow = [...workOrder.workOrder.flow]
  .reverse()
  .find((item) =>
    ["Listo", "En proceso", "Enviado a CQM", "En Calidad"].includes(item.status)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plates || !positives || !testTypes) {
      alert('Por favor. completa los campos obligatorios');
      return;
    }
    const payload = {
      workOrderId: workOrder.work_order_id,
      workOrderFlowId: currentFlow.id,
      areaId: workOrder.area_id,
      assignedUser: workOrder.assigned_user || null,

      plates: parseInt(plates),
      positives: parseInt(positives),
      testType: testTypes,
      comments,
    };

    try {
      const token = localStorage.getItem('token');
      if(!token) {
        alert('No hay token de autenticacion');
        return;
      }
      const res = await fetch('http://localhost:3000/free-order-flow/prepress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("Error en el servidor:", data);
        return;
      }

      router.push('/liberarProducto');
    } catch (error) {
      console.error('Error al enviar respuesta', error);
      alert('Ocurrió un error al enviar la respuesta.');
    } finally {
      setShowConfirm(false);
    }
  }

  return (
    <Container>
      <Title>Área: Preprensa</Title>

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
          <Label>Cantidad:</Label>
          <Value>{workOrder.workOrder.quantity}</Value>
        </InfoItem>
      </DataWrapper>

      <DataWrapper>
        <InfoItem style={{ marginTop: '20px'}}>
          <Label>Comentarios:</Label>
          <Value>{workOrder.workOrder.comments}</Value>
        </InfoItem>
      </DataWrapper>

      <form onSubmit={handleSubmit}>
        <SectionTitle>Datos de Producción</SectionTitle>
        <NewDataWrapper>
          <InputGroup>
            <Label>Placas:</Label>
            <Input type="number" min="0" placeholder="Ej: 2" value={plates} onChange={(e) => setPlates(e.target.value)} />
          </InputGroup>
          <InputGroup>
            <Label>Positivos:</Label>
            <Input type="number" min="0" placeholder="Ej: 3" value={positives} onChange={(e) => SetPositives(e.target.value)} />
          </InputGroup>
        </NewDataWrapper>

        <SectionTitle>Tipo de Prueba</SectionTitle>
        <RadioGroup>
          <RadioLabel>
            <Radio type="radio" name="prueba" value="color" onChange={(e) => SetTestTypes(e.target.value)} />
            Prueba de color
          </RadioLabel>
          <RadioLabel>
            <Radio type="radio" name="prueba" value="fisica" onChange={(e) => SetTestTypes(e.target.value)} />
            Muestra física
          </RadioLabel>
          <RadioLabel>
            <Radio type="radio" name="prueba" value="digital" onChange={(e) => SetTestTypes(e.target.value)} />
            Prueba digital
          </RadioLabel>
        </RadioGroup>

        <SectionTitle>Comentarios</SectionTitle>
        <Textarea placeholder="Agrega un comentario adicional..."  onChange={(e) => SetComments(e.target.value)}/>

        <LiberarButton type="button" onClick={() => setShowConfirm(true)}>Liberar producto</LiberarButton>
      </form>
      {showConfirm && (
        <ModalOverlay>
          <ModalBox>
            <h4 style={{ color: 'black'}}>¿Estás segura/o que deseas liberar este producto?</h4>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <CancelButton onClick={() => setShowConfirm(false)}>Cancelar</CancelButton>
              <ConfirmButton onClick={handleSubmit}>Confirmar</ConfirmButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </Container>
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

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: #374151;
`;

const DataWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
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
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  flex: 1;
  min-width: 200px;
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

const Textarea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 1rem;
  color: black;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
  font-size: 1rem;
  resize: vertical;

  &:focus {
    border-color: #2563eb;
    outline: none;
  }
`;

const LiberarButton = styled.button`
  margin-top: 2rem;
  background-color: #2563eb;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;

  &:hover {
    background-color: #1d4ed8;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
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