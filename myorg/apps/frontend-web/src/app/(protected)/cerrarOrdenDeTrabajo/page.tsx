// myorg/apps/frontend-web/src/app/(protected)/cerrarOrdenDeTrabajo/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import WorkOrderTable from '@/components/CerrarOrdenDeTrabajo/WorkOrderTable';

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
        const token = localStorage.getItem('token');
        if(!token){
          console.error('No hay token');
          return;
        }
        const estados = ['En auditoria']
        const query = estados.map(estado => encodeURIComponent(estado)).join(',');

        const res = await fetch(`http://localhost:3000/free-work-order-auditory/in-auditory?statuses=${query}`, {
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

const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
`;

const UserCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FlipCard = styled.div`
  background-color: transparent;
  width: 245px;
  height: 270px;
  perspective: 1000px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  cursor: pointer;

  &:hover .flip-card-inner {
    transform: rotateY(180deg);
  }
`;

const FlipCardInner = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
`;

interface FlipCardSideProps {
  theme: any;
}

const FlipCardFront = styled.div<FlipCardSideProps>`
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 5px;
  border-radius: 2em;
  backface-visibility: hidden;
  background-color: ${props => props.theme.palette.primary.main};
  border: 4px solid ${props => props.theme.palette.secondary.main};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ProfileImage = styled.img`
  border-radius: 50%;
  width: 120px;
  height: 120px;
  object-fit: cover;
  margin-bottom: 1rem;
`;

const UserName = styled.div<{ theme: any }>`
  font-size: 22px;
  color: ${props => props.theme.palette.secondary.main};
  font-weight: bold;
  text-transform: uppercase;
`;

const FlipCardBack = styled.div<FlipCardSideProps>`
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 5px;
  border-radius: 2em;
  backface-visibility: hidden;
  background-color: ${props => props.theme.palette.primary.main};
  border: 4px solid ${props => props.theme.palette.secondary.main};
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const InfoItem = styled.div`
  font-size: 14px;
  color: white;
  margin: 0.2rem 0;
`;

const CardActions = styled.div`
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 1em;
  cursor: pointer;
  background-color: ${props => props.theme.palette.secondary.main};
  color: white;
  font-weight: bold;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${props => props.theme.palette.secondary.dark || '#000'};
  }
`;
