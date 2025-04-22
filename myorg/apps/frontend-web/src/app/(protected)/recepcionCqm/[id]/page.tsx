// myorg/apps/frontend-web/src/app/(protected)/recepcionCqm/[id]/page.tsx
'use client'

import { use, useEffect, useState } from "react";
import styled from "styled-components";
import ImpresionComponent from "@/components/RecepcionCqm/ImpresionComponent";
import SerigrafiaComponent from "@/components/RecepcionCqm/SerigrafiaComponent";
import EmpalmeComponent from "@/components/RecepcionCqm/EmpalmeComponent";
import LaminacionComponent from "@/components/RecepcionCqm/LaminacionComponent";
import CorteComponent from "@/components/RecepcionCqm/CorteComponent";
import ColorEdgeComponent from "@/components/RecepcionCqm/ColorEdgeComponent";
import HotStampingComponent from "@/components/RecepcionCqm/HotStampingComponent";
import MillingChipComponent from "@/components/RecepcionCqm/MillingChipComponent";
import PersonalizacionComponent from "@/components/RecepcionCqm/PersonalizacionComponent";

interface Props {
  params: Promise<{ id: string }>;
}

export default function RecepcionCQMPage({ params }: Props) {
  const { id } = use(params);
  const [CQMWorkOrders, setCQMWorkOrders] = useState<any>(null)
  
  console.log('El id que quiero',id);
  
  useEffect(() => {
    async function fetchWorkOrder() {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/free-order-cqm/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
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
  