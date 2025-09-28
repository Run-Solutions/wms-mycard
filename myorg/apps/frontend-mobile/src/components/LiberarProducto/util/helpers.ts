// myorg/apps/frontend-mobile/src/components/LiberarProducto/util/helpers.ts
import { WorkOrder } from './types';
import { toNum } from '../../AceptarAuditoria/util/quantityWorkOrder';

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
    const otMatch = order.ot_id
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
  if (lower.includes('image')) return 'Ver TARJETA';
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

export type NumericLike = number | string | null | undefined;

const sumBy = (arr: any[], key: string) =>
  arr.reduce((acc, x) => acc + toNum(x?.[key]), 0);

const sumMany = (arr: any[], keys: string[]) =>
  keys.reduce((acc, k) => acc + sumBy(arr, k), 0);

/**
 * Suma de los parciales del FLOW actual.
 * Por defecto cuenta solo validados; cambia includeUnvalidated si necesitas incluir todos.
 */
export function getCurrentFlowPartialsTotal(
  currentFlow: any,
  opts?: { includeUnvalidated?: boolean }
): number {
  const { includeUnvalidated = false } = opts ?? {};
  const arr = (currentFlow?.partialReleases ?? []).filter(
    (p: any) => includeUnvalidated || p?.validated
  );

  const base = sumMany(arr, [
    'quantity',
    'bad_quantity',
    'excess_quantity',
    'noprocess_quantity',
    'material_quantity',
  ]);

  // sumar formAuditory.sample_auditory (si existe)
  const samples = arr.reduce(
    (acc: number, p: any) => acc + toNum(p?.formAuditory?.sample_auditory),
    0
  );

  return base + samples;
}

/** Total “digitado” actualmente en el formulario */
export function getCurrentInputTotal(inputs: {
  cqm_quantity?: NumericLike;
  goodQuantity?: NumericLike;
  lastAreaBadQuantity?: NumericLike;
  materialBadQuantity?: NumericLike;
  excessQuantity?: NumericLike;
  noProcessQuantity?: NumericLike;
}): number {
  const {
    cqm_quantity,
    goodQuantity,
    lastAreaBadQuantity,
    materialBadQuantity,
    excessQuantity,
    noProcessQuantity,
  } = inputs;

  return (
    toNum(cqm_quantity) +
    toNum(goodQuantity) +
    toNum(lastAreaBadQuantity) +
    toNum(materialBadQuantity) +
    toNum(excessQuantity) +
    toNum(noProcessQuantity)
  );
}

/**
 * ¿La suma (inputs actuales + parciales del flow) excede la suma del área previa?
 */
export function exceedsPrevAreaSum(params: {
  prevAreaSum: NumericLike;
  currentFlow: any;
  inputs: {
    cqm_quantity?: NumericLike;
    goodQuantity?: NumericLike;
    lastAreaBadQuantity?: NumericLike;
    materialBadQuantity?: NumericLike;
    excessQuantity?: NumericLike;
    noProcessQuantity?: NumericLike;
  };
  includeUnvalidatedPartials?: boolean;
}) {
  const { prevAreaSum, currentFlow, inputs, includeUnvalidatedPartials } =
    params;

  const totalActual = getCurrentInputTotal(inputs);
  const totalParciales = getCurrentFlowPartialsTotal(currentFlow, {
    includeUnvalidated: !!includeUnvalidatedPartials,
  });

  return totalActual + totalParciales > toNum(prevAreaSum);
}
