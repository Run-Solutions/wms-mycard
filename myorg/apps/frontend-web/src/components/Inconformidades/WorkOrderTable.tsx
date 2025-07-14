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
  created_by: number;
  status: string; // Cambiado a string genérico
  validated: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
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
    };
    // otros campos que necesites
  }[];
  formAnswers?: any[]; // Añadir si es necesario
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
    order.status.toLowerCase() === statusFilter.toLowerCase() ||
    order.flow.some((f) =>
      f.status.toLowerCase() === statusFilter.toLowerCase()
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
        <Typography sx={{ p: 2, color: 'black' }}>
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
                <CustomTableCell sx={{ maxWidth: 110, overflowX: 'hidden' }}>
                  Id del presupuesto
                </CustomTableCell>
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
              {paginatedOrders.map((orderFlow) => (
                <TableRow key={orderFlow.id}>
                  <TableCell
                    onClick={() =>
                      router.push(`/inconformidades/${orderFlow.ot_id}`)
                    }
                    sx={{
                      color: 'black',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {orderFlow.ot_id}
                  </TableCell>
                  <CustomTableCell>{orderFlow.mycard_id}</CustomTableCell>
                  <CustomTableCell>{orderFlow.user?.username}</CustomTableCell>
                  <CustomTableCell sx={{ maxWidth: 900, overflowX: 'hidden' }}>
                    <Timeline>
                      {orderFlow.flow?.map((flowStep, index) => {
                        const isActive = [
                          'proceso',
                          'inconformidad',
                          'listo',
                        ].some((word) =>
                          flowStep.status?.toLowerCase().includes(word)
                        );
                        const isCompleted = flowStep.status
                          ?.toLowerCase()
                          .includes('completado');
                        const isLast = index === orderFlow.flow.length - 1;
                        return (
                          <TimelineItem key={index}>
                            <Circle
                              $isActive={isActive}
                              $isCompleted={isCompleted}
                            >
                              {index + 1}
                            </Circle>
                            {!isLast && <Line $isLast={isLast} />}
                            <AreaName $isActive={isActive}>
                              {flowStep.area?.name ?? 'Área desconocida'}
                            </AreaName>
                          </TimelineItem>
                        );
                      })}
                    </Timeline>
                  </CustomTableCell>
                  <CustomTableCell>
                    {new Date(orderFlow.createdAt).toLocaleDateString()}
                  </CustomTableCell>
                  <CustomTableCell>
                    {orderFlow.files.length > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
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
                                (
                                  e.target as HTMLButtonElement
                                ).style.backgroundColor = '#e0e0e0';
                              }}
                              onMouseOut={(e) => {
                                (
                                  e.target as HTMLButtonElement
                                ).style.backgroundColor = '#f7f7f7';
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
const CircleLegend = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
`;

const Circle = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isActive', '$isCompleted'].includes(prop),
})<StyledProps & { $isCompleted?: boolean }>`
  width: 30px;
  height: 30px;
  background-color: ${({ $isCompleted, $isActive }) =>
    $isCompleted ? '#22c55e' : $isActive ? 'red' : '#d1d5db'};
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: ${({ $isCompleted, $isActive }) =>
    $isCompleted ? '0 0 5px #22c55e' : $isActive ? '0 0 5px red' : 'none'};
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
