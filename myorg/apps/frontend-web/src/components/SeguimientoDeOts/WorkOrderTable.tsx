// myorg/apps/frontend-web/src/components/SeguimientoDeOts/WorkOrderTable.tsx

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styled, { useTheme } from 'styled-components';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton, TablePagination, TextField } from "@mui/material";

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

const itemsPerPage = 25;

const WorkOrderTable: React.FC<Props> = ({ orders, title, statusFilter}) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [page, setPage] = useState(0);
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    setPage(0);
  };
  
  const validOrders = Array.isArray(orders) ? orders : [];
  const filteredOrders = validOrders.filter(order =>
    (order.status.toLowerCase().includes(statusFilter.toLowerCase()) ||
    order.flow.some(flow => flow.status.toLowerCase().includes(statusFilter.toLowerCase())))
    && order.ot_id.toLowerCase().includes(searchValue.toLowerCase())
  );
  
  const paginatedOrders = filteredOrders.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };
  

  validOrders.forEach(order => {
    order.flow?.forEach(flow => {
      console.log("status:", `"${flow.status}"`);
    });
  });

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
        <TextField label='Buscar OT' variant="outlined" size="small" value={searchValue} onChange={handleSearchChange}/>
        <Box display="flex" gap={2} flexWrap="wrap"  sx={{  }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CircleLegend style={{ backgroundColor: '#22c55e' }} />
            <Typography variant="body2" color="text.secondary">Completado</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <CircleLegend style={{ backgroundColor: '#facc15' }} />
            <Typography variant="body2" color="text.secondary">Enviado a CQM</Typography>
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
        <Typography sx={{ p: 2, color: 'black' }}>No hay órdenes para mostrar.</Typography>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Id OT</TableCell>
                <TableCell sx={{ maxWidth: 110, overflowX: 'hidden' }}>Id del presupuesto</TableCell>
                <TableCell sx={{ maxWidth: 5, overflowX: 'hidden' }}>Usuario</TableCell>
                <TableCell sx={{ color: 'black' }}>Área</TableCell>
                <TableCell sx={{ color: 'black' }}>Fecha</TableCell>
                <TableCell sx={{ color: 'black' }}>Archivos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.map((orderFlow) => (
                <TableRow key={orderFlow.id}>
                  <TableCell onClick={() => router.push(`/seguimientoDeOts/${orderFlow.ot_id}`)} sx={{ color: 'black', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    {orderFlow.ot_id}
                  </TableCell>
                  <TableCell sx={{ color: 'black' }}>{orderFlow.mycard_id}</TableCell>
                  <TableCell sx={{ color: 'black' }}>{orderFlow.user?.username}</TableCell>
                  <TableCell sx={{ maxWidth: 900, overflowX: 'hidden' }}>
                    <Timeline>
                      {orderFlow.flow?.map((flowStep, index) => {
                        const isActive = ['proceso', 'listo'].some(word => flowStep.status?.toLowerCase().includes(word));
                        const isCompleted = flowStep.status?.toLowerCase().includes('completado');
                        const isCalidad = flowStep.status?.toLowerCase().includes('calidad');
                        const isLast = index === orderFlow.flow.length - 1;
                        return (
                          <TimelineItem key={index}>
                            <Circle $isActive={isActive} $isCompleted={isCompleted} $isCalidad={isCalidad}>{index + 1}</Circle>
                              {!isLast && <Line $isLast={isLast} />}
                            <AreaName $isActive={isActive} $isCalidad={isCalidad}>{flowStep.area?.name ?? 'Área desconocida'}</AreaName>
                          </TimelineItem>
                        );
                      })}
                    </Timeline>
                  </TableCell>
                  <TableCell sx={{ color: 'black' }}>{new Date(orderFlow.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ color: 'black' }}>
                      {orderFlow.files.length > 0 ? (
                        orderFlow.files.map((file) => (
                          <div key={file.file_path}>
                            <button onClick={() => downloadFile(file.file_path)} style={{ color: 'black' }}>
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
          <TablePagination component='div' count={filteredOrders.length} page={page} onPageChange={handleChangePage} rowsPerPage={itemsPerPage} rowsPerPageOptions={[itemsPerPage]}/>
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