// myorg/apps/frontend-web/src/app/(protected)/cerrarOrdenDeTrabajo/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import WorkOrderTable from '../../../../../../libs/shared/components/WorkOrderTable';
import { fetchWorkOrdersInProgress } from '@/api/cerrarOrdenDeTrabajo';
// Se define el tipo de datos
interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  created_by: number;
  validated: boolean;
  createdAt: string;
  updatedAt: string;
  flow: {
    area: {
      name: string,
    }
    id: number;
    work_order_id: number;
    area_id: number;
    status: string;
    assigned_user: number | null;
    assigned_at: string | null;
    area_response_id: number | null;
    created_at: string;
    updated_at: string;
  }[];
  files: {
    file_path: string,
  }[],
}

const CloseWorkOrderPage: React.FC = () => {
  const [WorkOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  // Para obtener las ordenes que estan En auditoria
  useEffect (() => {
    async function fetchWorkOrdersInAuditory() {
      try {
        const data = await fetchWorkOrdersInProgress();
        console.log('Datos obtenidos de las Ordenes en Proceso: ', data);
        const orders = data.map((item: any) => item.workOrder); 
        console.log('Datos obtenidos de las Ordenes en Proceso: ', data);
        setWorkOrders(data);
      } catch (error) {
        console.error(error);
        console.error('Error en fetchWorkOrdersInAuditory', error);
      }
    }
    fetchWorkOrdersInAuditory();
  }, []);

  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Cerrar Ordenes de Trabajo</Title>
        <WorkOrderTable orders={WorkOrders} title="Órdenes en Auditoria" statusFilter="En auditoria" />
      </TitleWrapper>
      
    </PageContainer>
  );
};

export default CloseWorkOrderPage;

// =================== Styled Components ===================

const PageContainer = styled.div`
  padding: 1rem 2rem;
  margin-top: -70px;
  width: 100%;
  align-content: flex-start;
  justify-content: center;
`;

const TitleWrapper = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  filter: drop-shadow(4px 4px 5px rgba(0, 0, 0, 0.4));
`;

const Title = styled.h1<{ theme: any }>`
  font-size: 2rem;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.primary}
`;
