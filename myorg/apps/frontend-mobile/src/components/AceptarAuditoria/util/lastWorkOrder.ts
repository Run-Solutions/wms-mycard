// src/utils/workOrder.ts

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

const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Obtiene el bloque (clave) de areaResponse y el flow previo al flow actual.
 * Devuelve `{ prevFlow, blockKey }` o `null` si no hay previo.
 */
export function getPrevAreaBlock(workOrder: any): { prevFlow: any; blockKey: AreaBlock } | null {
  const flowList: any[] = workOrder?.workOrder?.flow ?? [];
  const currentIdx = flowList.findIndex((f) => f?.id === workOrder?.id);
  if (currentIdx <= 0) return null;

  const prevFlow = flowList[currentIdx - 1];
  const prevAreaId = prevFlow?.area?.id ?? prevFlow?.area_id;
  const blockKey = areaKeyById[prevAreaId as number];
  if (!blockKey) return null;

  return { prevFlow, blockKey };
}

/**
 * Suma good_quantity (o release_quantity) + excess_quantity del área previa.
 * Si no existe, devuelve 0.
 */
export function getPrevAreaGoodPlusExcess(workOrder: any): number {
  const prev = getPrevAreaBlock(workOrder); // { prevFlow, blockKey }
  if (!prev) return 0;

  const flow = prev.prevFlow;
  const blockKey = prev.blockKey;
  const areaResp = flow?.areaResponse?.[blockKey];
  const partials = Array.isArray(flow?.partialReleases) ? flow.partialReleases : [];

  const toNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // 1) Si NO hay areaResponse (caso parcial puro), sumar por parciales
  if (!areaResp) {
    const goodFromPartials = partials.reduce((s: number, p: any) => s + toNum(p?.quantity), 0);
    const excessFromPartials = partials.reduce((s: number, p: any) => s + toNum(p?.excess_quantity), 0);
    return goodFromPartials + excessFromPartials;
  }

  // 2) Hay areaResponse: usar release/good/plates y excedente del bloque
  const releaseTotal =
    toNum(areaResp.release_quantity ?? areaResp.good_quantity ?? areaResp.plates);
  const excessBlock = toNum(areaResp.excess_quantity);

  // Sumas por parciales (si existen)
  const goodFromPartials = partials.reduce((s: number, p: any) => s + toNum(p?.quantity), 0);
  const excessFromPartials = partials.reduce((s: number, p: any) => s + toNum(p?.excess_quantity), 0);

  // Remanente (si el bloque tiene total mayor a lo ya fraccionado en parciales)
  const remainder = Math.max(releaseTotal - goodFromPartials, 0);

  // Buenas efectivas:
  // - Si hay parciales, preferimos parciales + remanente.
  // - Si no hay parciales, usamos el total del bloque.
  const effectiveGood =
    partials.length > 0 ? goodFromPartials + remainder : releaseTotal;

  // Excedente efectivo:
  // - Si el bloque trae excedente, úsalo.
  // - Si no, y hay parciales, usa el excedente sumado de parciales.
  const effectiveExcess = excessBlock || excessFromPartials;

  return effectiveGood + effectiveExcess;
}