// src/app/(protected)/ordenesDeTrabajo/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';

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
      area: {
        name: string;
      }
    }[];
  };
}


const UsersPage: React.FC = () => {
  const theme = useTheme();

  // Para obtener Ordenes Pendientes
  const [WorkOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  // Para mostar toda la información de la OT
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (order: WorkOrder) => {
    console.log("Clic en OT:", order.workOrder.ot_id);
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  }

  useEffect(() => {
    async function fetchWorkOrders() {
      try {
        // Se verifica token
        const token = localStorage.getItem('token');
        if(!token) {
          console.error('No se encontró el token en localStorage');
          return;
        }
        console.log('Token enviado a headers: ', token)
  
        const res = await fetch('http://localhost:3000/work-orders/pending', {
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
        console.log('Datos obtenidos: ', data);
        setWorkOrders(data);

        
      } catch (err) {
        console.error(err);
        console.error('Error en fetchWorkOrders:', err);
      }
    }
    fetchWorkOrders();
  }, []);
  return (
    <>
    {isModalOpen && selectedOrder && (
      <ModalOverlay onClick={closeModal}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <h2>Orden: {selectedOrder.workOrder.ot_id}</h2>
          <p><strong>MyCard:</strong> {selectedOrder.workOrder.mycard_id}</p>
          <p><strong>Cantidad:</strong> {selectedOrder.workOrder.quantity}</p>
          <p><strong>Creado por:</strong> {selectedOrder.workOrder.user?.username}</p>
          <p><strong>Validado:</strong> {selectedOrder.workOrder.validated ? 'Sí' : 'No'}</p>
          <p><strong>Flujos:</strong> {selectedOrder.workOrder.flow.map(f => f.area?.name ?? 'Area Desconocida').join(', ')}</p>
          <p><strong>Archivos:</strong> {selectedOrder.workOrder.files.length}</p>
          <button onClick={closeModal}>Cerrar</button>
        </ModalContent>
      </ModalOverlay>
    )}

    <PageContainer>
      <TitleWrapper>
        <Title theme={theme}>Órdenes de Trabajo Pendientes</Title>
      </TitleWrapper>
      <CardsContainer>
        {WorkOrders.map((order, index) => {
          console.log(`Orden ${index + 1}:`, order);
          const workOrder = order.workOrder;
          if(!workOrder) return null;
          console.log('workOrder encontrado:', order.workOrder);
          return (
            <WorkOrderCard key={order.id} onClick={() => {
              console.log('Ha clickeado');
              handleCardClick(order);
              }}>
              <CardTitle>{workOrder.ot_id}</CardTitle>
              <InfoItem>
                <p>{workOrder.mycard_id}</p>
                <p>Cantidad: {workOrder.quantity}</p>
              </InfoItem>
              <Info style={{ paddingTop: '10px' }}>Creado por: {workOrder.user.username}</Info>
              <Info>Fecha de creación: {new Date(workOrder.createdAt).toLocaleDateString()}</Info>
            </WorkOrderCard>
          );
        })}
      </CardsContainer>
    </PageContainer>
    </>
  );
};

export default UsersPage;

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
  color: ${({ theme }) => theme.palette.text.primary};
`;

const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
`;

const WorkOrderCard = styled.div`
  padding: 10px 20px 20px;
  border-radius: 2rem;
  border: 2px solid #aeadab;
  width: 350px;
  outline: none;
  color: white;
  background-color: ${(props) => props.theme.palette.primary.main};
  cursor: pointer;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s cubic-bezier(0.25, 0.01, 0.25, 1), 
              color 0.3s cubic-bezier(0.25, 0.01, 0.25, 1), 
              background 0.2s cubic-bezier(0.25, 0.01, 0.25, 1);

  &::placeholder {
    color: #aaa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  &:hover,
  &:focus {
    border-color: #05060f;
  }
`;

const CardTitle = styled.div`
  font-size: 2rem;
  font-weight: 600;
  padding: 10px 0 10px 0;
  background-color: transparent;
  width: 245px;
  perspective: 1000px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  &:hover .flip-card-inner {
    transform: rotateY(180deg);
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: 6rem;
  font-size: 1.3rem;
  font-weight: 600;
  color: white;
  margin: 0.2rem 0;
`;

const Info = styled.div`
  color: white;
  margin: 0.2rem 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const ModalContent = styled.div`
  background-color: white;
  color: black;
  padding: 2rem;
  border-radius: 1rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);

  h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
  }

  p {
    margin: 0.5rem 0;
  }

  button {
    margin-top: 1.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    background-color: #4a90e2;
    color: white;
    cursor: pointer;
  }
`;

