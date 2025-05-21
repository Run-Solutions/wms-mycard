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
  const [activeArea, setActiveArea] = useState<string>("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    setPage(0);
  };
  
  const validOrders = Array.isArray(orders) ? orders : [];
  const filteredOrders = validOrders.filter(order =>
    (order.status.toLowerCase().includes(statusFilter.toLowerCase()) ||
    order.flow.some(flow => flow.status.toLowerCase().includes(statusFilter.toLowerCase())))
    && order.ot_id.toLowerCase().includes(searchValue.toLowerCase())
    && (
      !activeArea || order.flow.some(flow => flow.area?.name?.toLowerCase().includes(activeArea.toLowerCase()))
    )
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
        <Typography variant='h6' component='div' sx={{ p: 2, color:'black' }}>{title}</Typography>
        <TextField label="Buscar OT" variant="outlined" size="small" value={searchValue} onChange={handleSearchChange} sx={{ '& label': { color: 'black' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'black' }, '&:hover fieldset': { borderColor: 'black' }, '&.Mui-focused fieldset': { borderColor: 'black' }, color: 'black', }, }} />
        <TextField label="Filtrar por Área" variant="outlined" size="small" value={activeArea} onChange={(e) => setActiveArea(e.target.value)} sx={{ '& label': { color: 'black' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'black' }, '&:hover fieldset': { borderColor: 'black' }, '&.Mui-focused fieldset': { borderColor: 'black' }, color: 'black', }, }} />
        <Box display="flex" gap={2} flexWrap="wrap"  sx={{  }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CircleLegend style={{ backgroundColor: '#22c55e' }} />
            <Typography variant="body2" color="black">Completado</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <CircleLegend style={{ backgroundColor: '#facc15' }} />
            <Typography variant="body2" color="black">Enviado a CQM / En Calidad</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <CircleLegend style={{ backgroundColor: '#f5945c' }} />
            <Typography variant="body2" sx={{ color: 'black' }}>Parcial</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <CircleLegend style={{ backgroundColor: '#4a90e2' }} />
            <Typography variant="body2" color="black">En Proceso</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <CircleLegend style={{ backgroundColor: '#d1d5db' }} />
            <Typography variant="body2" color="black">Sin Estado</Typography>
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
                <CustomTableCell>Id OT</CustomTableCell>
                <CustomTableCell sx={{ maxWidth: 110, overflowX: 'hidden' }}>Id del presupuesto</CustomTableCell>
                <CustomTableCell sx={{ maxWidth: 5, overflowX: 'hidden' }}>Usuario</CustomTableCell>
                <CustomTableCell>Área</CustomTableCell>
                <CustomTableCell>Fecha</CustomTableCell>
                <CustomTableCell>Archivos</CustomTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.map((orderFlow) => (
                <TableRow key={orderFlow.id}>
                  <TableCell onClick={() => router.push(`/seguimientoDeOts/${orderFlow.ot_id}`)} sx={{ color: 'black', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    {orderFlow.ot_id}
                  </TableCell>
                  <CustomTableCell>{orderFlow.mycard_id}</CustomTableCell>
                  <CustomTableCell>{orderFlow.user?.username}</CustomTableCell>
                  <CustomTableCell>
                    <Timeline>
                      {orderFlow.flow?.map((flowStep, index) => {
                        const isActive = ['proceso'].some(word => flowStep.status?.toLowerCase().includes(word));
                        const isParcial = flowStep.status?.toLowerCase() === 'parcial';
                        const isCompleted = flowStep.status?.toLowerCase().includes('completado');
                        const isCalidad = ['calidad', 'cqm'].some(word => flowStep.status?.toLowerCase().includes(word));
                        const isLast = index === orderFlow.flow.length - 1;
                        return (
                          <TimelineItem key={index}>
                            <Circle $isActive={isActive} $isParcial={isParcial} $isCompleted={isCompleted} $isCalidad={isCalidad}>{index + 1}</Circle>
                            {!isLast && <Line $isLast={isLast} />}
                            <AreaName $isActive={isActive} $isParcial={isParcial} $isCalidad={isCalidad}>{flowStep.area?.name ?? 'Área desconocida'}</AreaName>
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
          <TablePagination component="div" count={filteredOrders.length} page={page} onPageChange={handleChangePage} rowsPerPage={itemsPerPage} rowsPerPageOptions={[itemsPerPage]} sx={{ color: 'black', '& .MuiTablePagination-toolbar': { color: 'black', }, '& .MuiTablePagination-selectLabel': { color: 'black', }, '& .MuiTablePagination-displayedRows': { color: 'black', }, '& .MuiSvgIcon-root': { color: 'black', }, }} />
        </>
      )}
    </TableContainer>
  );
};
export default WorkOrderTable;

// =================== Styled Components ===================
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
  shouldForwardProp: (prop) => !['$isActive', '$isCompleted', '$isCalidad', '$isParcial'].includes(prop),
})<StyledProps & { $isActive?: boolean; $isCompleted?: boolean; $isCalidad?: boolean; $isParcial?: boolean }>`
  width: 30px;
  height: 30px;
  background-color: ${({ $isCompleted, $isActive, $isCalidad, $isParcial }) => ($isCompleted ? '#22c55e' : $isCalidad ? '#facc15': $isActive ? '#4a90e2' : $isParcial ? '#f5945c' : '#d1d5db' )};
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: ${({ $isCompleted, $isActive, $isCalidad, $isParcial }) => ($isCompleted ? '0 0 5px #22c55e' : $isCalidad ? '0 0 5px #facc15' : $isActive ? '0 0 5px #4a90e2' : $isParcial ? ' 0 0 5px #f5945c' : 'none')};
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
})<StyledProps & { $isActive?: boolean; $isCompleted?: boolean; $isCalidad?: boolean; $isParcial?: boolean }>`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: ${({ $isActive }) => ($isActive ? 'bold' : 'normal')};
  color: ${({ $isCompleted, $isActive, $isCalidad, $isParcial }) => ($isCompleted ? '#22c55e' : $isCalidad ? '#facc15': $isActive ? '#4a90e2' : $isParcial ? '#f5945c' : '#6b7280')};
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

const CustomTableCell = styled(TableCell)`
  color: black !important;
  font-size: 1rem;
`;