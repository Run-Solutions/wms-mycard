// myorg/apps/frontend-web/src/app/(protected)/finalizacion/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import WorkOrderTable from '@/components/Finalizacion/WorkOrderTable';

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

const FinalizacionPage: React.FC = () => {
  // Para obtener Ordenes en Listo
  const [WorkOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    async function fetchAllWorkOrders() {
      try {
        const token = localStorage.getItem('token');
        if(!token){
          console.error('No se encontro el token en el localStorage');
          return;
        }
        const estados = ['Listo', 'Cerrado']
        const query = estados.map(estado => encodeURIComponent(estado)).join(',');
        const res = await fetch(`http://localhost:3000/work-orders/in-progress?statuses=${query}`, {
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
        setWorkOrders(data);
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