// myorg/apps/frontend-mobile/src/components/SeguimientoDeOts/util/quality.ts

// Interfaz mínima para no acoplar al tipo completo del page.tsx
export interface AreaLike {
  id: number;
  answers?: Array<{
    created_at: string;
    sample_quantity?: number | null;
    reviewer?: { username?: string | null } | null;
  }> | null;
  parciales?: number;
  partials?: Array<{ quantity?: number | null }> | null;
  response?: Record<string, any> | null;
}

// Mapa local para detectar el bloque del área
const AREA_KEY_BY_ID: Record<number, string> = {
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

const getAreaKey = (area: AreaLike) => AREA_KEY_BY_ID[area.id] ?? null;

// Total “bueno” definido por bloque (release_quantity | good_quantity | plates)
function getAreaReleaseTotal(area: AreaLike): number {
  const key = getAreaKey(area);
  const block: any = key ? area.response?.[key] : null;
  if (!block) return 0;
  return block?.release_quantity ?? block?.good_quantity ?? block?.plates ?? 0;
}

// Suma de cantidades de parciales (si existen)
function getSumParciales(area: AreaLike): number {
  const list = area.partials ?? [];
  return list.reduce((acc, p) => acc + (p?.quantity ?? 0), 0);
}

// Resto/remanente
export function getRemainder(area: AreaLike): number {
  return Math.max(getAreaReleaseTotal(area) - getSumParciales(area), 0);
}
export function getSingleCqm(area: AreaLike): number {
  const last = getLastAnswer(area);
  return Number(last?.sample_quantity ?? 0);
}

// Último answer por created_at (desc)
export function getLastAnswer(area: AreaLike) {
  const arr = area.answers ?? [];
  if (!arr.length) return null;
  return [...arr].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

// Nombre del revisor mostrado en tabla
export function getReviewerNameFromAnswer(ans: any): string {
  return ans?.reviewer?.username ?? '—';
}

/**
 * Devuelve los nombres de revisor por columna (P1..Pn y Rem si aplica),
 * alineados por fecha de creación (ascendente) como haces con sample_quantity.
 */
export function getPerPartialReviewers(area: AreaLike): string[] {
  const parc = area.parciales || 0;
  const hasRem = getRemainder(area) > 0;
  const cols = parc + (hasRem ? 1 : 0);

  const answersSorted = [...(area.answers ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const values: string[] = Array(cols).fill('—');

  // P1..Pn (match 1:1 con answers[0..parc-1])
  for (let i = 0; i < parc; i++) {
    const ans = answersSorted[i];
    if (!ans) continue;
    values[i] = getReviewerNameFromAnswer(ans);
  }

  // ✅ Rem: SOLO si existe answers[parc]; si no, queda '—'
  if (hasRem) {
    const remIndex = cols - 1;
    const remAns = answersSorted[parc]; // sin fallback
    values[remIndex] = getReviewerNameFromAnswer(remAns);
  }

  return values;
}
export function getPerPartialCqm(area: AreaLike): number[] {
    const parc = area.parciales || 0;
    const hasRem = getRemainder(area) > 0;
    const cols = parc + (hasRem ? 1 : 0);
  
    const answersSorted = [...(area.answers ?? [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  
    const values: number[] = Array(cols).fill(0);
  
    for (let i = 0; i < parc; i++) {
      const ans = answersSorted[i];
      if (!ans) continue;
      values[i] = Number(ans.sample_quantity ?? 0);
    }
  
    // ✅ Rem: SOLO si existe answers[parc]; si no, queda 0
    if (hasRem) {
      const remIndex = cols - 1;
      const remAns = answersSorted[parc]; // sin fallback
      values[remIndex] = Number(remAns?.sample_quantity ?? 0);
    }
  
    return values;
  }
