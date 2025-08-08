// myorg/apps/frontend-web/src/components/SeguimientoDeOts/WorkOrderTable.tsx

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
  TablePagination,
  TextField,
  TableSortLabel,
} from '@mui/material';
import { getFileByName } from '@/api/seguimientoDeOts';

interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  status: string;
  validated: boolean;
  createdAt: string;
  user: { username: string };
  flow: {
    area_id: number;
    status: string;
    area?: { name?: string };
  }[];
  files: File[];
}

interface File {
  id: number;
  type: string;
  file_path: string;
}

interface Props {
  orders: WorkOrder[];
  title: string;
  statusFilter: string;
}

type OrderDirection = 'asc' | 'desc';
type SortableField = 'ot_id' | 'createdAt';
const itemsPerPage = 25;

const WorkOrderTable: React.FC<Props> = ({ orders, title, statusFilter }) => {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [activeArea, setActiveArea] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [orderBy, setOrderBy] = useState<SortableField>('createdAt');
  const [orderDirection, setOrderDirection] = useState<OrderDirection>('asc');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setPage(0);
  };
  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveArea(e.target.value);
    setPage(0);
  };
  const handleStartDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setPage(0);
  };
  const handleEndDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setPage(0);
  };
  const handleChangePage = (
    _: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => setPage(newPage);

  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0);
  };
  const validOrders = Array.isArray(orders) ? orders : [];
  const filteredOrders = validOrders.filter((order) => {
    const statusMatch =
      order.status.toLowerCase().includes(statusFilter.toLowerCase()) ||
      order.flow.some((f) =>
        f.status.toLowerCase().includes(statusFilter.toLowerCase())
      );
    const searchMatch = order.ot_id
      .toLowerCase()
      .includes(searchValue.toLowerCase());
    const areaMatch =
      !activeArea ||
      order.flow.some((f) =>
        f.area?.name?.toLowerCase().includes(activeArea.toLowerCase())
      );
    const createdDate = new Date(order.createdAt);
    const fromDate = startDate ? new Date(startDate) : null;
    const toDate = endDate ? new Date(endDate) : null;
    const dateMatch =
      (!fromDate || createdDate >= fromDate) &&
      (!toDate || createdDate <= toDate);
    return statusMatch && searchMatch && areaMatch && dateMatch;
  });
  const sorted = filteredOrders.sort((a, b) => {
    let cmp = 0;
    if (orderBy === 'createdAt') {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      cmp = a.ot_id.localeCompare(b.ot_id);
    }
    return orderDirection === 'asc' ? cmp : -cmp;
  });
  const paginatedOrders = filteredOrders.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );

  validOrders.forEach((order) => {
    order.flow?.forEach((flow: any) => {
      console.log('status:', `"${flow.status}"`);
    });
  });

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
    <TableContainer
      component={Paper}
      sx={{
        backgroundColor: 'white',
        p: 4,
        mt: 4,
        borderRadius: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minWidth: 800,
        mx: 'auto',
      }}
    >
      <Box
        display="flex"
        flexWrap="wrap"
        alignItems="center"
        justifyContent="flex-end"
        gap={2}
        mb={2}
      >
        <Typography variant="h6" sx={{ color: 'black' }}>
          {title}
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={'4px'} flexGrow={1}>
          <TextField
            label="Buscar OT"
            size="small"
            value={searchValue}
            onChange={handleSearchChange}
            type="search"
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            sx={{
              maxWidth: 200,
              '& .MuiInputBase-input': {
                color: '#8a8686', // color del texto
              },
              '& .MuiInputLabel-root': {
                color: '#8a8686', // color del label
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#8a8686', // color del borde normal
                },
                '&:hover fieldset': {
                  borderColor: '#b0adad', // color del borde al pasar el mouse
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#90caf9', // color del borde al enfocar (azul claro por accesibilidad)
                },
              },
            }}
          />
          <TextField
            label="Filtrar por Área"
            size="small"
            value={activeArea}
            onChange={handleAreaChange}
            InputLabelProps={{ shrink: true }}
            sx={{
              maxWidth: 200,
              '& .MuiInputBase-input': {
                color: '#8a8686', // color del texto
              },
              '& .MuiInputLabel-root': {
                color: '#8a8686', // color del label
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#8a8686', // color del borde normal
                },
                '&:hover fieldset': {
                  borderColor: '#b0adad', // color del borde al pasar el mouse
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#90caf9', // color del borde al enfocar (azul claro por accesibilidad)
                },
              },
            }}
          />
          <TextField
            label="Desde"
            type="date"
            size="small"
            value={startDate}
            onChange={handleStartDate}
            InputLabelProps={{ shrink: true }}
            sx={{
              maxWidth: 200,
              '& .MuiInputBase-input': {
                color: '#8a8686', // color del texto
              },
              '& .MuiInputLabel-root': {
                color: '#8a8686', // color del label
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#8a8686', // color del borde normal
                },
                '&:hover fieldset': {
                  borderColor: '#b0adad', // color del borde al pasar el mouse
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#90caf9', // color del borde al enfocar (azul claro por accesibilidad)
                },
              },
            }}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            value={endDate}
            onChange={handleEndDate}
            InputLabelProps={{ shrink: true }}
            sx={{
              maxWidth: 200,
              '& .MuiInputBase-input': {
                color: '#8a8686', // color del texto
              },
              '& .MuiInputLabel-root': {
                color: '#8a8686', // color del label
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#8a8686', // color del borde normal
                },
                '&:hover fieldset': {
                  borderColor: '#b0adad', // color del borde al pasar el mouse
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#90caf9', // color del borde al enfocar (azul claro por accesibilidad)
                },
              },
            }}
          />
        </Box>
        <Box
          display="flex"
          gap={'3px'}
          flexWrap="wrap"
          justifyContent="flex-end"
        >
          <Box display="flex" alignItems="center" gap={'2px'}>
            <CircleLegend style={{ backgroundColor: '#22c55e' }} />
            <Typography variant="caption" color="black">
              Completado
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={'2px'}>
            <CircleLegend style={{ backgroundColor: '#facc15' }} />
            <Typography variant="caption" color="black">
              Enviado a CQM / En Calidad
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={'2px'}>
            <CircleLegend style={{ backgroundColor: '#f5945c' }} />
            <Typography variant="caption" sx={{ color: 'black' }}>
              Parcial / Pendiente Parcial
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={'2px'}>
            <CircleLegend style={{ backgroundColor: '#4a90e2' }} />
            <Typography variant="caption" color="black">
              En Proceso
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={'2px'}>
            <CircleLegend style={{ backgroundColor: '#d1d5db' }} />
            <Typography variant="caption" color="black">
              Listo / Sin Estado
            </Typography>
          </Box>
        </Box>
      </Box>
      {sorted.length === 0 ? (
        <Typography sx={{ color: 'black' }}>
          No hay órdenes para mostrar.
        </Typography>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <CustomTableCell
                  sortDirection={orderBy === 'ot_id' ? orderDirection : false}
                >
                  <TableSortLabel
                    active={orderBy === 'ot_id'}
                    direction={orderBy === 'ot_id' ? orderDirection : 'asc'}
                    onClick={() => handleRequestSort('ot_id')}
                    hideSortIcon={false}
                    sx={{
                      color: 'black', // texto por defecto
                      '&.Mui-active': {
                        color: 'black', // ❗ fuerza el color cuando está activo
                        '& .MuiTableSortLabel-icon': {
                          color: 'black',
                          opacity: 1,
                        },
                      },
                      '& .MuiTableSortLabel-icon': {
                        color: 'black',
                        opacity: 1,
                      },
                    }}
                  >
                    Id OT
                  </TableSortLabel>
                </CustomTableCell>
                <CustomTableCell>Id Presupuesto</CustomTableCell>
                <CustomTableCell>Usuario</CustomTableCell>
                <CustomTableCell>Área</CustomTableCell>
                <CustomTableCell
                  sortDirection={
                    orderBy === 'createdAt' ? orderDirection : false
                  }
                >
                  <TableSortLabel
                    active={orderBy === 'createdAt'}
                    direction={orderBy === 'createdAt' ? orderDirection : 'asc'}
                    onClick={() => handleRequestSort('createdAt')}
                    sx={{
                      color: 'black', // texto por defecto
                      '&.Mui-active': {
                        color: 'black', // ❗ fuerza el color cuando está activo
                        '& .MuiTableSortLabel-icon': {
                          color: 'black',
                          opacity: 1,
                        },
                      },
                      '& .MuiTableSortLabel-icon': {
                        color: 'black',
                        opacity: 1,
                      },
                    }}
                  >
                    Fecha
                  </TableSortLabel>
                </CustomTableCell>
                <CustomTableCell>Archivos</CustomTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell
                    onClick={() =>
                      (window.location.href = `/seguimientoDeOts/${order.ot_id}`)
                    }
                    sx={{
                      cursor: 'pointer',
                      color: 'black',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {order.ot_id}
                  </TableCell>
                  <CustomTableCell>{order.mycard_id}</CustomTableCell>
                  <CustomTableCell>{order.user.username}</CustomTableCell>
                  <CustomTableCell>
                    <Timeline>
                      {order.flow.map((flowStep, idx) => {
                        const status = flowStep.status.toLowerCase();
                        const isActive = status.includes('proceso');
                        const isParcial = status === 'parcial';
                        const isCompleted = status.includes('completado');
                        const isCalidad = ['calidad', 'cqm'].some((w) =>
                          status.includes(w)
                        );
                        const isLast = idx === order.flow.length - 1;
                        return (
                          <TimelineItem key={idx}>
                            <Circle
                              $isActive={isActive}
                              $isParcial={isParcial}
                              $isCompleted={isCompleted}
                              $isCalidad={isCalidad}
                            >
                              {idx + 1}
                            </Circle>
                            {!isLast && <Line />}
                            <AreaName
                              $isActive={isActive}
                              $isParcial={isParcial}
                              $isCalidad={isCalidad}
                            >
                              {flowStep.area?.name ?? 'Área desconocida'}
                            </AreaName>
                          </TimelineItem>
                        );
                      })}
                    </Timeline>
                  </CustomTableCell>
                  <CustomTableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </CustomTableCell>
                  <CustomTableCell>
                    {order.files.length > 0 ? (
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        {order.files.map((file) => {
                          const nameLower = file.file_path.toLowerCase();
                          const label = nameLower.includes('ot')
                            ? 'Ver OT'
                            : nameLower.includes('sku')
                            ? 'Ver SKU'
                            : nameLower.includes('op')
                            ? 'Ver OP'
                            : 'Ver Archivo';
                          return (
                            <Box
                              component="button"
                              key={file.id}
                              onClick={() => downloadFile(file.file_path)}
                              sx={{
                                border: '1px solid #c2c2c2',
                                borderRadius: '20px',
                                p: '4px 12px',
                                backgroundColor: '#f7f7f7',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                '&:hover': { backgroundColor: '#e0e0e0' },
                              }}
                            >
                              {label}
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      'No hay archivos'
                    )}
                  </CustomTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[itemsPerPage]}
            component="div"
            count={sorted.length}
            rowsPerPage={itemsPerPage}
            page={page}
            onPageChange={handleChangePage}
            sx={{
              color: 'black',
              '& .MuiTablePagination-actions svg': {
                color: 'black',
              },
              '& .MuiInputBase-root': {
                color: 'black',
              },
              '& .MuiSelect-icon': {
                color: 'black',
              },
            }}
          />
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

const Line = styled.div<{ $isLast?: boolean }>`
  flex: 1;
  height: 2px;
  background-color: #d1d5db;
  margin: 0 0.5rem;
  position: absolute;
  top: 14px;
  left: 50%;
  height: 2px;
  width: 80px;
  background-color: #d1d5db;
  z-index: 0;
  display: ${({ $isLast }) => ($isLast ? 'none' : 'block')};
`;

const Circle = styled.div.withConfig({
  shouldForwardProp: (prop) =>
    !['$isActive', '$isCompleted', '$isCalidad', '$isParcial'].includes(prop),
})<
  StyledProps & {
    $isActive?: boolean;
    $isCompleted?: boolean;
    $isCalidad?: boolean;
    $isParcial?: boolean;
  }
>`
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

const TimelineDivider = styled.div.withConfig({
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
})<
  StyledProps & {
    $isActive?: boolean;
    $isCompleted?: boolean;
    $isCalidad?: boolean;
    $isParcial?: boolean;
  }
>`
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
