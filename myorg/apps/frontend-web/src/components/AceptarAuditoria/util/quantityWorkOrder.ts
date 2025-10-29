// myorg/apps/frontend-web/src/components/AceptarAuditoria/util/quantityWorkOrder.ts

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
export type Answer = {
  sample_quantity?: Numericish;
  createdAt?: string | Date;
  created_at?: string | Date; // ← acepta snake_case
};

export type PartialRelease = {
  validated?: boolean;
  quantity?: number;
  bad_quantity?: number;
  excess_quantity?: number;
  formAuditory?: { sample_auditory: number };
  material_quantity?: number;
  noprocess_quantity?: number;
  observation?: string;
  createdAt?: string | Date;
  created_at?: string | Date; // ← acepta snake_case
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
  partials?: PartialRelease[];
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

// --- Helpers de fechas (aceptan createdAt o created_at) ---
const toMillis = (v?: string | Date | null): number | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
};

const getPartialMs = (p: PartialRelease): number | null =>
  toMillis(p?.createdAt ?? p?.created_at);

const getAnswerMs = (a: Answer): number | null =>
  toMillis(a?.createdAt ?? a?.created_at);

/**
 * Empareja CADA parcial con a lo sumo UN answer, en orden temporal.
 */
// Ventana de asignación (14 horas)
const ONE_DAY = 14 * 60 * 60 * 1000;

const isWithinWindow = (
  ansMs: number | null,
  partMs: number | null,
  windowMs: number
) =>
  ansMs !== null &&
  partMs !== null &&
  ansMs <= partMs &&
  partMs - ansMs <= windowMs;

/**
 * Asigna CQM por índice con validación temporal:
 * - #1 → A1 si pasa ventana; si no, 0
 * - #2 → A2 si pasa ventana; si no, 0 (NUNCA cae a A1)
 * - #3 → A3; si no, A2; si no, A1; si no, 0 (todo validando ventana)
 */
const linkAnswersToPartials = (
  partials: PartialRelease[] = [],
  answers: Answer[] = [],
  windowMs = ONE_DAY
): number[] => {
  // Orden temporal (los sin fecha al final)
  const P = partials
    .map((p, i) => ({ i, tp: getPartialMs(p) }))
    .sort((a, b) => (a.tp ?? Infinity) - (b.tp ?? Infinity));

  const A = answers
    .map((a) => ({ ta: getAnswerMs(a), q: toNum(a.sample_quantity) }))
    .sort((a, b) => (a.ta ?? Infinity) - (b.ta ?? Infinity));

  const result: number[] = Array(partials.length).fill(0);

  for (let pi = 0; pi < P.length; pi++) {
    const { i: origIdx, tp } = P[pi];

    // 1) Intentar con Answer #pi
    if (pi < A.length && isWithinWindow(A[pi].ta, tp, windowMs)) {
      result[origIdx] = A[pi].q;
      continue;
    }

    // 2) Reglas de fallback:
    if (pi === 0) {
      // #1: no hay fallback → 0
      result[origIdx] = 0;
      continue;
    }

    if (pi === 1) {
      // #2: NUNCA caer al #1 → 0
      result[origIdx] = 0;
      continue;
    }

    // #3 o mayor: caer hacia atrás (pi-1, pi-2, ... 0) si pasan ventana
    let assigned = 0;
    for (let ai = Math.min(pi - 1, A.length - 1); ai >= 0; ai--) {
      if (isWithinWindow(A[ai].ta, tp, windowMs)) {
        assigned = A[ai].q;
        break;
      }
    }
    result[origIdx] = assigned;
  }

  return result;
};

// --- Helpers para parciales activos ---
const getActivePartialIndex = (partials: PartialRelease[] = []): number => {
  const idx = partials.findIndex((p) => !p?.validated);
  return idx === -1 ? partials.length : idx;
};

// --- Constructor de valores por área ---
export function buildDefaultValuesByArea(
  areaKey: AreaBlock,
  workOrder: WorkOrder | null | undefined,
  sumaBadQuantity: Numericish,
  options?: { filterPartialsByArea?: (p: PartialRelease) => boolean }
): DefaultValues | null {
  if (!workOrder) return null;

  const areaData = workOrder.areaResponse?.[areaKey];
  const allPartials = getAllPartials(workOrder);
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

    totalCalculado = addN(
      values.good_quantity,
      sumaBadQuantity,
      values.excess_quantity,
      values.noprocess_quantity,
      values.cqm_quantity,
      values.auditoria_quantity
    );
  } else if (areaData && allValidated) {
    const sumPR = (k: NumericKeysPR) =>
      partials.reduce((acc, p) => acc + toNum(p?.[k]), 0);

    const restante = toNum(areaData.good_quantity) - sumPR('quantity');
    const restanteBad = toNum(areaData.bad_quantity) - sumPR('bad_quantity');
    const restanteExc =
      toNum(areaData.excess_quantity) - sumPR('excess_quantity');
    const restanteMat =
      toNum(areaData.material_quantity) - sumPR('material_quantity');
    const restanteNoPro =
      toNum(areaData.noprocess_quantity) - sumPR('noprocess_quantity');

    // 👉 Para el "siguiente" parcial (aún no creado) el CQM y auditoría deben ser 0
    //    porque no existe Answer #(partials.length) ni su timestamp para verificar ventana.
    const cqmForNext = 0;
    const auditoriaForNext = 0;

    values = {
      good_quantity: Math.max(restante, 0),
      bad_quantity: Math.max(restanteBad, 0),
      excess_quantity: Math.max(restanteExc, 0),
      material_quantity: Math.max(restanteMat, 0),
      noprocess_quantity: Math.max(restanteNoPro, 0),
      cqm_quantity: cqmForNext,
      auditoria_quantity: auditoriaForNext,
      comments: areaData.comments ?? '',
    };

    totalCalculado = addN(
      values.good_quantity,
      sumaBadQuantity,
      values.excess_quantity,
      values.noprocess_quantity
    );
  } else {
    const activeIdx = getActivePartialIndex(partials);
    const active = partials[activeIdx];
    const assignedCqm = linkAnswersToPartials(
      partials,
      workOrder.answers,
      ONE_DAY
    );
    const cqmForActive = assignedCqm[activeIdx] ?? 0;
    const auditoriaForActive = toNum(active?.formAuditory?.sample_auditory);

    values = {
      good_quantity: active?.quantity ?? '',
      bad_quantity: active?.bad_quantity ?? '',
      excess_quantity: active?.excess_quantity ?? '',
      material_quantity: active?.material_quantity ?? '',
      noprocess_quantity: active?.noprocess_quantity ?? '',
      cqm_quantity: cqmForActive || '',
      auditoria_quantity: auditoriaForActive || '',
      comments: active?.observation ?? '',
    };

    totalCalculado = addN(
      values.good_quantity,
      sumaBadQuantity,
      values.excess_quantity,
      values.noprocess_quantity,
      cqmForActive,
      auditoriaForActive
    );
  }

  return { ...values, total_quantity: totalCalculado };
}