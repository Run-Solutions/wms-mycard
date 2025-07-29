// 📁 myorg/apps/frontend-mobile/src/components/LiberarProducto/util/helpers.ts
import { WorkOrder } from './types';

interface FilterParams {
  searchValue: string;
  activeArea: string;
  startDate: string;
  endDate: string;
}

export const filterOrders = (
  orders: WorkOrder[],
  { searchValue, activeArea, startDate, endDate }: FilterParams
): WorkOrder[] => {
  return orders.filter((order) => {
    const otMatch = order.ot_id.toLowerCase().includes(searchValue.toLowerCase());
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

    return otMatch && areaMatch && dateMatch;
  });
};

export const sortOrders = (
  orders: WorkOrder[],
  orderBy: 'ot_id' | 'createdAt',
  direction: 'asc' | 'desc'
) => {
  return [...orders].sort((a, b) => {
    let cmp = 0;
    if (orderBy === 'createdAt') {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      cmp = a.ot_id.localeCompare(b.ot_id);
    }
    return direction === 'asc' ? cmp : -cmp;
  });
};

export const getFileLabel = (filePath: string) => {
  const lower = filePath.toLowerCase();
  if (lower.includes('ot')) return 'Ver OT';
  if (lower.includes('sku')) return 'Ver SKU';
  if (lower.includes('op')) return 'Ver OP';
  return 'Ver Archivo';
};

export const getStatusLabel = (color: string) => {
  switch (color) {
    case '#22c55e':
      return 'Completado';
    case '#facc15':
      return 'Enviado a CQM / En Calidad';
    case '#f5945c':
      return 'Parcial / Pendiente Parcial';
    case '#4a90e2':
      return 'En Proceso / Listo';
    case '#d1d5db':
      return 'Sin Estado';
    default:
      return '';
  }
};

export const getFlowStateStyles = (status: string) => {
  const s = status?.toLowerCase() || '';
  return {
    isActive: s.includes('proceso') || s.includes('listo'),
    isParcial: s.includes('parcial'),
    isCompleted: s.includes('completado'),
    isCalidad: s.includes('enviado a cqm') || s.includes('en calidad'),
    isInconforme: s.includes('inconformidad'),
  };
};
