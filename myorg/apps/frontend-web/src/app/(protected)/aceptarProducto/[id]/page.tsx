// myorg/apps/frontend-web/src/app/(protected)/aceptarProducto/[id]/page.tsx
'use client'

import { use, useEffect, useState } from "react";
import styled from "styled-components";
import { getWorkOrderByFlowId } from "@/api/aceptarProducto";

import PrepressComponentAccept from "@/components/AceptarProducto/PrepressComponent";
import ImpresionComponentAccept from "@/components/AceptarProducto/ImpresionComponent";
import SerigrafiaComponentAccept from "@/components/AceptarProducto/SerigrafiaComponent";
import EmpalmeComponentAccept from "@/components/AceptarProducto/EmpalmeComponent";
import LaminacionComponentAccept from "@/components/AceptarProducto/LaminacionComponent";

interface Props {
    params: Promise<{ id: string }>;
}

export default function AceptarProductoAuxPage({ params }: Props) {
    const { id } = use(params);
    const [workOrder, setWorkOrder] = useState<any>(null)

    useEffect(() => {
      async function fetchWorkOrder() {
        const data = await getWorkOrderByFlowId(id);
        console.log('Orden:', data)
        setWorkOrder(data)
      }
      fetchWorkOrder()
    }, [id])
    
    if (!workOrder) return <div>Cargando...</div>
    let lastCompletedOrPartial: { status: string; area_id: number, area: { id: number } } | undefined;
    if (workOrder.status === 'Pendiente'){
      lastCompletedOrPartial = [...workOrder.workOrder.flow]
      .reverse()
      .find((item) => item.status === "Completado");
    } else if (['Pendiente'].includes(workOrder.status) && workOrder.workOrder.flow.partialReleases.length > 0) {
      lastCompletedOrPartial = [...workOrder.workOrder.flow]
      .reverse()
      .find((item) => ['Listo', 'Enviado a CQM', 'En calidad', 'Parcial'].includes(item.status));
    } else if (['Pendiente parcial'].includes(workOrder.status)) {
      lastCompletedOrPartial = [...workOrder.workOrder.flow]
      .reverse()
      .find((item) => ['Listo', 'Enviado a CQM', 'En calidad', 'Parcial'].includes(item.status));
    }

    console.log('Area previa', lastCompletedOrPartial);

    // Mostrar la liberacion del producto por area 
    const renderComponentByArea = () => {
      switch (lastCompletedOrPartial?.area_id) {
        case 1:
            return <PrepressComponentAccept workOrder={workOrder}/>
        case 2:
            return <ImpresionComponentAccept workOrder={workOrder}/>
        case 3:
            return <SerigrafiaComponentAccept workOrder={workOrder}/>
        case 4:
            return <EmpalmeComponentAccept workOrder={workOrder}/>
        case 5:
            return <LaminacionComponentAccept workOrder={workOrder}/>
        default: 
          return <div>Area no reconocida.</div>
      }
    };
    return (
      <PageContainer>
        {renderComponentByArea()}
      </PageContainer>
    );
}

// =================== Styled Components ===================
const PageContainer = styled.div`
  padding: 1rem 2rem;
  margin-top: -80px;
  width: 100%;
  align-content: flex-start;
  justify-content: center;
`;
  