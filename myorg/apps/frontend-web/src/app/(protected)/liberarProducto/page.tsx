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
        statusFilter={['En Proceso', 'Enviado a CQM', 'En Calidad', 'Parcial']}
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

const Timeline = styled.div`
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  width: 100%;
  gap: 18px;
  box-sizing: border-box;
  margin-right: 0;
`;

const TimelineItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-width: 65px;

  &:last-child {
    margin-right: 0;
  }
`;

const Circle = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$isActive',
})<StyledProps>`
  width: 30px;
  height: 30px;
  background-color: ${({ $isActive }) => ($isActive ? '#4a90e2' : '#d1d5db')};
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: ${({ $isActive }) => ($isActive ? '0 0 5px #4a90e2' : 'none')};
  transition: background-color 0.3s, box-shadow 0.3s;
`;

const Line = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$isLast',
})<{ $isLast: boolean }>`
  position: absolute;
  top: 14px;
  left: 50%;
  height: 2px;
  width: 80px;
  background-color: #d1d5db;
  z-index: 0;
  display: ${({ $isLast }) => ($isLast ? 'none' : 'block')};
`;

const AreaName = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== '$isActive',
})<StyledProps>`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: ${({ $isActive }) => ($isActive ? 'bold' : 'normal')};
  color: ${({ $isActive }) => ($isActive ? '#4a90e2' : '#6b7280')};
  text-align: center;
  max-width: 80px;
  text-transform: capitalize;
  transition: color 0.3s, font-weight 0.3s;
`;
