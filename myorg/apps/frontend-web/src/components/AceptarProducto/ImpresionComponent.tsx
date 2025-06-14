'use client'

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styled from "styled-components";
import { acceptWorkOrderFlow, registrarInconformidad } from "@/api/aceptarProducto";

type ImpressionData = {
  release_quantity: string;
  comments: string;
};

interface Props {
  workOrder: any;
}

interface PartialRelease {
  quantity: string;
  observations: string;
  validated: boolean;
  // otros campos si aplica
}

export default function ImpresionComponentAccept({ workOrder }: Props) {
  console.log('WorkOrder recibida', workOrder);
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState<string>('');

  const [defaultValues, setDefaultValues] = useState<ImpressionData>({
    release_quantity: "",
    comments: "",
  });

  console.log("El mismo workOrder (workOrder)", workOrder);
  const flowList = [...workOrder.workOrder.flow];
  // Índice del flow actual basado en su id
  const currentIndex = flowList.findIndex((item) => item.id === workOrder.id);
  console.log('el currentIndex', currentIndex);
  // Flow actual
  const currentFlow = currentIndex !== -1 ? flowList[currentIndex] : null;
  // Anterior (si hay)
  const lastCompletedOrPartial = currentIndex > 0 ? flowList[currentIndex - 1] : null;
  // Siguiente (si hay)
  const nextFlow = currentIndex !== -1 && currentIndex < flowList.length - 1
    ? flowList[currentIndex + 1]
    : null;
  console.log("El flujo actual (currentFlow)", currentFlow);
  console.log("El siguiente flujo (nextFlow)", nextFlow);
  console.log("Ultimo parcial o completado", lastCompletedOrPartial);

  const isAcceptDisabled = () => lastCompletedOrPartial.status === 'Enviado a CQM' || lastCompletedOrPartial.status === 'En inconformidad CQM' || lastCompletedOrPartial.status === 'En Inconformidad CQM' || lastCompletedOrPartial.status === 'En Calidad';
  useEffect(() => {
    // Al iniciar, configuramos los valores predeterminados y actuales
    if (lastCompletedOrPartial?.areaResponse?.impression && lastCompletedOrPartial?.partialReleases.length === 0) {
      const vals: ImpressionData = {
        release_quantity: lastCompletedOrPartial.areaResponse.impression.release_quantity || "",
        comments: lastCompletedOrPartial.areaResponse.impression.comments || "",
      };
      setDefaultValues(vals);
    } else {
      const firstUnvalidatedPartial = lastCompletedOrPartial.partialReleases.find(
        (release: PartialRelease) => !release.validated
      );
    
      const vals: ImpressionData = {
        release_quantity: firstUnvalidatedPartial?.quantity || "",
        comments: firstUnvalidatedPartial?.observation || "",
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
    const flowId = workOrder.id;
    try {
      await acceptWorkOrderFlow(flowId);
      router.push('/aceptarProducto');
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  }

  const handleSubmitInconformidad = async () => {
    console.log(lastCompletedOrPartial.id);
    console.log(inconformidad);
    if (!inconformidad.trim()) {
      alert('Por favor, describe la inconformidad antes de continuar.');
      return;
    }
    try {
      await registrarInconformidad(lastCompletedOrPartial?.id, inconformidad);
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
          <Value>{lastCompletedOrPartial?.area.name || "No definida"}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Usuario que lo envía:</Label>
          <Value>{lastCompletedOrPartial?.user.username || "No definida"}</Value>
        </InfoItem>
      </DataWrapper>
        <InfoItem>
            <Label>Comentarios:</Label>
            <Value>{workOrder.workOrder.comments}</Value>
        </InfoItem>

      <NewData>
        <SectionTitle>Datos de Producción</SectionTitle>
        <NewDataWrapper>
          <InputGroup>
            <Label>Cantidad entregada:</Label>
            <Input type="number" name="release_quantity" value={defaultValues.release_quantity} disabled/>
          </InputGroup>
          <InconformidadButton onClick={() => setShowInconformidad(true)} disabled={isAcceptDisabled()}>Inconformidad</InconformidadButton>
        </NewDataWrapper>
        <InputGroup>
          <SectionTitle>Comentarios</SectionTitle>
          <Textarea value={defaultValues.comments} disabled />
        </InputGroup>
      </NewData>
      <AceptarButton onClick={() => setShowConfirm(true)} disabled={isAcceptDisabled()}>Aceptar recepción del producto</AceptarButton>
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
    border-color: #0038A8;
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
    border-color: #0038A8;
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