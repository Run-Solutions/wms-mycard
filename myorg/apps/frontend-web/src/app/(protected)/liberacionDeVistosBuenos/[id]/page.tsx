// myorg/apps/frontend-web/src/app/(protected)/recepcionCqm/[id]/page.tsx
'use client'

import { use, useEffect, useState } from "react";
import styled from "styled-components";
import { getWorkOrderById } from "@/api/recepcionCQM";

import ImpresionComponent from "@/components/liberacionDeVistosBuenos/ImpresionComponent";
import SerigrafiaComponent from "@/components/liberacionDeVistosBuenos/SerigrafiaComponent";
import EmpalmeComponent from "@/components/liberacionDeVistosBuenos/EmpalmeComponent";
import LaminacionComponent from "@/components/liberacionDeVistosBuenos/LaminacionComponent";
import CorteComponent from "@/components/liberacionDeVistosBuenos/CorteComponent";
import ColorEdgeComponent from "@/components/liberacionDeVistosBuenos/ColorEdgeComponent";
import HotStampingComponent from "@/components/liberacionDeVistosBuenos/HotStampingComponent";
import MillingChipComponent from "@/components/liberacionDeVistosBuenos/MillingChipComponent";
import PersonalizacionComponent from "@/components/liberacionDeVistosBuenos/PersonalizacionComponent";

interface Props {
  params: Promise<{ id: string }>;
}

export default function RecepcionCQMPage({ params }: Props) {
  const { id } = use(params);
  const [CQMWorkOrders, setCQMWorkOrders] = useState<any>(null)
  
  console.log('El id que quiero',id);
  
  useEffect(() => {
    async function fetchWorkOrder() {
      const data = await getWorkOrderById(id);
      console.log('Orden:', data);
      setCQMWorkOrders(data)
    }
    fetchWorkOrder()
  }, [id])
  if (!CQMWorkOrders) return <div>Cargando...</div>
  
  // Mostrar la liberacion del producto por area 
  const renderComponentByArea = () => {
    switch (CQMWorkOrders.area_id) {
      case 2:
        return <ImpresionComponent workOrder={CQMWorkOrders}/>
      case 3:
        return <SerigrafiaComponent workOrder={CQMWorkOrders}/>
      case 4:
        return <EmpalmeComponent workOrder={CQMWorkOrders}/>
      case 5:
        return <LaminacionComponent workOrder={CQMWorkOrders}/>
      case 6:
        return <CorteComponent workOrder={CQMWorkOrders}/>
      case 7:
        return <ColorEdgeComponent workOrder={CQMWorkOrders}/>
      case 8:
        return <HotStampingComponent workOrder={CQMWorkOrders}/>
      case 9:
        return <MillingChipComponent workOrder={CQMWorkOrders}/>
      case 10:
        return <PersonalizacionComponent workOrder={CQMWorkOrders}/>
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
  