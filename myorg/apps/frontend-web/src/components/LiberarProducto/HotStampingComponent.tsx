'use client'

import styled from "styled-components";

interface Props {
  workOrder: any;
}

export default function HotStampingComponent({ workOrder }: Props) {
  return (
    <Container>
      <Title>Área: HotStamping</Title>

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

      <SectionTitle>Datos de Producción</SectionTitle>
      <NewDataWrapper>
        <InputGroup>
          <Label>Placas:</Label>
          <Input type="text" placeholder="Ej: 2" />
        </InputGroup>
        <InputGroup>
          <Label>Positivos:</Label>
          <Input type="text" placeholder="Ej: 3" />
        </InputGroup>
      </NewDataWrapper>

      <SectionTitle>Tipo de Prueba</SectionTitle>
      <RadioGroup>
        <RadioLabel>
          <Radio type="radio" name="prueba" value="color" />
          Prueba de color
        </RadioLabel>
        <RadioLabel>
          <Radio type="radio" name="prueba" value="fisica" />
          Muestra física
        </RadioLabel>
        <RadioLabel>
          <Radio type="radio" name="prueba" value="digital" />
          Prueba digital
        </RadioLabel>
      </RadioGroup>

      <SectionTitle>Comentarios</SectionTitle>
      <Textarea placeholder="Agrega un comentario adicional..." />

      <LiberarButton>Liberar producto</LiberarButton>
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
