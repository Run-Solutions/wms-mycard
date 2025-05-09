// myorg/apps/frontend-web/src/app/(protected)/aceptarProducto/[id]/page.tsx
'use client'

import { use, useEffect, useState } from "react";
import styled from "styled-components";
import PrepressComponentAccept from "@/components/AceptarProducto/PrepressComponent";
import ImpresionComponentAccept from "@/components/AceptarProducto/ImpresionComponent";
import SerigrafiaComponentAccept from "@/components/AceptarProducto/SerigrafiaComponent";
import EmpalmeComponentAccept from "@/components/AceptarProducto/EmpalmeComponent";
import LaminacionComponentAccept from "@/components/AceptarProducto/LaminacionComponent";
import AfterAllComponentAccept from "@/components/AceptarProducto/AfterAllComponentAccept";

interface Props {
    params: Promise<{ id: string }>;
}

export default function AceptarProductoAuxPage({ params }: Props) {
    const { id } = use(params);
    const [workOrder, setWorkOrder] = useState<any>(null)

    useEffect(() => {
      async function fetchWorkOrder() {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/work-order-flow/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        const data = await res.json()
        console.log('Orden:', data)
        setWorkOrder(data)
      }
      fetchWorkOrder()
    }, [id])
    
    if (!workOrder) return <div>Cargando...</div>
    const lastCompleted = [...workOrder.workOrder.flow]
      .reverse()
      .find((item) => item.status === "Completado");
    console.log('Area previa', lastCompleted);

    // Mostrar la liberacion del producto por area 
    const renderComponentByArea = () => {
      switch (lastCompleted.area_id) {
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
        case 6:
            return <AfterAllComponentAccept workOrder={workOrder}/>
        case 7:
            return <AfterAllComponentAccept workOrder={workOrder}/>
        case 8:
            return <AfterAllComponentAccept workOrder={workOrder}/>
        case 9:
            return <AfterAllComponentAccept workOrder={workOrder}/>
        case 10:
            return <AfterAllComponentAccept workOrder={workOrder}/>
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
  