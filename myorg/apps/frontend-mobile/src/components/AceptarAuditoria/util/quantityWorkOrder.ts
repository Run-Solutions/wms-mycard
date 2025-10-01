// myorg/apps/frontend-mobile/src/components/AceptarAuditoria/util/quantityWorkOrder.ts

// --- Tipos base compartidos ---
export type Numericish = number | string | boolean | null | undefined;

export const toNum = (v: Numericish): number => {
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const addN = (...vals: Numericish[]): number => {
  let total = 0;
  for (const v of vals) total += toNum(v);
  return total;
};

// --- Áreas ---
export type AreaBlock =
  | 'prepress'
  | 'impression'
  | 'serigrafia'
  | 'empalme'
  | 'laminacion'
  | 'corte'
  | 'colorEdge'
  | 'hotStamping'
  | 'millingChip'
  | 'personalizacion';

export const areaKeyById: Record<number, AreaBlock> = {
  1: 'prepress',
  2: 'impression',
  3: 'serigrafia',
  4: 'empalme',
  5: 'laminacion',
  6: 'corte',
  7: 'colorEdge',
  8: 'hotStamping',
  9: 'millingChip',
  10: 'personalizacion',
};

type NumericKeysPR =
  | 'quantity'
  | 'bad_quantity'
  | 'excess_quantity'
  | 'material_quantity'
  | 'noprocess_quantity';

// --- Modelos de datos ---
export type Answer = { sample_quantity?: Numericish };

export type PartialRelease = {
  validated?: boolean;
  quantity?: number;
  bad_quantity?: number;
  excess_quantity?: number;
  formAuditory?: {
    sample_auditory: number;
  };
  material_quantity?: number;
  noprocess_quantity?: number;
  observation?: string;
};

export type AreaTotals = {
  good_quantity?: Numericish;
  bad_quantity?: Numericish;
  excess_quantity?: Numericish;
  material_quantity?: Numericish;
  noprocess_quantity?: Numericish;
  comments?: string;
};

export type WorkOrder = {
  areaResponse?: Partial<Record<AreaBlock, AreaTotals>>;
  partialReleases?: PartialRelease[];
  partials?: PartialRelease[]; // <- NUEVO
  answers: Answer[];
};

export type DefaultValues = {
  good_quantity: Numericish;
  bad_quantity: Numericish;
  excess_quantity: Numericish;
  material_quantity: Numericish;
  noprocess_quantity: Numericish;
  cqm_quantity: Numericish;
  auditoria_quantity: Numericish;
  comments: string;
  total_quantity: number;
};

// --- Helpers específicos ---

const getAllPartials = (wo: WorkOrder | null | undefined): PartialRelease[] =>
  wo?.partialReleases ?? wo?.partials ?? [];

export function computeCqmQuantity(answers: Answer[]): number {
  return answers.reduce(
    (total, a) => total + (Number(a.sample_quantity) || 0),
    0
  );
}
export function computeSampleAuditorySum(
  partials?: PartialRelease[] | null
): number {
  const arr = partials ?? [];
  return arr.reduce(
    (total, p) => total + toNum(p?.formAuditory?.sample_auditory),
    0
  );
}
/**
 * Helper genérico para construir los default values por área.
 * - areaKey: la clave del área (ej. 'corte', 'colorEdge', etc.)
 * - workOrder: la OT completa
 * - sumaBadQuantity: suma auxiliar de “malas” (si ya la calculas afuera)
 * - options.filterPartialsByArea: si tus parciales vienen mezclados, puedes filtrar por área
 */
export function buildDefaultValuesByArea(
  areaKey: AreaBlock,
  workOrder: WorkOrder | null | undefined,
  sumaBadQuantity: Numericish,
  options?: {
    filterPartialsByArea?: (p: PartialRelease) => boolean;
  }
): DefaultValues | null {
  if (!workOrder) return null;

  const areaData = workOrder.areaResponse?.[areaKey];
  const allPartials = getAllPartials(workOrder);
  console.log(allPartials)
  const partials = options?.filterPartialsByArea
    ? allPartials.filter(options.filterPartialsByArea)
    : allPartials;

  const cqm_quantity = computeCqmQuantity(workOrder.answers);
  const auditory_quantity = computeSampleAuditorySum(allPartials);
  const allValidated =
    partials.length > 0 && partials.every((p) => p.validated);

  let values: Omit<DefaultValues, 'total_quantity'>;
  let totalCalculado = 0;

  if (areaData && partials.length === 0) {
    // Caso original: hay datos del área pero no hay parciales
    values = {
      good_quantity: areaData.good_quantity ?? '',
      bad_quantity: areaData.bad_quantity ?? '',
      excess_quantity: areaData.excess_quantity ?? '',
      material_quantity: areaData.material_quantity ?? '',
      noprocess_quantity: areaData.noprocess_quantity ?? '',
      cqm_quantity: cqm_quantity || '',
      auditoria_quantity: auditory_quantity || '',
      comments: areaData.comments ?? '',
    };

    // ✅ Asignación (no sombra) y suma segura
    totalCalculado = addN(
      values.good_quantity,
      sumaBadQuantity,
      values.excess_quantity,
      values.cqm_quantity,
      values.auditoria_quantity,
    );
  } else if (areaData && allValidated) {
    // Hay parciales y todos validados: trabajamos con "restantes"
    // ✅ Versión loop (evita problemas de inferencia en reduce con keyof)
    const sumPR = (k: NumericKeysPR) => {
      let total = 0;
      for (const pr of partials) total += toNum(pr?.[k]);
      return total;
    };

    const totalParciales = sumPR('quantity');
    const totalParcialesBad = sumPR('bad_quantity');
    const totalParcialesExc = sumPR('excess_quantity');
    const totalParcialesMaterial = sumPR('material_quantity');
    const totalParcialesNoPro = sumPR('noprocess_quantity');

    const restante = toNum(areaData.good_quantity) - totalParciales;
    const restanteBad = toNum(areaData.bad_quantity) - totalParcialesBad;
    const restanteExc = toNum(areaData.excess_quantity) - totalParcialesExc;
    const restanteMaterial =
      toNum(areaData.material_quantity) - totalParcialesMaterial;
    const restanteNoPro =
      toNum(areaData.noprocess_quantity) - totalParcialesNoPro;

    values = {
      good_quantity: restante > 0 ? restante : 0,
      bad_quantity: restanteBad > 0 ? restanteBad : 0,
      excess_quantity: restanteExc > 0 ? restanteExc : 0,
      material_quantity: restanteMaterial > 0 ? restanteMaterial : 0,
      noprocess_quantity: restanteNoPro > 0 ? restanteNoPro : 0,
      cqm_quantity: cqm_quantity || '',
      auditoria_quantity: auditory_quantity || '',
      comments: areaData.comments ?? '',
    };

    console.log('Auditoria', auditory_quantity);
    // Total “resta”: usa addN para evitar unions con '+'
    const totalResta = addN(
      areaData.good_quantity,
      sumaBadQuantity,
      areaData.excess_quantity,
      values.cqm_quantity,
      values.auditoria_quantity,
    );
    totalCalculado = totalResta;
  } else {
    // Tomar el primer parcial sin validar
    const firstUnvalidated = partials.find((p) => !p.validated) || {};

    values = {
      good_quantity: firstUnvalidated.quantity ?? '',
      bad_quantity: firstUnvalidated.bad_quantity ?? '',
      excess_quantity: firstUnvalidated.excess_quantity ?? '',
      material_quantity: firstUnvalidated.material_quantity ?? '',
      noprocess_quantity: firstUnvalidated.noprocess_quantity ?? '',
      cqm_quantity: cqm_quantity || '',
      auditoria_quantity: auditory_quantity || '',
      comments: firstUnvalidated.observation ?? '',
    };

    totalCalculado = addN(
      values.good_quantity,
      sumaBadQuantity,
      values.excess_quantity,
      values.cqm_quantity,
    );
  }

  return { ...values, total_quantity: totalCalculado };
}
