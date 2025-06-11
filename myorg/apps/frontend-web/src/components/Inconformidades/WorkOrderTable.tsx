// myorg/apps/frontend-web/src/components/SeguimientoDeOts/WorkOrderTable.tsx

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styled, { useTheme } from 'styled-components';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton } from "@mui/material";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { getFileByName } from "@/api/seguimientoDeOts";

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
      order.status.toLowerCase() === statusFilter.toLowerCase() || 
      order.flow.some(flow => flow.status.toLowerCase() === statusFilter.toLowerCase())
    );

    validOrders.forEach(order => {
        order.flow?.forEach(flow => {
          console.log("status:", `"${flow.status}"`);
        });
      });

    const displayedOrders = expanded ? filteredOrders : filteredOrders.slice(0, 2);

  const downloadFile = async (filename: string) => {
    try {
      const arrayBuffer = await getFileByName(filename);
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error al abrir el archivo:', error);
    }
  };
    return (
      <TableContainer component={Paper} sx={{ backgroundColor: 'white', padding: '2rem', mt: 4, borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '100%', minWidth: '800px', marginX: 'auto' }}>     
          <Typography variant='h6' component='div' sx={{ p: 2, color:'black' }}>{title}</Typography>
          {filteredOrders.length === 0 ? (
            <Typography sx={{ p: 2, color:'black' }}>No hay órdenes para mostrar.</Typography>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <CustomTableCell>Id OT</CustomTableCell>
                    <CustomTableCell sx={{ maxWidth: 110, overflowX: 'hidden' }}>Id del presupuesto</CustomTableCell>
                    <CustomTableCell>Usuario</CustomTableCell>
                    <CustomTableCell>Área</CustomTableCell>
                    <CustomTableCell>Fecha</CustomTableCell>
                    <CustomTableCell>Archivos</CustomTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedOrders.map((orderFlow) => (
                    <TableRow key={orderFlow.id}>
                      <TableCell onClick={() => router.push(`/inconformidades/${orderFlow.ot_id}`)} sx={{ color: 'black', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        {orderFlow.ot_id}
                      </TableCell>
                      <CustomTableCell>{orderFlow.mycard_id}</CustomTableCell>
                      <CustomTableCell>{orderFlow.user?.username}</CustomTableCell>
                      <CustomTableCell sx={{ maxWidth: 900, overflowX: 'hidden' }}>
                        <Timeline>
                          {orderFlow.flow?.map((flowStep, index) => {
                            const isActive = ['proceso', 'inconformidad', 'listo'].some(word => flowStep.status?.toLowerCase().includes(word));
                            const isCompleted = flowStep.status?.toLowerCase().includes('completado');
                            const isLast = index === orderFlow.flow.length - 1;
                            return (
                              <TimelineItem key={index}>
                                <Circle $isActive={isActive} $isCompleted={isCompleted}>{index + 1}</Circle>
                                {!isLast && <Line $isLast={isLast} />}
                                <AreaName $isActive={isActive}>{flowStep.area?.name ?? 'Área desconocida'}</AreaName>
                              </TimelineItem>
                            );
                          })}
                        </Timeline>
                      </CustomTableCell>
                      <CustomTableCell>{new Date(orderFlow.createdAt).toLocaleDateString()}</CustomTableCell>
                      <CustomTableCell>
                        {orderFlow.files.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column',flexWrap: 'wrap', gap: '0.5rem' }}>
                            {orderFlow.files.map((file) => {
                              const fileName = file.file_path.toLowerCase();
                              const label = fileName.includes('ot')
                                ? 'Ver OT'
                                : fileName.includes('sku')
                                ? 'Ver SKU'
                                : fileName.includes('op')
                                ? 'Ver OP'
                                : 'Ver Archivo';
                              return (
                                <button
                                  key={file.file_path}
                                  onClick={() => downloadFile(file.file_path)}
                                  style={{
                                    border: '1px solid #c2c2c2',
                                    borderRadius: '20px',
                                    padding: '4px 12px',
                                    backgroundColor: '#f7f7f7',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    transition: 'all 0.2s ease-in-out',
                                  }}
                                  onMouseOver={(e) => {
                                    (e.target as HTMLButtonElement).style.backgroundColor = '#e0e0e0';
                                  }}
                                  onMouseOut={(e) => {
                                    (e.target as HTMLButtonElement).style.backgroundColor = '#f7f7f7';
                                  }}
                                >
                                {label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          'No hay archivos'
                        )}
                      </CustomTableCell>
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
  background-color: ${({ $isCompleted, $isActive }) => ($isCompleted ? '#22c55e' : $isActive ? 'red' : '#d1d5db')};
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: ${({ $isCompleted, $isActive }) => ($isCompleted ? '0 0 5px #22c55e' : $isActive ? '0 0 5px red' : 'none')};
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
  color: ${({ $isActive }) => ($isActive ? 'red' : '#6b7280')};
  text-align: center;
  max-width: 80px;
  text-transform: capitalize;
  transition: color 0.3s, font-weight 0.3s;
`;

const CustomTableCell = styled(TableCell)`
  color: black !important;
  font-size: 1rem;
`;
