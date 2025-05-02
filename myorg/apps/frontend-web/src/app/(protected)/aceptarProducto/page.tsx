// myorg/apps/frontend-web/src/app/(protected)/aceptarProducto/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { useRouter } from "next/navigation";

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
    priority: boolean;
    mycard_id: string;
    quantity: number;
    comments: string;
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
        id: number;
        name: string;
      }
    }[];
  };
  areaResponse: {
    id: number;
    prepress: {
      id: number;
      plates: number;
      positives: number;
      testType: string;
      comments: string;
    }
  };
}

const AcceptProductPage: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();

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

  const aceptarOT = async () => {
    console.log("Se hizo clic en Aceptar OT");
    const token = localStorage.getItem('token');
    //const flowId = selectedOrder?.workOrder.flow[0].id;
    const flowItem = selectedOrder?.workOrder.flow.find(
      (f) => f.area.id === selectedOrder.area_id
    );
    const flowId = flowItem?.id;
    console.log(flowId);
    if (!selectedOrder) return;
    // Si el área no es 1, redirigir inmediatamente
    if (selectedOrder?.area_id >= 2 && selectedOrder?.area_id <= 6) {
      router.push(`/aceptarProducto/${flowId}`); 
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/work-order-flow/${flowId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        closeModal();
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  }
  const downloadFile = async (filename: string) => {
    const token = localStorage.getItem('token');  
    const res = await fetch(`http://localhost:3000/work-order-flow/file/${filename}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error desde el backend:", errorText);
      throw new Error('Error al cargar el file');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Limpieza opcional después de unos segundos
    setTimeout(() => window.URL.revokeObjectURL(url), 5000);
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
        const res = await fetch('http://localhost:3000/work-order-flow/pending', {
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

        // Ordenar las OTs: primero las marcadas como prioridad, luego por fecha
        if (data && Array.isArray(data)){
          const sortedOrders = data.sort((a: WorkOrder, b: WorkOrder) => {
            // Si a es prioritario y b no, a va primero
            if (a.workOrder.priority && !b.workOrder.priority) return -1;
            // Si b es prioritario y a no, b va primero
            if (!a.workOrder.priority && b.workOrder.priority) return 1;
            // Si ambos tienen la misma prioridad, ordenar por fecha (más reciente primero)
            return new Date(a.workOrder.createdAt).getTime() - new Date(b.workOrder.createdAt).getTime();
          });
          setWorkOrders(sortedOrders);
        } else {
          setWorkOrders([]);
        }
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
          <ModalBody>
            <ModalInfo>
              <p><strong>Id del Presupuesto:</strong> {selectedOrder.workOrder.mycard_id}</p>
              <p><strong>Cantidad:</strong> {selectedOrder.workOrder.quantity}</p>
              <p><strong>Creado por:</strong> {selectedOrder.workOrder.user?.username}</p>
              <p><strong>Prioritario:</strong> {selectedOrder.workOrder.priority ? 'Sí' : 'No'}</p>
              <p><strong>Comentarios:</strong> {selectedOrder.workOrder.comments}</p>
              <p><strong>Archivos:</strong></p>
              <div style={{ display: 'flex', flexDirection: 'row',}}>
                {selectedOrder.workOrder.files.map((file) => (
                  <div key={file.file_path}>
                    <button onClick={() => downloadFile(file.file_path)}>
                      {file.file_path.toLowerCase().includes('ot') ? 'Ver OT' : 
                      file.file_path.toLowerCase().includes('sku') ? 'Ver SKU' : 
                      file.file_path.toLowerCase().includes('op') ? 'Ver OP' : 
                      'Ver Archivo'}
                    </button>
                  </div>
                ))}
              </div>
            </ModalInfo>
            <ModalFlow>
                <strong>Flujos:</strong>
                <Timeline>
                  {selectedOrder.workOrder.flow.map((f, index) => (
                    <TimelineItem key={index}>
                      <Circle>{index + 1}</Circle>
                      <AreaName>{f.area.name ?? 'Area Desconocida'}</AreaName>
                      {index < selectedOrder.workOrder.flow.length -1 && <Line/>}
                    </TimelineItem>
                  ))}
                </Timeline>
            </ModalFlow>
          </ModalBody>
          <button style={{ marginTop: '20px'}} onClick={closeModal}>Cerrar</button>
          <button style={{ marginTop: '20px'}} onClick={aceptarOT}>Aceptar OT</button>
        </ModalContent>
      </ModalOverlay>
    )}

    <PageContainer>
      <TitleWrapper>
        <Title theme={theme}>Órdenes de Trabajo Pendientes</Title>
      </TitleWrapper>
      <CardsContainer>
        {Array.isArray(WorkOrders) && WorkOrders.length > 0 ? (
          WorkOrders.map((order, index) => {
            console.log(`Orden ${index + 1}:`, order);
            const workOrder = order.workOrder;
            if(!workOrder) return null;
            return (
              <WorkOrderCard key={order.id} onClick={() => {
                console.log('Ha clickeado');
                handleCardClick(order);
                }}>
                <CardTitle>{workOrder.priority && <PriorityBadge />}{workOrder.ot_id}</CardTitle>
                <InfoItem>
                  <p>{workOrder.mycard_id}</p>
                  <p>Cantidad: {workOrder.quantity}</p>
                </InfoItem>
                <Info style={{ paddingTop: '10px' }}>Creado por: {workOrder.user.username}</Info>
                <Info>Fecha de creación: {new Date(workOrder.createdAt).toLocaleDateString()}</Info>
              </WorkOrderCard>
            );
          })
        ) : (
          <Message>No hay ordenes pendientes por asignar.</Message>
        )}
      </CardsContainer>
    </PageContainer>
    </>
  );
};

export default AcceptProductPage;

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
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    background-color: #F9FAFB;
    color: black;
    cursor: pointer;
    margin: 5px;
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
  }
`;

const ModalBody = styled.div`
  display: flex;
  gap: 40px;
  align-items: flex-start;
`;

const ModalFlow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const ModalInfo = styled.div`
  p {
    margin: 0.5rem 0;
  }
  width: 70%;
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 0.5rem 0;
`;

const TimelineItem = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 2rem;
  margin-bottom: 1rem;
`;

const Circle = styled.div`
  position: absolute;
  left: 0;
  width: 20px;
  height: 20px;
  background-color: #4a90e2;
  border-radius: 50%;
  color: white;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Line = styled.div`
  position: absolute;
  left: 9px;
  top: 20px;
  height: 30px;
  width: 2px;
  background-color: #4a90e2;
`;

const AreaName = styled.span`
  font-size: 1rem;
  font-weight: 500;
`;

const PriorityBadge = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  background-color: #FFD700;
  border-radius: 50%;
  margin-left: 8px;
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.7);
  position: relative;
  top: -4px;
  margin-right: 5px;
  
  /* Efecto de brillo opcional */
  &:after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 4px;
    height: 4px;
    background-color: white;
    border-radius: 50%;
    opacity: 0.8;
  }
`;

const Message = styled.p`
  color: ${({ theme }) => theme.palette.text.primary};
  font-size: 1rem;
  text-align: center;
  margin-top: 2rem;
`;
