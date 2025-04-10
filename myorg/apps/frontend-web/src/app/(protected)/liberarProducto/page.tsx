// myorg/apps/frontend-web/src/app/(protected)/liberarProducto/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography} from '@mui/material';

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
      }
      status: 'Pendiente' | 'En Proceso';
    }[];
  };
}

const FreeProductPage: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();

  // Para obtener Ordenes Pendientes
  const [WorkOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [message, setMessage] = useState('');

  const downloadFile = async (filename: string) => {
    const token = localStorage.getItem('token');  
    const res = await fetch(`http://localhost:3000/free-order-flow/file/${filename}`, {
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

  useEffect (() => {
    async function fetchWorkOrdersInProgress() {
      try {
        // Se verifica token
        const token = localStorage.getItem('token');
        if(!token) {
          console.error('No se encontró el token en localStorage');
          return;
        }
        console.log('Token enviado a headers: ', token)

        const res = await fetch('http://localhost:3000/free-order-flow/in-progress', {
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
        setWorkOrders(data);

      } catch (err) {
        console.error(err);
        console.error('Error en fetchWorkOrdersInProgress', err);
      }
    }
    fetchWorkOrdersInProgress();
  },[]);
  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Mis Ordenes</Title>
      </TitleWrapper>
      <TableContainer component={Paper} sx={{ backgroundColor: 'white', padding: '2rem', mt: 4, borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '90%', marginX: 'auto', }}>
        <Typography variant='h6' component='div' sx={{ p: 2 }}>
          Ordenes en Proceso
        </Typography>
        {message ? (
          <Typography sx={{ p: 2, color: 'red'}}> {message}</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Id OT</TableCell>
                <TableCell>Id del presupuesto</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Area</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Archivos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {WorkOrders.map((orderFlow) => (
                <TableRow key={orderFlow.id}>
                  <TableCell sx={{ width: '100px', overflowX: 'auto', cursor: 'pointer', '&:hover': {textDecoration: 'underline',}, }} onClick={() => router.push(`/liberarProducto/${orderFlow.workOrder.ot_id}`)}>{orderFlow.workOrder.ot_id}</TableCell>
                  <TableCell sx={{ width: '70px', overflowX: 'auto' }}>{orderFlow.workOrder.mycard_id}</TableCell>
                  <TableCell sx={{ width: '150px', overflowX: 'auto' }}>{orderFlow.workOrder.user?.username || 'Sin usuario'}</TableCell>
                  <TableCell sx={{ maxWidth: '250px', overflowX: 'auto', p: 0 }}>
                    <Timeline>
                      {orderFlow.workOrder.flow?.map((flowStep, index) => {
                        const isActive = flowStep.status?.toLowerCase().includes('proceso');
                        const isLast = index === orderFlow.workOrder.flow.length - 1;
                        return (
                          <TimelineItem key={index}>
                            <Circle $isActive={isActive}>{index + 1}</Circle>
                            {index < orderFlow.workOrder.flow.length -1 && <Line $isLast={isLast}/>}
                            <AreaName $isActive={isActive}>{flowStep.area.name ?? 'Area Desconocida'}</AreaName>
                          </TimelineItem>
                        );
                      })}
                    </Timeline>
                  </TableCell>
                  <TableCell sx={{ width: '150px', overflowX: 'auto' }}>{new Date(orderFlow.workOrder.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ width: '200px', overflowX: 'auto' }}>{orderFlow.workOrder.files.length > 0 ? (
                    orderFlow.workOrder.files.map((file) => (
                    <div key={file.file_path}>
                      <button onClick={() => downloadFile(file.file_path)}>
                        {file.file_path.toLowerCase().includes('ot') ? 'Ver OT' : 
                        file.file_path.toLowerCase().includes('sku') ? 'Ver SKU' : 
                        file.file_path.toLowerCase().includes('op') ? 'Ver OP' : 
                        'Ver Archivo'}
                      </button>
                    </div>
                    ))
                  ) : (
                    'No hay archivos'
                  )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </PageContainer>
  );
};

export default FreeProductPage;

// =================== Styled Components ===================

interface StyledProps {
  $isActive: boolean;
}

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

const Timeline = styled.div`
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  width: 100%;
  gap: 18px;
  box-sizing: border-box;
  margin-right:0;
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

