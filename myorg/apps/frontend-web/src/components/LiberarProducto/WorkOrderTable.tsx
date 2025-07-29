import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WorkOrder, SortableField, OrderDirection } from './util/types';
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
  TablePagination,
  TextField,
  TableSortLabel,
} from '@mui/material';
import { getFileByName } from '@/api/seguimientoDeOts';

import {
  filterOrders,
  sortOrders,
  getStatusLabel,
  getFileLabel,
  getFlowStateStyles,
} from './util/helpers'; // Extraído a archivo separado

import {
  Timeline,
  TimelineItem,
  Circle,
  Line,
  AreaName,
  CircleLegend,
  CustomTableCell,
  textFieldStyle,
  containerStyle,
  clickableCell,
  sortLabelStyle,
  paginationStyle,
  fileButtonStyle,
} from './util/styled'; // Extraído a archivo separado

const itemsPerPage = 5;
interface Props {
  orders: WorkOrder[];
  title: string;
  statusFilter: string | string[];
}

const WorkOrderTable: React.FC<Props> = ({
  orders = [],
  title,
  statusFilter,
}) => {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [activeArea, setActiveArea] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderBy, setOrderBy] = useState<SortableField>('createdAt');
  const [orderDirection, setOrderDirection] = useState<OrderDirection>('asc');
  const sortableFields: SortableField[] = ['ot_id', 'createdAt'];

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0);
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return filterOrders(orders, {
      searchValue,
      activeArea,
      statusFilter,
      startDate,
      endDate,
    });
  }, [orders, searchValue, activeArea, statusFilter, startDate, endDate]);

  const sorted = useMemo(
    () => sortOrders(filtered, orderBy, orderDirection),
    [filtered, orderBy, orderDirection]
  );

  const paginated = useMemo(
    () => sorted.slice(page * itemsPerPage, (page + 1) * itemsPerPage),
    [sorted, page]
  );

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
    <TableContainer component={Paper} sx={{ ...containerStyle }}>
      <Box display="flex" flexWrap="wrap" justifyContent="space-between" mb={2}>
        <Typography variant="h6" sx={{ color: 'black' }}>
          {title}
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            label="Buscar OT"
            size="small"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setPage(0);
            }}
            InputLabelProps={{ shrink: true }}
            sx={textFieldStyle}
          />
          <TextField
            label="Filtrar por Área"
            size="small"
            value={activeArea}
            onChange={(e) => {
              setActiveArea(e.target.value);
              setPage(0);
            }}
            InputLabelProps={{ shrink: true }}
            sx={textFieldStyle}
          />
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap">
          {['#22c55e', '#facc15', '#f5945c', '#4a90e2', '#d1d5db'].map(
            (color, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1}>
                <CircleLegend style={{ backgroundColor: color }} />
                <Typography variant="caption" sx={{ color: 'black' }}>
                  {getStatusLabel(color)}
                </Typography>
              </Box>
            )
          )}
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
                {sortableFields.map((field) => (
                  <CustomTableCell
                    key={field}
                    sortDirection={orderBy === field ? orderDirection : false}
                  >
                    <TableSortLabel
                      active={orderBy === field}
                      direction={orderBy === field ? orderDirection : 'asc'}
                      onClick={() => handleRequestSort(field)} // ✅ ya es SortableField
                      sx={sortLabelStyle}
                    >
                      {field === 'ot_id' ? 'Id OT' : 'Fecha'}
                    </TableSortLabel>
                  </CustomTableCell>
                ))}
                <CustomTableCell>Id Presupuesto</CustomTableCell>
                <CustomTableCell>Usuario</CustomTableCell>
                <CustomTableCell>Área</CustomTableCell>
                <CustomTableCell>Archivos</CustomTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((order) => (
                <TableRow key={order.id}>
                  <TableCell
                    sx={{ ...clickableCell }}
                    onClick={() =>
                      router.push(`/liberarProducto/${order.workOrder.ot_id}`)
                    }
                  >
                    {order.workOrder.ot_id}
                  </TableCell>
                  <CustomTableCell>{order.workOrder.mycard_id}</CustomTableCell>
                  <CustomTableCell>
                    {order.workOrder.user?.username || 'Sin usuario'}
                  </CustomTableCell>
                  <CustomTableCell sx={{ maxWidth: 900 }}>
                    <Timeline>
                      {order.workOrder.flow?.map(
                        (
                          step: WorkOrder['workOrder']['flow'][number],
                          index: number
                        ) => {
                          const {
                            isActive,
                            isParcial,
                            isCompleted,
                            isCalidad,
                            isInconforme,
                          } = getFlowStateStyles(step.status);

                          return (
                            <TimelineItem key={index}>
                              <Circle
                                $isActive={isActive}
                                $isParcial={isParcial}
                                $isCompleted={isCompleted}
                                $isCalidad={isCalidad}
                                $isInconforme={isInconforme}
                              >
                                {index + 1}
                              </Circle>
                              {index !== order.workOrder.flow.length - 1 && (
                                <Line $isLast={false} />
                              )}
                              <AreaName
                                $isActive={isActive}
                                $isParcial={isParcial}
                                $isCalidad={isCalidad}
                                $isInconforme={isInconforme}
                              >
                                {step.area?.name ?? 'Área desconocida'}
                              </AreaName>
                            </TimelineItem>
                          );
                        }
                      )}
                    </Timeline>
                  </CustomTableCell>
                  <CustomTableCell>
                    {new Date(order.workOrder.createdAt).toLocaleDateString()}
                  </CustomTableCell>
                  <CustomTableCell>
                    {order.workOrder.files.length > 0 ? (
                      <Box display="flex" flexDirection="column" gap={1}>
                        {order.workOrder.files.map(
                          (file: WorkOrder['workOrder']['files'][number]) => (
                            <button
                              key={file.file_path}
                              onClick={() => downloadFile(file.file_path)}
                              style={fileButtonStyle}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  '#e0e0e0')
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  '#f7f7f7')
                              }
                            >
                              {getFileLabel(file.file_path)}
                            </button>
                          )
                        )}
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
            sx={paginationStyle}
          />
        </>
      )}
    </TableContainer>
  );
};

export default WorkOrderTable;