// myorg/apps/frontend-web/src/app/(protected)/aceptarProducto/[id]/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import styled from 'styled-components';
import { getWorkOrderByFlowId } from '@/api/aceptarProducto';

import PrepressComponentAccept from '@/components/AceptarProducto/PrepressComponent';
import ImpresionComponentAccept from '@/components/AceptarProducto/ImpresionComponent';
import SerigrafiaComponentAccept from '@/components/AceptarProducto/SerigrafiaComponent';
import EmpalmeComponentAccept from '@/components/AceptarProducto/EmpalmeComponent';
import LaminacionComponentAccept from '@/components/AceptarProducto/LaminacionComponent';
import CorteComponentAccept from '@/components/AceptarProducto/CorteComponent';
import ColorEdgeComponentAccept from '@/components/AceptarProducto/ColorEdgeComponent';
import HotStampingComponentAccept from '@/components/AceptarProducto/HotStampingComponent';
import MillingChipComponentAccept from '@/components/AceptarProducto/MillingChipComponent';
import PersonalizacionComponentAccept from '@/components/AceptarProducto/PersonalizacionComponent';

interface Props {
  params: Promise<{ id: string }>;
}

export default function AceptarProductoAuxPage({ params }: Props) {
  const { id } = use(params);
  const [workOrder, setWorkOrder] = useState<any>(null);

  useEffect(() => {
    async function fetchWorkOrder() {
      const data = await getWorkOrderByFlowId(id);
      console.log('Orden:', data);
      setWorkOrder(data);
    }
    fetchWorkOrder();
  }, [id]);

  if (!workOrder) return <div>Cargando...</div>;
  const flow = workOrder.workOrder.flow ?? [];
  const reversed = [...flow].reverse();

  const hasAnyPartialRelease = flow.some(
    (f: { partialReleases?: unknown[] }) => (f.partialReleases?.length ?? 0) > 0
  );

  let lastCompletedOrPartial:
    | { status: string; area_id: number; area: { id: number } }
    | undefined;

  if (workOrder.status === 'Pendiente') {
    // último completado hacia atrás
    lastCompletedOrPartial = reversed.find(
      (item) => item.status === 'Completado'
    );
  } else if (workOrder.status === 'En proceso' && hasAnyPartialRelease) {
    // si querías esta lógica para "En proceso" con parciales
    lastCompletedOrPartial = reversed.find((item) =>
      [
        'Listo',
        'Enviado a CQM',
        'En Calidad',
        'Parcial',
        'Completado',
      ].includes(item.status)
    );
  } else if (workOrder.status === 'Pendiente parcial') {
    // *** clave: incluir 'Pendiente parcial' ***
    lastCompletedOrPartial = reversed.find((item) =>
      [
        'Pendiente parcial',
        'Parcial',
        'Listo',
        'Enviado a CQM',
        'En Calidad',
        'En proceso',
        'Completado',
      ].includes(item.status)
    );
  }

  console.log('Area previa', lastCompletedOrPartial);

  // Mostrar la liberacion del producto por area
  const renderComponentByArea = () => {
    switch (lastCompletedOrPartial?.area_id) {
      case 1:
        return <PrepressComponentAccept workOrder={workOrder} />;
      case 2:
        return <ImpresionComponentAccept workOrder={workOrder} />;
      case 3:
        return <SerigrafiaComponentAccept workOrder={workOrder} />;
      case 4:
        return <EmpalmeComponentAccept workOrder={workOrder} />;
      case 5:
        return <LaminacionComponentAccept workOrder={workOrder} />;
      case 6:
        return <CorteComponentAccept workOrder={workOrder} />;
      case 7:
        return <ColorEdgeComponentAccept workOrder={workOrder} />;
      case 8:
        return <HotStampingComponentAccept workOrder={workOrder} />;
      case 9:
        return <MillingChipComponentAccept workOrder={workOrder} />;
      case 10:
        return <PersonalizacionComponentAccept workOrder={workOrder} />;
      default:
        return <div>Area no reconocida.</div>;
    }
  };
  return <PageContainer>{renderComponentByArea()}</PageContainer>;
}

// =================== Styled Components ===================
const PageContainer = styled.div`
  padding: 1rem 2rem;
  margin-top: -80px;
  width: 100%;
  align-content: flex-start;
  justify-content: center;
`;
