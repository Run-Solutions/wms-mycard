// myorg/apps/frontend-web/src/app/(protected)/liberarProducto/[id]/page.tsx
'use client'

import { use, useEffect, useState } from "react";
import styled from "styled-components";
import PrePrensaComponent from "@/components/LiberarProducto/PrePrensaComponent";

interface Props {
    params: Promise<{ id: string }>;
}

export default function LiberarProductoPage({ params }: Props) {
    const { id } = use(params);
    const [workOrder, setWorkOrder] = useState<any>(null)

    useEffect(() => {
        async function fetchWorkOrder() {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/free-order-flow/${id}`, {
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

    // Mostrar la liberacion del producto por area 
    const renderComponentByArea = () => {
      switch (workOrder.area_id) {
        case 1:
          return <PrePrensaComponent workOrder={workOrder}/>
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
  