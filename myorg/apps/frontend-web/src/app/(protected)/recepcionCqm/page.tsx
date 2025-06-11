// myorg/apps/frontend-web/src/app/(protected)/recepcionCqm/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import WorkOrderTable from '@/components/RecepcionCqm/WorkOrderTable';
import { getOrdersInCalidad } from '@/api/recepcionCQM';

// Se define el tipo de datos
interface File {
  id: number;
  type: string;
  file_path: string;
}

interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  status: string;
  validated: boolean;
  createdAt: string;
  user: {
    username: string;
  };
  flow: {
    area_id: number;
    status: string;
    area?: { name?: string };
  }[];
  files: File[];
}

const RecepcionCQMPage: React.FC = () => {
  const theme = useTheme();

  // Para obtener Ordenes En Calidad
  const [CQMWorkOrders, setCQMWorkOrders] = useState<WorkOrder[]>([]);

  // Cargar las OTs en calidad con reviewer logeado
  useEffect(() => {
    async function fetchWorkOrdersInCQM() {
      try {
        const data = await getOrdersInCalidad();
        console.log('Datos obtenidos de las Ordenes en Calidad: ', data);
        setCQMWorkOrders(data);
      } catch (error) {
        console.error(error);
        console.error('Error en fetchWorkOrdersInCQM', error);
      }
    }
    fetchWorkOrdersInCQM();
  }, []);

  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Recepcion CQM</Title>
      </TitleWrapper>
      <WorkOrderTable orders={CQMWorkOrders} title="Órdenes en Calidad" statusFilter="En calidad" />
    </PageContainer>
  );
};

export default RecepcionCQMPage;

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
