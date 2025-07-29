// myorg/apps/frontend-web/src/app/(protected)/liberarProducto/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { useRouter } from 'next/navigation';
import WorkOrderTable from '@/components/LiberarProducto/WorkOrderTable';
import { fetchWorkOrdersInProgress } from '@/api/liberarProducto';

// Se define el tipo de datos
interface WorkOrder {
  id: number;
  work_order_id: number;
  area_id: number;
  status: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  workOrder: {
    id: number;
    ot_id: string;
    mycard_id: string;
    quantity: number;
    created_by: number;
    validated: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
      id: number;
      username: string;
    };
    files: {
      id: number;
      type: string;
      file_path: string;
    }[];
    flow: {
      id: number;
      area: {
        name: string;
      };
      status: 'Pendiente' | 'En Proceso';
    }[];
  };
}

const FreeProductPage: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();

  // Para obtener Ordenes En Proceso
  const [WorkOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [currentAreaId, setCurrentAreaId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchWorkOrders() {
      try {
        const data = await fetchWorkOrdersInProgress();
        setWorkOrders(data);
      } catch (err) {
        console.error(err);
        console.error('Error en fetchWorkOrdersInProgress', err);
      }
    }
    fetchWorkOrders();
  }, []);

  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Mis Ordenes</Title>
      </TitleWrapper>
      <WorkOrderTable
        orders={WorkOrders}
        title="Órdenes en Proceso"
        statusFilter={[
          'En Proceso',
          'Enviado a CQM',
          'En Calidad',
          'Parcial',
          'En inconformidad auditoria',
        ]}
      />
      {currentAreaId !== 1 && (
        <>
          <WorkOrderTable
            orders={WorkOrders}
            title="Órdenes por Liberar"
            statusFilter={['Listo', 'Parcial']}
          />
        </>
      )}
    </PageContainer>
  );
};

export default FreeProductPage;

// =================== Styled Components ===================

interface StyledProps {
  $isActive: boolean;
}

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
  color: ${({ theme }) => theme.palette.text.primary};
`;