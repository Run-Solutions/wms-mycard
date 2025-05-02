// myorg/apps/frontend-web/src/app/(protected)/inconformidades/page.tsx
'use client';

import WorkOrderTable from '@/components/Inconformidades/WorkOrderTable';
import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';

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
    username: string
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
    }
    // otros campos que necesites
  }[];
  formAnswers?: any[]; // Añadir si es necesario
}

const InconformidadesPage: React.FC = () => {
  const [WorkOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  useEffect(() => {
    async function fetchAllWorkOrders() {
      try {
        const token = localStorage.getItem('token');
        if(!token){
          console.error('No se encontro el token en el localStorage');
          return;
        }
        const estados = ['En inconformidad', 'En inconformidad CQM']
        const query = estados.map(estado => encodeURIComponent(estado)).join(',');
        const res = await fetch(`http://localhost:3000/work-order-flow/inconformidad?statuses=${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        if(!res.ok){
          throw new Error(`Error al obtener las ordenes: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log('Datos de Ordenes: ', data);
        if (!Array.isArray(data)) {
          return;
        }
        const workOrders = data.map((item: any) => item.workOrder);
        setWorkOrders(workOrders);
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
        <Title>Inconformidades</Title>
      </TitleWrapper>
      <WorkOrderTable orders={WorkOrders} title='Ordenes Devueltas por Inconformidad' statusFilter='En inconformidad'/>
      <WorkOrderTable orders={WorkOrders} title='Ordenes Devueltas por Inconformidad En Calidad' statusFilter='En inconformidad CQM'/>
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
  color: ${({ theme }) => theme.palette.text.primary}
`;
