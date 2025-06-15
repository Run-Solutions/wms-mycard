import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  TextField,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { getFileByName } from '../../../apps/frontend-web/src/api/seguimientoDeOts';

interface Column {
  header: string;
  render: (order: any) => React.ReactNode;
}

interface Props {
  orders: any[];
  title: string;
  statusFilter: string | string[];
  basePath: string;
  columns?: Column[];
}

const defaultColumns: Column[] = [
  {
    header: 'Id OT',
    render: (order) => order.workOrder?.ot_id ?? order.ot_id,
  },
  {
    header: 'Id del presupuesto',
    render: (order) => order.workOrder?.mycard_id ?? order.mycard_id,
  },
  {
    header: 'Usuario',
    render: (order) => order.workOrder?.user?.username ?? order.user?.username,
  },
  {
    header: 'Área',
    render: () => null,
  },
  {
    header: 'Fecha',
    render: (order) => new Date((order.workOrder?.createdAt ?? order.createdAt) as string).toLocaleDateString(),
  },
  {
    header: 'Archivos',
    render: () => null,
  },
];

const WorkOrderTable: React.FC<Props> = ({ orders, title, statusFilter, basePath, columns = defaultColumns }) => {
  const [searchValue, setSearchValue] = useState('');
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const validOrders = Array.isArray(orders) ? orders : [];
  const filterStatuses = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
  const filteredOrders = validOrders.filter((order) => {
    const data = order.workOrder ?? order;
    return (
      data.flow?.some((flow: any) =>
        filterStatuses.some((status) => flow.status.toLowerCase().includes(status.toLowerCase()))
      ) &&
      (data.ot_id ?? '').toLowerCase().includes(searchValue.toLowerCase())
    );
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px' }}>
        <Typography variant="h6" component="div" sx={{ p: 2, color: 'black' }}>{title}</Typography>
        <TextField label="Buscar OT" variant="outlined" size="small" value={searchValue} onChange={handleSearchChange} sx={{ '& label': { color: 'black' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'black' }, '&:hover fieldset': { borderColor: 'black' }, '&.Mui-focused fieldset': { borderColor: 'black' }, color: 'black', }, }} />
        <Box display="flex" gap={2} flexWrap="wrap" >
          <Box display="flex" alignItems="center" gap={1}>
            <CircleLegend style={{ backgroundColor: '#22c55e' }} />
            <Typography variant="body2" sx={{ color: 'black' }}>Completado</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <CircleLegend style={{ backgroundColor: '#facc15' }} />
            <Typography variant="body2" sx={{ color: 'black' }}>Enviado a CQM / En Calidad</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <CircleLegend style={{ backgroundColor: '#f5945c' }} />
            <Typography variant="body2" sx={{ color: 'black' }}>Parcial</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <CircleLegend style={{ backgroundColor: '#4a90e2' }} />
            <Typography variant="body2" sx={{ color: 'black' }}>En Proceso / Listo</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <CircleLegend style={{ backgroundColor: '#d1d5db' }} />
            <Typography variant="body2" sx={{ color: 'black' }}>Sin Estado</Typography>
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
                {columns.map((col, idx) => (
                  <CustomTableCell key={idx}>{col.header}</CustomTableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedOrders.map((orderFlow) => {
                const data = orderFlow.workOrder ?? orderFlow;
                return (
                  <TableRow key={orderFlow.id}>
                    <TableCell onClick={() => router.push(`${basePath}/${data.ot_id}`)} sx={{ color: 'black', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {data.ot_id}
                    </TableCell>
                    <CustomTableCell>{data.mycard_id}</CustomTableCell>
                    <CustomTableCell>{data.user?.username || 'Sin usuario'}</CustomTableCell>
                    <CustomTableCell sx={{ maxWidth: 900, overflowX: 'hidden' }}>
                      <Timeline>
                        {data.flow?.map((flowStep: any, index: number) => {
                          const isActive = ['proceso', 'listo'].some((word) => flowStep.status?.toLowerCase().includes(word));
                          const isParcial = ['parcial'].some((word) => flowStep.status?.toLowerCase().includes(word));
                          const isCompleted = flowStep.status?.toLowerCase().includes('completado');
                          const isCalidad = ['enviado a cqm', 'en calidad'].some((status) => flowStep.status?.toLowerCase().includes(status));
                          const isLast = index === data.flow.length - 1;
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
                    <CustomTableCell>{new Date(data.createdAt).toLocaleDateString()}</CustomTableCell>
                    <CustomTableCell>
                      {data.files?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {data.files.map((file: any) => {
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
                );
              })}
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
  margin-right: 0;
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
  background-color: ${({ $isCompleted, $isActive, $isCalidad, $isParcial }) =>
    $isCompleted
      ? '#22c55e'
      : $isCalidad
      ? '#facc15'
      : $isActive
      ? '#4a90e2'
      : $isParcial
      ? '#f5945c'
      : '#d1d5db'};
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: ${({ $isCompleted, $isActive, $isCalidad, $isParcial }) =>
    $isCompleted
      ? '0 0 5px #22c55e'
      : $isCalidad
      ? '0 0 5px #facc15'
      : $isActive
      ? '0 0 5px #4a90e2'
      : $isParcial
      ? ' 0 0 5px #f5945c'
      : 'none'};
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
  color: ${({ $isCompleted, $isActive, $isCalidad, $isParcial }) =>
    $isCompleted
      ? '#22c55e'
      : $isCalidad
      ? '#facc15'
      : $isActive
      ? '#4a90e2'
      : $isParcial
      ? '#f5945c'
      : '#6b7280'};
  text-align: center;
  max-width: 80px;
  text-transform: capitalize;
  transition: color 0.3s, font-weight 0.3s;
`;

const CircleLegend = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
`;

const CustomTableCell = styled(TableCell)`
  color: black !important;
  font-size: 1rem;
`;
