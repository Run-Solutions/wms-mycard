'use client'

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styled from "styled-components";
import { acceptWorkOrderFlow, registrarInconformidad } from "@/api/aceptarProducto";

// Define un tipo para los valores del formulario
type PrepressData = {
  plates: string;
  positives: string;
  testType: string;
  comments: string;
};

interface Props {
  workOrder: any;
}

export default function PrepressComponentAccept({ workOrder }: Props) {
  console.log('WorkOrder recibida', workOrder);
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState<string>('');

  const [defaultValues, setDefaultValues] = useState<PrepressData>({
    plates: "",
    positives: "",
    testType: "",
    comments: "",
  });

  const lastCompleted = [...workOrder.workOrder.flow]
  .reverse()
  .find((item) => item.status === "Completado");
  console.log('Ultimo completado', lastCompleted);

  useEffect(() => {
    // Al iniciar, configuramos los valores predeterminados y actuales
    if (!workOrder) return;
    if (lastCompleted?.areaResponse?.prepress) {
      const vals: PrepressData = {
        plates: lastCompleted.areaResponse.prepress.plates || "",
        positives: lastCompleted.areaResponse.prepress.positives || "",
        testType: lastCompleted.areaResponse.prepress.testType || "",
        comments: lastCompleted.areaResponse.prepress.comments || "",
      };
      setDefaultValues(vals);
    }
  }, [workOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defaultValues.plates) {
      alert('Por favor, asegurate de que no haya inconformidades con las cantidades entregadas.');
      return;
    }
    const flowId = workOrder?.id;
    try {
      await acceptWorkOrderFlow(flowId);
      router.push('/aceptarProducto');
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  }

  const handleSubmitInconformidad = async () => {
    console.log(lastCompleted?.id);
    console.log(inconformidad);
    try {
      await registrarInconformidad(lastCompleted?.id, inconformidad);
      router.push('/aceptarProducto');
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  }

  const cantidadHojasRaw = Number(workOrder?.workOrder.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;
  
  return (
    <Container>
      <Title>Área: {workOrder.area.name}</Title>

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
          <Value>{lastCompleted?.area.name || "No definida"}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Usuario que lo envía:</Label>
          <Value>{lastCompleted?.user.username || "No definida"}</Value>
        </InfoItem>
      </DataWrapper>
        <InfoItem style={{ marginTop: '20px'}}>
          <Label>Comentarios:</Label>
          <Value>{workOrder.workOrder.comments}</Value>
        </InfoItem>
      
      <NewData>
        <SectionTitle>Cantidad entregada</SectionTitle>
        <NewDataWrapper>
          <InputGroup>
            <Label>Placas:</Label>
            <Input type="number" name="plates" value={defaultValues.plates} disabled />
          </InputGroup>
          <InconformidadButton onClick={() => setShowInconformidad(true)}>Inconformidad</InconformidadButton>
        </NewDataWrapper>
        <NewDataWrapper>
          <InputGroup>
            <Label>Positivos:</Label>
            <Input type="number" name="positives" value={defaultValues.positives} disabled />
          </InputGroup>
        </NewDataWrapper>
        <SectionTitle>Tipo de Prueba</SectionTitle>
        <RadioGroup>
          <RadioLabel>
            <Radio type="radio" name="prueba" value="color" checked={defaultValues.testType === "color"} readOnly/>
            Prueba de color
          </RadioLabel>
          <RadioLabel>
            <Radio type="radio" name="prueba" value="fisica" checked={defaultValues.testType === "fisica"} readOnly/>
            Muestra física
          </RadioLabel>
          <RadioLabel>
            <Radio type="radio" name="prueba" value="digital" checked={defaultValues.testType === "digital"} readOnly/>
            Prueba digital
          </RadioLabel>
        </RadioGroup>
        <InputGroup>
          <SectionTitle>Comentarios</SectionTitle>
          <Textarea value={defaultValues.comments} disabled={true} />
        </InputGroup>
      </NewData>
      <AceptarButton type='button' onClick={() => setShowConfirm(true)}>Aceptar recepción del producto</AceptarButton>
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
  background-color: ${({ disabled }) => (disabled ? "#9CA3AF" : "#0038A8")};
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
  background-color: ${({ disabled }) => (disabled ? "#D1D5DB" : "#A9A9A9")};
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
      disabled ? "#D1D5DB" : "#8d8d92"};
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
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;

  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover,
  &:focus {
    background-color: #1D4ED8;
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