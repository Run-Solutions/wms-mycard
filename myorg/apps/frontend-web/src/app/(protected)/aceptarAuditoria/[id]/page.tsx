// myorg/apps/frontend-web/src/app/(protected)/aceptarProducto/[id]/page.tsx
'use client'

import { use, useEffect, useState } from "react";
import styled from "styled-components";
import { getWorkOrderByFlowId } from "@/api/aceptarAuditoria";

import CorteComponentAcceptAuditory from "@/components/AceptarAuditoria/CorteComponent";
import ColorEdgeComponentAcceptAuditory from "@/components/AceptarAuditoria/ColorEdgeComponent";
import HotStampingComponentAcceptAuditory from "@/components/AceptarAuditoria/HotStampingComponent";
import MillingChipComponentAcceptAuditory from "@/components/AceptarAuditoria/MillingChipComponent";
import PersonalizacionComponentAcceptAuditory from "@/components/AceptarAuditoria/PersonalizacionComponent";


interface Props {
  params: Promise<{ id: string }>;
}

export default function AcceptWorkOrderFlowAuditoryPage({ params }: Props) {
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

  const renderComponentByArea = () => {
    switch (workOrder.area_id) {
      case 6:
      return <CorteComponentAcceptAuditory workOrder={workOrder}/>
      case 7:
      return <ColorEdgeComponentAcceptAuditory workOrder={workOrder}/>
      case 8:
      return <HotStampingComponentAcceptAuditory workOrder={workOrder}/>
      case 9:
      return <MillingChipComponentAcceptAuditory workOrder={workOrder}/>
      case 10:
      return <PersonalizacionComponentAcceptAuditory workOrder={workOrder}/>
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
  