// myorg/apps/frontend-web/src/components/LiberarProducto/WorkOrderTable.tsx

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styled, { useTheme } from 'styled-components';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton } from "@mui/material";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

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
      status: 'Pendiente' | 'En Proceso' | 'En Calidad'| 'Listo' ;
    }[];
  };
}
interface Props {
    orders: WorkOrder[];
    title: string;
    statusFilter: string;
}

const WorkOrderTable: React.FC<Props> = ({ orders, title, statusFilter}) => {
    const [expanded, setExpanded] = useState(false);
    const router = useRouter();

    const validOrders = Array.isArray(orders) ? orders : [];
    const filteredOrders = validOrders.filter(order =>
        order.workOrder.flow.some(flow => flow.status.toLowerCase().includes(statusFilter.toLowerCase()))
    );

    validOrders.forEach(order => {
        order.workOrder.flow?.forEach(flow => {
          console.log("status:", `"${flow.status}"`);
        });
      });

    const displayedOrders = expanded ? filteredOrders : filteredOrders.slice(0, 2);

    const downloadFile = async (filename: string) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/free-order-flow/file/${filename}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if(!res.ok) {
            const errorText = await res.text();
            console.error('❌ Error desde el backend', errorText);
            throw new Error('Error al cargar el file');
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');

        // Limpieza opcional después de unos segundos
        setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    }
    return (
        <TableContainer component={Paper} sx={{ backgroundColor: 'white', padding: '2rem', mt: 4, borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '90%', marginX: 'auto' }}>
          <Typography variant='h6' component='div' sx={{ p: 2 }}>{title}</Typography>
          {filteredOrders.length === 0 ? (
            <Typography sx={{ p: 2 }}>No hay órdenes para mostrar.</Typography>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Id OT</TableCell>
                    <TableCell>Id del presupuesto</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Área</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Archivos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedOrders.map((orderFlow) => (
                    <TableRow key={orderFlow.id}>
                      <TableCell onClick={() => router.push(`/liberarProducto/${orderFlow.workOrder.ot_id}`)} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        {orderFlow.workOrder.ot_id}
                      </TableCell>
                      <TableCell>{orderFlow.workOrder.mycard_id}</TableCell>
                      <TableCell>{orderFlow.workOrder.user?.username || 'Sin usuario'}</TableCell>
                      <TableCell>
                        <Timeline>
                          {orderFlow.workOrder.flow?.map((flowStep, index) => {
                            const isActive = ['proceso', 'calidad', 'listo'].some(word => flowStep.status?.toLowerCase().includes(word));
                            const isCompleted = flowStep.status?.toLowerCase().includes('completado');
                            const isLast = index === orderFlow.workOrder.flow.length - 1;
                            return (
                              <TimelineItem key={index}>
                                <Circle $isActive={isActive} $isCompleted={isCompleted}>{index + 1}</Circle>
                                {!isLast && <Line $isLast={isLast} />}
                                <AreaName $isActive={isActive}>{flowStep.area.name ?? 'Área desconocida'}</AreaName>
                              </TimelineItem>
                            );
                          })}
                        </Timeline>
                      </TableCell>
                      <TableCell>{new Date(orderFlow.workOrder.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {orderFlow.workOrder.files.length > 0 ? (
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
                        ) : 'No hay archivos'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredOrders.length > 2 && (
                <Box display="flex" justifyContent="center" mt={2}>
                <IconButton onClick={() => setExpanded(!expanded)}>
                  {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
              </Box>
              )}
            </>
          )}
        </TableContainer>
      );
};
export default WorkOrderTable;

interface StyledProps {
    $isActive: boolean;
}

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
  shouldForwardProp: (prop) => !['$isActive', '$isCompleted'].includes(prop),
})<StyledProps & { $isCompleted?: boolean }>`
  width: 30px;
  height: 30px;
  background-color: ${({ $isCompleted, $isActive }) => ($isCompleted ? '#22c55e' : $isActive ? '#4a90e2' : '#d1d5db')};
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: ${({ $isCompleted, $isActive }) => ($isCompleted ? '0 0 5px #22c55e' : $isActive ? '0 0 5px #4a90e2' : 'none')};
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