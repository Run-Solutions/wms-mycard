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
      status: 'Pendiente' | 'En Proceso' | 'En Calidad' ;
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
        <TableContainer component={Paper} sx={{ backgroundColor: 'white', padding: '2rem', mt: 4, borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '100%', minWidth: '800px', marginX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px'}}>
                    <Typography variant='h6' component='div' sx={{ p: 2, color: 'black' }}>{title}</Typography>
                    <Box display="flex" gap={2} flexWrap="wrap"  sx={{  }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircleLegend style={{ backgroundColor: '#22c55e' }} />
                        <Typography variant="body2" color="text.secondary">Completado</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircleLegend style={{ backgroundColor: '#facc15' }} />
                        <Typography variant="body2" color="text.secondary">En calidad</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircleLegend style={{ backgroundColor: '#4a90e2' }} />
                        <Typography variant="body2" color="text.secondary">En Proceso / Calidad</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircleLegend style={{ backgroundColor: '#d1d5db' }} />
                        <Typography variant="body2" color="text.secondary">Sin Estado</Typography>
                      </Box>
                    </Box>
                    </div>
          
          {filteredOrders.length === 0 ? (
            <Typography sx={{ p: 2, color:'black' }}>No hay órdenes para mostrar.</Typography>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'black' }}>Id OT</TableCell>
                    <TableCell sx={{ color: 'black', maxWidth: 110 }}>Id del presupuesto</TableCell>
                    <TableCell sx={{ color: 'black' }}>Usuario</TableCell>
                    <TableCell sx={{ color: 'black' }}>Área</TableCell>
                    <TableCell sx={{ color: 'black' }}>Fecha</TableCell>
                    <TableCell sx={{ color: 'black' }}>Archivos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((orderFlow) => (
                    <TableRow key={orderFlow.id}>
                      <TableCell onClick={() => router.push(`/recepcionCqm/${orderFlow.workOrder.ot_id}`)} sx={{ color: 'black', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        {orderFlow.workOrder.ot_id}
                      </TableCell>
                      <TableCell sx={{ color: 'black' }}>{orderFlow.workOrder.mycard_id}</TableCell>
                      <TableCell sx={{ color: 'black' }}>{orderFlow.workOrder.user?.username || 'Sin usuario'}</TableCell>
                      <TableCell sx={{ maxWidth: 900, overflowX: 'hidden' }}>
                        <Timeline>
                          {orderFlow.workOrder.flow?.map((flowStep, index) => {
                            const isActive = ['proceso', 'calidad'].some(word => flowStep.status?.toLowerCase().includes(word));
                            const isCompleted = flowStep.status?.toLowerCase().includes('completado');
                            const isCalidad = flowStep.status?.toLowerCase().includes('calidad');
                            const isLast = index === orderFlow.workOrder.flow.length - 1;
                            return (
                              <TimelineItem key={index}>
                                <Circle $isActive={isActive} $isCompleted={isCompleted} $isCalidad={isCalidad}>{index + 1}</Circle>
                                {!isLast && <Line $isLast={isLast} />}
                                <AreaName $isActive={isActive} $isCompleted={isCompleted} $isCalidad={isCalidad}>{flowStep.area.name ?? 'Área desconocida'}</AreaName>
                              </TimelineItem>
                            );
                          })}
                        </Timeline>
                      </TableCell>
                      <TableCell sx={{ color: 'black' }}>{new Date(orderFlow.workOrder.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ color: 'black' }}>
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
  shouldForwardProp: (prop) => !['$isActive', '$isCompleted', '$isCalidad'].includes(prop),
})<StyledProps & { $isActive?: boolean; $isCompleted?: boolean; $isCalidad?: boolean }>`
  width: 30px;
  height: 30px;
  background-color: ${({ $isCompleted, $isActive, $isCalidad }) => ($isCompleted ? '#22c55e' : $isCalidad ? '#facc15': $isActive ? '#4a90e2' : '#d1d5db' )};
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: ${({ $isCompleted, $isActive, $isCalidad }) => ($isCompleted ? '0 0 5px #22c55e' : $isCalidad ? '0 0 5px #facc15' : $isActive ? '0 0 5px #4a90e2' : 'none')};
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
})<StyledProps & { $isActive?: boolean; $isCompleted?: boolean; $isCalidad?: boolean }>`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: ${({ $isActive }) => ($isActive ? 'bold' : 'normal')};
  color: ${({ $isCompleted, $isActive, $isCalidad }) => ($isCompleted ? '#22c55e' : $isCalidad ? '#facc15': $isActive ? '#4a90e2' : '#6b7280')};
  text-align: center;
  max-width: 80px;
  text-transform: capitalize;
  transition: color 0.3s, font-weight 0.3s;
`;

const CircleLegend = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 0 2px rgba(0,0,0,0.3);
`;