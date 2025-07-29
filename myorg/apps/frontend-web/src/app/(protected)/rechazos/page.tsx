// myorg/apps/frontend-web/src/app/(protected)/rechazos/page.tsx
'use client';

import WorkOrderTable from '@/components/Rechazos/WorkOrderTable';
import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { getWorkOrdersWithInconformidadAuditory } from '@/api/rechazos';

// Se define el tipo de datos
interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  created_by: number;
  status: string; // Cambiado a string genérico
  validated: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
  };
  files: {
    id: number;
    type: string;
    file_path: string;
  }[];
  flow: {
    id: number;
    area_id: number; // Cambiado de area.name a area_id
    status: string; // Cambiado a string genérico
    assigned_user?: number;
    area?: {
      name?: string;
    };
    // otros campos que necesites
  }[];
  formAnswers?: any[]; // Añadir si es necesario
}

const InconformidadesPage: React.FC = () => {
  const [WorkOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  useEffect(() => {
    async function fetchAllWorkOrders() {
      try {
        const { pendingOrdersAuditory } =
          await getWorkOrdersWithInconformidadAuditory();
        console.log('Datos de Ordenes: ', pendingOrdersAuditory);

        // Extrae los workOrders de cada elemento
        if (pendingOrdersAuditory && Array.isArray(pendingOrdersAuditory)) {
          const workOrders = pendingOrdersAuditory.map((item: any) => item.workOrder);
          setWorkOrders(workOrders);
        } else {
          console.warn('pendingOrdersAuditory no está definido o no es un arreglo', pendingOrdersAuditory);
        }

      } catch (err) {
        console.error('Error en fetchAllWorkOrders', err);
      }
    }
    fetchAllWorkOrders();
  }, []);

  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Inconformidades</Title>
      </TitleWrapper>
      <WorkOrderTable
        orders={WorkOrders}
        title="Ordenes Devueltas por Inconformidad"
        statusFilter="En inconformidad auditoria"
      />
    </PageContainer>
  );
};

export default InconformidadesPage;

// =================== Styled Components ===================

const PageContainer = styled.div`
  padding: 1rem 2rem;
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
  color: ${({ theme }) => theme.palette.text.primary};
`;
