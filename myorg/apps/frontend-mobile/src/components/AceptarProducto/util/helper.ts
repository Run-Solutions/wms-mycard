// --- Tipos base (ajústalos a tus modelos reales) ---
type AreaKey =
  | 'prepress' | 'impression' | 'serigrafia' | 'empalme' | 'laminacion'
  | 'corte' | 'colorEdge' | 'hotStamping' | 'millingChip' | 'personalizacion';

type AreaData = {
  good_quantity?: number;
  bad_quantity?: number;
  excess_quantity?: number;
  comments?: string;
  formAuditory?: {
    sample_auditory?: number | string;
    user?: { username?: string };
  };
};

type AreaResponse = Partial<Record<AreaKey, AreaData>>;

type PartialRelease = {
  validated: boolean;
  quantity?: number;
  bad_quantity?: number;
  excess_quantity?: number;
  observation?: string;
  created_at: string | Date;
  formAuditory?: {
    sample_auditory?: number | string;
    user?: { username?: string };
  };
};

type LastCompletedOrPartial = {
  areaResponse?: AreaResponse;
  partialReleases: PartialRelease[];
};

// La forma mínima común que esperan tus componentes por área.
// Si necesitas variantes (p.ej. ColorEdgeData, CorteData), puedes extender de esta.
export type BaseAreaFormData = {
  good_quantity: number | string;
  bad_quantity: number | string;
  excess_quantity: number | string;
  comments: string;
  sample_quantity: number | string;
  auditor: string;
};

// --- Tu mapping existente ---
export const areaKeyById: Record<number, AreaKey> = {
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

function mapAreaToDefaults<T extends BaseAreaFormData = BaseAreaFormData>(area: AreaData): T {
    return {
      good_quantity: area.good_quantity ?? '',
      bad_quantity: area.bad_quantity ?? '',
      excess_quantity: area.excess_quantity ?? '',
      comments: area.comments ?? '',
      sample_quantity: area.formAuditory?.sample_auditory ?? '',
      auditor: area.formAuditory?.user?.username ?? '',
    } as T;
  }
// --- Helper genérico ---
export function computeAreaDefaults<T extends BaseAreaFormData = BaseAreaFormData>(
    areaKey: AreaKey,
    lastCompletedOrPartial: LastCompletedOrPartial
  ): T | undefined {
    if (!lastCompletedOrPartial) return;
 
    const area = lastCompletedOrPartial.areaResponse?.[areaKey];
    const partials = lastCompletedOrPartial.partialReleases || [];
  

    const allValidated = partials.length > 0 && partials.every(p => p.validated);
  
    if (area && partials.length === 0) {
      // ⬇️ 2) Usa el nombre nuevo (y seguro)
      return mapAreaToDefaults<T>(area);
    } else if (area && allValidated) {
      const sum = (arr: PartialRelease[], selector: (p: PartialRelease) => number) =>
        arr.reduce((acc, p) => acc + (selector(p) || 0), 0);
  
      const totalGood = sum(partials, p => p.quantity ?? 0);
      const totalBad = sum(partials, p => p.bad_quantity ?? 0);
      const totalExcess = sum(partials, p => p.excess_quantity ?? 0);
  
      return {
        good_quantity: Math.max((area.good_quantity ?? 0) - totalGood, 0),
        bad_quantity: Math.max((area.bad_quantity ?? 0) - totalBad, 0),
        excess_quantity: Math.max((area.excess_quantity ?? 0) - totalExcess, 0),
        comments: area.comments ?? '',
        sample_quantity: area.formAuditory?.sample_auditory ?? '',
        auditor: area.formAuditory?.user?.username ?? '',
      } as T;
    }
  
    const byDateDesc = (a: PartialRelease, b: PartialRelease) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  
    const firstUnvalidated = partials.filter(p => !p.validated).sort(byDateDesc)[0]
      ?? partials.sort(byDateDesc)[0];
  
    return {
      good_quantity: firstUnvalidated?.quantity ?? '',
      bad_quantity: firstUnvalidated?.bad_quantity ?? '',
      excess_quantity: firstUnvalidated?.excess_quantity ?? '',
      comments: firstUnvalidated?.observation ?? '',
      sample_quantity: firstUnvalidated?.formAuditory?.sample_auditory ?? '',
      auditor: firstUnvalidated?.formAuditory?.user?.username ?? '',
    } as T;
  }