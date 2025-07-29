// myorg/apps/frontend-web/src/app/(protected)/rechazos/[id]/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { getWorkOrderInconformidadById } from '@/api/inconformidades';

import CorteComponent from '@/components/Rechazos/CorteComponent';
import ColorEdgeComponent from '@/components/Rechazos/ColorEdgeComponent';
import HotStampingComponent from '@/components/Rechazos/HotStampingComponent';
import PersonalizacionComponent from '@/components/Rechazos/PersonalizacionComponent';
import MillingChipComponent from '@/components/Rechazos/MillingChipComponent';

interface Props {
  params: Promise<{ id: string }>;
}

type AreaData = {
  name: string;
  status: string;
  response: string;
  answers: any;
  buenas: number;
  malas: number;
  cqm: number;
  excedente: number;
  muestras: number;
};

export default function RechazosAuxPage({ params }: Props) {
  const { id } = use(params);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    async function fetchWorkOrder() {
      const data = await getWorkOrderInconformidadById(id);
      console.log('Orden:', data);
      setWorkOrder(data);
    }
    fetchWorkOrder();
  }, [id]);

  if (!workOrder) return <div>Cargando...</div>;
  const lastCompleted = [...workOrder.flow]
    .reverse()
    .find((item) => item.status === 'En inconformidad auditoria');
  console.log('Area previa', lastCompleted);
  // Mostrar la liberacion del producto por area
  const renderComponentByArea = () => {
    if (lastCompleted !== undefined) {
      switch (lastCompleted.area_id) {
        case 6:
          return (
            <CorteComponent workOrder={workOrder} currentFlow={lastCompleted} />
          );
        case 7:
          return (
            <ColorEdgeComponent workOrder={workOrder} currentFlow={lastCompleted} />
          );
        case 8:
          return (
            <HotStampingComponent workOrder={workOrder} currentFlow={lastCompleted} />
          );
        case 9:
          return (
            <MillingChipComponent workOrder={workOrder} currentFlow={lastCompleted} />
          );
        case 10:
          return (
            <PersonalizacionComponent workOrder={workOrder} currentFlow={lastCompleted} />
          );
        default:
          return <div>Area no reconocida.</div>;
      }
    }
  };

  return (
    <>
      <Container>
        <Title>Información De La Inconformidad De La Orden de Trabajo</Title>

        <DataWrapper>
          <InfoItem>
            <Label>Número de Orden: </Label>
            <Value>{workOrder?.ot_id}</Value>
          </InfoItem>
          <InfoItem>
            <Label>ID del Presupuesto: </Label>
            <Value>{workOrder?.mycard_id}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Cantidad: </Label>
            <Value>{workOrder?.quantity}</Value>
          </InfoItem>
        </DataWrapper>
        <DataWrapper>
          <InfoItem>
            <Label>Comentarios: </Label>
            <Value>{workOrder?.comments}</Value>
          </InfoItem>
        </DataWrapper>

        <Section>
          <SectionTitle>Detalles de Producción</SectionTitle>
          {lastCompleted !== undefined && renderComponentByArea()}
        </Section>
      </Container>
    </>
  );
}

// =================== Styled Components ===================

const Container = styled.div`
  padding: 20px 20px 20px 50px;
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
  font-size: 2rem;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const DataWrapper = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  max-width: 80%;
`;

const InfoItem = styled.div`
  background: white;
  padding: 1.25rem 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
  color: black;
  flex: 1;
`;

const Label = styled.span`
  font-weight: 600;
  color: black;
  margin-bottom: 0.25rem;
`;

const Value = styled.span`
  font-size: 1.125rem;
  color: #111827;
  color: black;
`;

const Section = styled.section`
  margin-top: 3rem;
  max-width: 80%;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.palette.text.primary};
`;
