// myorg/apps/frontend-web/src/components/SeguimientoDeOts/util/quality.ts

// Interfaz mínima para no acoplar al tipo completo del page.tsx
export interface AreaLike {
  id: number;
  answers?: Array<{
    created_at: string;
    sample_quantity?: number | null;
    reviewer?: { username?: string | null } | null;
  }> | null;
  parciales?: number;
  response?: Record<string, any> | null;

  // Añadir partialReleases con formAuditory
  partials?: Array<{
    created_at: string;
    quantity?: number | null
    formAuditory?: {
      created_at: string;
      user?: { username?: string | null } | null;
    } | null;
  }> | null;
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

type MiniAud = { created_at: string; username: string | null };

export function getLastAuditor(areaOrFlowItem: any): MiniAud | null {
  const areaId = areaOrFlowItem?.area_id ?? areaOrFlowItem?.id ?? null;
  const key = AREA_KEY_BY_ID[areaId ?? -1] ?? null;
  console.log('getLastAuditor',key);

  const candidates: MiniAud[] = [];

  // 1) Auditores en PARCIALES
  const prs = areaOrFlowItem?.partialReleases ?? [];
  for (const pr of prs) {
    const fa = pr?.formAuditory;
    if (!fa) continue;
    candidates.push({
      created_at: fa.created_at ?? pr?.created_at ?? '',
      username: fa?.user?.username ?? null,
    });
  }

  // 2) Auditor en areaResponse.<bloque>.formAuditory (ej: corte, colorEdge, etc.)
  if (key) {
    const block = areaOrFlowItem?.response?.[key];
    const fa = block?.formAuditory;
    if (fa) {
      candidates.push({
        created_at: fa.created_at ?? block?.created_at ?? '',
        username: fa?.user?.username ?? null,
      });
    }
  }
  console.log('CANDIDATES', candidates)

  if (!candidates.length) return null;

  candidates.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return candidates[0];
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
export function getPerPartialAuditors(area: AreaLike): string[] {
  const parc = area.parciales || 0;
  console.log(area)
  const hasRem = getRemainder(area) > 0;
  const cols = parc + (hasRem ? 1 : 0);

  type MiniAud = { created_at: string; username: string | null };
  const partialAuditories: MiniAud[] =
    (area.partials ?? [])
      .map(pr => {
        const fa = pr?.formAuditory;
        if (!fa) return null;
        return {
          created_at: fa.created_at ?? pr.created_at,
          username: fa.user?.username ?? null,
        } as MiniAud;
      })
      .filter(Boolean) as MiniAud[];

      console.log('aud', partialAuditories);
  // Orden cronológico
  partialAuditories.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const values: string[] = Array(cols).fill('—');

  // P1..Pn (match 1:1 con answers[0..parc-1])
  for (let i = 0; i < parc; i++) {
    const aud = partialAuditories[i];
    if (!aud) continue;
    values[i] = aud.username ?? '—';
  }

  // ✅ Rem: SOLO si existe answers[parc]; si no, queda '—'
  if (hasRem) {
    const remIndex = cols - 1;
    const remAns = partialAuditories[parc]; // sin fallback
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
