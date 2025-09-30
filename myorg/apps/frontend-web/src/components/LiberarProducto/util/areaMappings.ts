// Utility helpers to keep area label handling in sync across components.
// myorg/apps/frontend-web/src/components/LiberarProducto/util/areaMappings.ts

export type BlockKey =
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

// Areas that can store an additional `material_quantity` besides `bad_quantity`.
const BLOCKS_WITH_MATERIAL = new Set<BlockKey>([
  'corte',
  'colorEdge',
  'hotStamping',
  'millingChip',
  'personalizacion',
]);

export const normalizeAreaKey = (value: string) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');

const AREA_NAME_TO_BLOCK: Record<string, BlockKey> = {
  preprensa: 'prepress',
  prepress: 'prepress',
  impresion: 'impression',
  impression: 'impression',
  serigrafia: 'serigrafia',
  empalme: 'empalme',
  laminacion: 'laminacion',
  lamination: 'laminacion',
  corte: 'corte',
  coloredge: 'colorEdge',
  'color-edge': 'colorEdge',
  'color edge': 'colorEdge',
  'color_edge': 'colorEdge',
  hotstamping: 'hotStamping',
  'hot stamping': 'hotStamping',
  'hot_stamping': 'hotStamping',
  millingchip: 'millingChip',
  'milling chip': 'millingChip',
  'milling_chip': 'millingChip',
  personalizacion: 'personalizacion',
  personalization: 'personalizacion',
};

export const resolveBlockKey = (areaName: string | undefined): BlockKey | null => {
  if (!areaName) return null;
  return AREA_NAME_TO_BLOCK[normalizeAreaKey(areaName)] ?? null;
};

export const blockSupportsMaterial = (block: BlockKey | null | undefined) =>
  block ? BLOCKS_WITH_MATERIAL.has(block) : false;

const coerceNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

type PartialReleaseLike = {
  bad_quantity?: number | null;
  material_quantity?: number | null;
};

type FlowLike = {
  area?: { name?: string | null };
  areaResponse?: Record<string, any>;
  partialReleases?: PartialReleaseLike[] | null;
  badQuantitySummary?: SummaryEntry[];
  badQuantityDetails?: BadQuantityDetailLike[] | null;
};

export type SummaryValue = {
  label: string;
  value: number;
};

export type SummaryEntry = {
  areaId: number;
  areaName: string;
  values: SummaryValue[];
};

export type BadQuantityDetailLike = {
  target_area_id?: number | null;
  targetArea?: { id: number; name?: string | null } | null;
  block?: string | null;
  values?: unknown;
  bad_quantity?: number | null;
  material_quantity?: number | null;
};

export const computeAreaQuantities = (flow: FlowLike) => {
  const areaName = flow?.area?.name ?? '';
  const areaKey = normalizeAreaKey(areaName);
  const blockKey = resolveBlockKey(areaName);
  const supportsMaterial = blockSupportsMaterial(blockKey);
  const blockData = blockKey ? flow?.areaResponse?.[blockKey] : undefined;

  let badQuantity = coerceNumber(blockData?.bad_quantity);
  let materialQuantity = supportsMaterial
    ? coerceNumber(blockData?.material_quantity)
    : null;

  const partials = Array.isArray(flow?.partialReleases)
    ? flow.partialReleases
    : [];

  if ((badQuantity === null || badQuantity === undefined) && partials.length) {
    badQuantity = partials.reduce((sum, partial) => {
      const numeric = coerceNumber(partial.bad_quantity) ?? 0;
      return sum + numeric;
    }, 0);
  }

  if (supportsMaterial) {
    if (
      (materialQuantity === null || materialQuantity === undefined) &&
      partials.length
    ) {
      materialQuantity = partials.reduce((sum, partial) => {
        const numeric = coerceNumber(partial.material_quantity) ?? 0;
        return sum + numeric;
      }, 0);
    }
  }

  return {
    areaKey,
    blockKey,
    supportsMaterial,
    badQuantity: badQuantity ?? 0,
    materialQuantity:
      supportsMaterial && materialQuantity !== null && materialQuantity !== undefined
        ? materialQuantity
        : supportsMaterial
        ? 0
        : undefined,
  } as const;
};

const STORAGE_PREFIX = 'wms-bad-summary';

const makeStorageKey = (
  workOrderKey: string | number,
  flowId: number | string,
) => `${STORAGE_PREFIX}:${workOrderKey}:${flowId}`;

export const saveBadQuantitySummary = (
  workOrderKey: string | number,
  flowId: number | string,
  summary: SummaryEntry[],
) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      makeStorageKey(workOrderKey, flowId),
      JSON.stringify(summary ?? []),
    );
  } catch (error) {
    console.error('Error storing bad quantity summary', error);
  }
};

export const loadBadQuantitySummary = (
  workOrderKey: string | number,
  flowId: number | string,
): SummaryEntry[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(
      makeStorageKey(workOrderKey, flowId),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as SummaryEntry[];
  } catch (error) {
    console.error('Error reading bad quantity summary', error);
    return null;
  }
};

export const clearBadQuantitySummary = (
  workOrderKey: string | number,
  flowId: number | string,
) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(makeStorageKey(workOrderKey, flowId));
  } catch (error) {
    console.error('Error clearing bad quantity summary', error);
  }
};

const normalizeFieldLabel = (label: string) =>
  String(label ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const isBadLabel = (label: string) => {
  const normalized = normalizeFieldLabel(label);
  return normalized.startsWith('malas');
};

const isMaterialLabel = (label: string) => {
  const normalized = normalizeFieldLabel(label);
  return normalized.includes('fabrica');
};

export const populateInitialValuesFromSummary = (
  summary: SummaryEntry[] | null | undefined,
  initialValues: Record<string, string>,
) => {
  if (!Array.isArray(summary)) return;
  for (const entry of summary) {
      const key = normalizeAreaKey(entry.areaName ?? '');
      if (!key) continue;

      const badValue = entry.values?.find((v) => isBadLabel(v.label))?.value;
      if (badValue !== undefined) {
        initialValues[`${key}_bad`] = String(Number(badValue) || 0);
      }

      const materialValue = entry.values?.find((v) => isMaterialLabel(v.label))?.value;
      if (materialValue !== undefined) {
        initialValues[`${key}_material`] = String(Number(materialValue) || 0);
      }
    }
  };

const buildSummaryValues = (detail: BadQuantityDetailLike): SummaryValue[] => {
  const values: SummaryValue[] = [];
  const rawValues = Array.isArray(detail?.values)
    ? (detail?.values as Array<{ label?: unknown; value?: unknown }> ?? [])
    : [];

  const seen = new Set<string>();

  for (const entry of rawValues) {
    const label = typeof entry?.label === 'string' ? entry.label : '';
    const numeric = Number(entry?.value ?? 0);
    if (!label || !Number.isFinite(numeric)) continue;
    const normalized = normalizeFieldLabel(label);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    values.push({ label, value: numeric });
  }

  if (
    detail?.bad_quantity !== undefined &&
    detail?.bad_quantity !== null &&
    !seen.has(normalizeFieldLabel('Malas'))
  ) {
    const numeric = Number(detail.bad_quantity ?? 0);
    if (Number.isFinite(numeric)) {
      values.push({ label: 'Malas', value: numeric });
      seen.add(normalizeFieldLabel('Malas'));
    }
  }

  if (
    detail?.material_quantity !== undefined &&
    detail?.material_quantity !== null &&
    !seen.has(normalizeFieldLabel('Malo de fábrica'))
  ) {
    const numeric = Number(detail.material_quantity ?? 0);
    if (Number.isFinite(numeric)) {
      values.push({ label: 'Malo de fábrica', value: numeric });
      seen.add(normalizeFieldLabel('Malo de fábrica'));
    }
  }

  return values;
};

export const mapDetailsToSummary = (
  details: BadQuantityDetailLike[] | null | undefined,
): SummaryEntry[] => {
  if (!Array.isArray(details)) return [];

  const summary: SummaryEntry[] = [];

  for (const detail of details) {
    if (!detail) continue;
    const areaId = detail.target_area_id ?? detail.targetArea?.id;
    if (!areaId) continue;

    const areaName =
      detail.targetArea?.name ??
      (detail.block ? detail.block.toString() : `Área ${areaId}`);

    const values = buildSummaryValues(detail);
    if (!values.length) continue;

    summary.push({
      areaId,
      areaName,
      values,
    });
  }

  return summary;
};
