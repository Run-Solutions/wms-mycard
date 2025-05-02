// myorg/apps/frontend-web/src/app/(protected)/cerrarOrdenDeTrabajo/[id]/page.tsx
'use client'

import { use, useEffect, useState } from "react";
import styled from "styled-components";
import CorteComponent from "@/components/CerrarOrdenDeTrabajo/CorteComponent";
import ColorEdgeComponent from "@/components/CerrarOrdenDeTrabajo/ColorEdgeComponent";
import HotStampingComponent from "@/components/CerrarOrdenDeTrabajo/HotStampingComponent";
import MillingChipComponent from "@/components/CerrarOrdenDeTrabajo/MillingChipComponent";
import PersonalizacionComponent from "@/components/CerrarOrdenDeTrabajo/PersonalizacionComponent";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CloseWorkOrderAuxPage({ params }: Props) {
  const { id } = use(params);
  const [workOrder, setWorkOrder] = useState<any>(null)

  useEffect(() => {
    async function fetchWorkOrder() {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/free-work-order-auditory/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      console.log('Orden para cerrar orden de trabajo:', data)
      setWorkOrder(data)
    }
    fetchWorkOrder()
  }, [id])

  if (!workOrder) return <div>Cargando...</div>

  // Mostrar la liberacion del producto por area 
  const renderComponentByArea = () => {
    const flowEnAuditoria = workOrder.workOrder.flow.find((flow: any) => flow.status === 'En auditoria');
      console.log(flowEnAuditoria.area_id);
      switch (flowEnAuditoria.area_id) {
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
  padding: 1rem 2rem;
  margin-top: -80px;
  width: 100%;
  align-content: flex-start;
  justify-content: center;
`;
  