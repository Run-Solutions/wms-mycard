// myorg/apps/frontend-web/src/app/(protected)/recepcionCqm/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import WorkOrderTable from '@/components/RecepcionCqm/WorkOrderTable';

// Se define el tipo de datos
interface CQMWorkOrder {
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
      }
      status: 'Pendiente' | 'En Proceso' | 'En Calidad' ;
    }[];
  };
}

const RecepcionCQMPage: React.FC = () => {
  const theme = useTheme();

  // Para obtener Ordenes En Calidad
  const [CQMWorkOrders, setCQMWorkOrders] = useState<CQMWorkOrder[]>([]);

  // Cargar las OTs en calidad con reviewer logeado
  useEffect(() => {
    async function fetchWorkOrdersInCQM() {
      try {
        const token = localStorage.getItem('token');
        if(!token){
          console.error('No se encontró el token en localStorage');
          return;
        }
        const estados = ['En calidad'];
        const query = estados.map(estado => encodeURIComponent(estado)).join(',');
        const res = await fetch(`http://localhost:3000/free-order-cqm/in-progress?statuses=${query}`, {
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
