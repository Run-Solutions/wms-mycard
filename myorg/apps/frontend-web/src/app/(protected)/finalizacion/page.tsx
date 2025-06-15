// myorg/apps/frontend-web/src/app/(protected)/finalizacion/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import WorkOrderTable from '../../../../../../libs/shared/components/WorkOrderTable';
import { getWorkOrders } from '@/api/finalizacion';

// Se define el tipo de datos
interface File {
  id: number;
  type: string;
  file_path: string;
}

interface Flow {
  id: number;
  area_id: number;
  status: string;
  assigned_user?: number;
  area?: {
    name?: string;
  };
}

interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  created_by: number;
  status: string;
  validated: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
  };
  files: File[];
  flow: Flow[];
  formAnswers?: any[];
}

const FinalizacionPage: React.FC = () => {
  // Para obtener Ordenes en Listo
  const [WorkOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    async function fetchAllWorkOrders() {
      try {
        const res = await getWorkOrders();
        setWorkOrders(res);
      } catch (err) {
        console.error(err);
        console.error('Error en fetchAllWorkOrders', err);
      }
    }
    fetchAllWorkOrders();
  }, []);

  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Finalización</Title>
      </TitleWrapper>
      <WorkOrderTable orders={WorkOrders} title='Ordenes Pendientes por Cerrar' statusFilter='Listo'/>
      <WorkOrderTable orders={WorkOrders} title='Ordenes Cerradas' statusFilter='Cerrado'/>
    </PageContainer>
  );
};

export default FinalizacionPage;

// =================== Styled Components ===================

const PageContainer = styled.div`
  padding: 20px 20px 20px 50px;
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