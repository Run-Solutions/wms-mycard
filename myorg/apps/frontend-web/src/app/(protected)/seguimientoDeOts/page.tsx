// src/app/(protected)/seguimientoOts/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import WorkOrderTable from '../../../../../../libs/shared/components/WorkOrderTable';
import { fetchWorkOrdersInProgress } from '@/api/seguimientoDeOts';

// Se define el tipo de datos
interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  status: string;
  validated: boolean;
  createdAt: string;
  user: { username: string };
  flow: {
    area_id: number;
    status: string;
    area?: { name?: string };
  }[];
  files: File[];
}

interface File {
  id: number;
  type: string;
  file_path: string;
}

const SeguimientoDeOtsPage: React.FC = () => {
  // Para obtener Ordenes En Proceso
  const [WorkOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    async function fetchAllWorkOrdersInProgress(){
      try {
        const data = await fetchWorkOrdersInProgress();
        setWorkOrders(data);
      } catch (err) {
        console.error(err);
        console.error('Error en fetchWorkOrdersInProgress', err);
      }
    }
    fetchAllWorkOrdersInProgress();
  }, [])
  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Seguimiento de Ordenes de Trabajo</Title>
      </TitleWrapper>
      <WorkOrderTable orders={WorkOrders} title="Órdenes en Proceso" statusFilter="En proceso" />
    </PageContainer>
  );
};

export default SeguimientoDeOtsPage;

// =================== Styled Components ===================

const PageContainer = styled.div`
  padding: 20px 20px 20px 50px;
  margin-top: -70px;
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