// myorg/apps/frontend-web/src/app/(protected)/liberarProducto/[id]/page.tsx
'use client'

import { use, useEffect, useState } from "react";
import styled from "styled-components";
import { fetchWorkOrderById } from "@/api/liberarProducto";

import PrePrensaComponent from "@/components/LiberarProducto/PrePrensaComponent";
import ImpresionComponent from "@/components/LiberarProducto/ImpresionComponent";
import EmpalmeComponent from "@/components/LiberarProducto/EmpalmeComponent";
import LaminacionComponent from "@/components/LiberarProducto/LaminacionComponent";
import SerigrafiaComponent from "@/components/LiberarProducto/SerigrafiaComponent";
import CorteComponent from "@/components/LiberarProducto/CorteComponent";
import ColorEdgeComponent from "@/components/LiberarProducto/ColorEdgeComponent";
import HotStampingComponent from "@/components/LiberarProducto/HotStampingComponent";
import MillingChipComponent from "@/components/LiberarProducto/MillingChipComponent";
import PersonalizacionComponent from "@/components/LiberarProducto/PersonalizacionComponent";

interface Props {
    params: Promise<{ id: string }>;
}

export default function LiberarProductoPage({ params }: Props) {
  const { id } = use(params);
  const [workOrder, setWorkOrder] = useState<any>(null)

  useEffect(() => {
    async function fetchWorkOrder() {
      const data = await fetchWorkOrderById(id);
      console.log('Orden:', data)
      setWorkOrder(data)
    }
    fetchWorkOrder()
  }, [id])

  if (!workOrder) return <div>Cargando...</div>

    // Mostrar la liberacion del producto por area 
    const renderComponentByArea = () => {
      switch (workOrder.area_id) {
        case 1:
          return <PrePrensaComponent workOrder={workOrder}/>
        case 2:
          return <ImpresionComponent workOrder={workOrder}/>
        case 3:
          return <SerigrafiaComponent workOrder={workOrder}/>
        case 4:
          return <EmpalmeComponent workOrder={workOrder}/>
        case 5:
          return <LaminacionComponent workOrder={workOrder}/>
        case 6:
          return <CorteComponent workOrder={workOrder}/>
        case 7:
          return <ColorEdgeComponent workOrder={workOrder}/>
        case 8:
          return <HotStampingComponent workOrder={workOrder}/>
        case 9:
          return <MillingChipComponent workOrder={workOrder}/>
        case 10:
          return <PersonalizacionComponent workOrder={workOrder}/>
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
  padding: 20px 20px 20px 50px;
  margin-top: -80px;
  width: 100%;
  align-content: flex-start;
  justify-content: center;
`;
  