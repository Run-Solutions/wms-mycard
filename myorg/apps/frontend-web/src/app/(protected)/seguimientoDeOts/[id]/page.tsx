// myorg/apps/frontend-web/src/app/(protected)/seguimientoDeOts/[id]/page.tsx
'use client';

import React, {
  use,
  useState,
  Fragment,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';

import { Card, CardContent } from '@/components/ui/card';
import ProgressBarAreas from '@/components/SeguimientoDeOts/ProgressBarAreas';
import InconformitiesHistory from '@/components/SeguimientoDeOts/InconformitiesHistory';
import BadQuantityModal, {
  AreaForBadQty,
  BadQuantityModalResult,
} from '@/components/SeguimientoDeOts/BadQuantityModal';
import PartialHistory from '@/components/SeguimientoDeOts/PartialHistory';
import { VistosBuenosHistory } from '@/components/SeguimientoDeOts/VistosBuenosHistory';
import { AreaTotalsForPartialHistory } from '@/components/SeguimientoDeOts/PartialHistory';

import {
  fetchWorkOrderById,
  fetchAllUsers,
  updateFlowAssignedUser,
  closeWorkOrder,
  updateWorkOrderAreas,
  updateAreaResponseData,
  getFileByName,
} from '@/api/seguimientoDeOts';

import {
  getPerPartialReviewers,
  getLastAnswer,
  getSingleCqm,
  getReviewerNameFromAnswer,
  getPerPartialCqm,
  getPerPartialAuditors,
  getLastAuditor,
} from '@/components/SeguimientoDeOts/util/quality';

// ========================================================
// Types
// ========================================================

type BlockKey =
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

const areaBlockMap: Record<number, BlockKey> = {
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

type ResponseBlock = {
  id: number;
  bad_quantity?: number;
  material_quantity?: number;
};

type BadSummaryValue = {
  label: string;
  value: number;
};

type BadSummaryEntry = {
  areaId: number;
  areaName: string;
  values: BadSummaryValue[];
};

const pickBlock = (
  resp: any, // si tienes tipo Area['response'], úsalo aquí
  key: BlockKey | undefined
): ResponseBlock | undefined => {
  if (!resp || !key) return undefined;
  return (resp as Partial<Record<BlockKey, ResponseBlock>>)[key];
};

const normalizeAreaKey = (name?: string | null) =>
  (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s/g, '');

const resolveBlockKey = (name?: string | null): BlockKey | null => {
  const key = normalizeAreaKey(name);
  const map: Record<string, BlockKey> = {
    preprensa: 'prepress',
    impresion: 'impression',
    serigrafia: 'serigrafia',
    empalme: 'empalme',
    laminacion: 'laminacion',
    corte: 'corte',
    coloredge: 'colorEdge',
    'color edge': 'colorEdge',
    millingchip: 'millingChip',
    'milling chip': 'millingChip',
    hotstamping: 'hotStamping',
    personalizacion: 'personalizacion',
  };
  return map[key] ?? null;
};

const blockSupportsMaterial = (block?: BlockKey | null) =>
  !!block &&
  ['corte', 'colorEdge', 'millingChip', 'personalizacion'].includes(block);

const normalizeSummaryLabel = (label?: string) =>
  String(label ?? '')
    .normalize('NFD')
    .replace(/\u0300-\u036f/g, '')
    .trim()
    .toLowerCase();

interface Props {
  params: Promise<{ id: string }>;
}

export type AreaData = {
  id: number;
  name: string;
  status: string;
  isCollator: boolean;
  response: {
    prepress: { id: number; bad_quantity?: number; material_quantity?: number };
    impression: {
      id: number;
      bad_quantity?: number;
      material_quantity?: number;
    };
    serigrafia: {
      id: number;
      bad_quantity?: number;
      material_quantity?: number;
    };
    empalme: { id: number; bad_quantity?: number; material_quantity?: number };
    laminacion: {
      id: number;
      bad_quantity?: number;
      material_quantity?: number;
    };
    corte: { id: number; bad_quantity?: number; material_quantity?: number };
    colorEdge: {
      id: number;
      bad_quantity?: number;
      material_quantity?: number;
    };
    millingChip: {
      id: number;
      bad_quantity?: number;
      material_quantity?: number;
    };
    hotStamping: {
      id: number;
      bad_quantity?: number;
      material_quantity?: number;
    };
    personalizacion: {
      id: number;
      bad_quantity?: number;
      material_quantity?: number;
    };
    user: {
      username: string;
    };
  };
  answers: any[];
  usuario: string;
  auditor: string;
  buenas: number;
  malas: number;
  cqm: number;
  excedente: number;
  noprocess: number;
  defectuoso: number;
  muestras: number;
  flowId?: number;
  assigned_user_id?: number | null;

  badQuantitySummary?: BadSummaryEntry[];

  parciales: number; // total de parciales creados
  parcialesValidados: number;
  partials: Array<{
    id: number;
    quantity: number;
    bad_quantity: number;
    excess_quantity: number;
    material_quantity: number;
    noprocess_quantity: number;
    user_id: number | null; // 👈 puede venir null
    validated: boolean;
    release_quantity?: number; // 👈 cantidad liberada
    user?: { username: string } | null; // 👈 opcional
    formAuditory?: {
      created_at: string;
      sample_auditory: string;
      user?: { username?: string | null } | null;
    } | null;
    created_at: string;
    badQuantityDetails?: Array<{
      id: number;
      target_area_id: number;
      source_area_id: number;
      bad_quantity?: number;
      material_quantity?: number;
      targetArea?: { id: number; name: string } | null;
      sourceArea?: { id: number; name: string } | null;
    }>;
  }>;
};

export type InconformityData = {
  id: number;
  comments: string;
  createdAt: string;
  createdBy: string;
  area: string;
};

export type OperatorUser = {
  id: number;
  username: string;
  areasOperator?: { id: number; name: string };
};

export type NumericField =
  | 'buenas'
  | 'malas'
  | 'excedente'
  | 'noprocess'
  | 'defectuoso'
  | 'cqm'
  | 'muestras';

// ========================================================
// Constants & Utils
// ========================================================

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

const FALLBACK_FIELDS = [
  'good_quantity',
  'excess_quantity',
  'noprocess_quantity',
  'material_quantity',
  'plates',
];

const getAreaKey = (area: AreaData) => AREA_KEY_BY_ID[area.id] ?? null;

const toNum = (v: any) =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v) || 0;

const getAreaBlock = (area: any) => {
  const key = getAreaKey(area);
  if (!key) return null;
  const fromResponse =
    area?.response && typeof area.response === 'object'
      ? area.response[key]
      : undefined;
  // fallback si viene plano (p. ej. area.corte)
  return fromResponse ?? area?.[key] ?? null;
};

// ---- Remainders (by field) ----

const buildAreaTotalsByAreaId = (
  wo: any
): Record<number, AreaTotalsForPartialHistory> => {
  const map: Record<number, AreaTotalsForPartialHistory> = {};
  const flows = wo?.flow ?? [];

  flows.forEach((item: any) => {
    const areaId = item?.area_id;
    if (!areaId) return;

    const areaKey = AREA_KEY_BY_ID[areaId];
    const block = item?.areaResponse?.[areaKey];

    if (!block) return;

    map[areaId] = {
      good_or_release_or_plates: toNum(
        block.release_quantity ?? block.good_quantity ?? block.plates
      ),
      bad_quantity: toNum(block.bad_quantity),
      excess_quantity: toNum(block.excess_quantity),
      noprocess_quantity: toNum(block.noprocess_quantity),
      material_quantity: toNum(block.material_quantity),
    };
  });

  return map;
};

const getRemainderByField = (
  area: AreaData,
  field: 'buenas' | 'malas' | 'excedente' | 'noprocess' | 'defectuoso'
) => {
  const block = getAreaBlock(area) as any;
  if (!block) return 0;

  // ✅ caso especial para "malas": usar SOLO detalles no liberados
  if (field === 'malas') {
    const unreleasedFromDetails = (area.partials ?? []).reduce((acc, p) => {
      const details = p.badQuantityDetails ?? [];
      const sumUnreleased = details.reduce((dacc, detail: any) => {
        const isUnreleased = detail?.partial_release_id == null; // null o undefined
        return isUnreleased ? dacc + toNum(detail?.bad_quantity) : dacc;
      }, 0);
      return acc + sumUnreleased;
    }, 0);

    return toNum(unreleasedFromDetails);
  }

  // ↙️ para el resto, se mantiene tu lógica actual
  let total = 0;
  let parcialesSum = 0;

  switch (field) {
    case 'buenas':
      total = toNum(
        block.release_quantity ?? block.good_quantity ?? block.plates
      );
      parcialesSum = (area.partials ?? []).reduce(
        (acc, p) => acc + toNum(p?.quantity),
        0
      );
      break;
    case 'excedente':
      total = toNum(block.excess_quantity);
      parcialesSum = (area.partials ?? []).reduce(
        (acc, p) => acc + toNum(p?.excess_quantity),
        0
      );
      break;
    case 'noprocess':
      total = toNum(block.noprocess_quantity);
      parcialesSum = (area.partials ?? []).reduce(
        (acc, p) => acc + toNum(p?.noprocess_quantity),
        0
      );
      break;
    case 'defectuoso':
      total = toNum(block.material_quantity);
      parcialesSum = (area.partials ?? []).reduce(
        (acc, p) => acc + toNum(p?.material_quantity),
        0
      );
      break;
  }

  return Math.max(total - parcialesSum, 0);
};

const getRemainderBySum = (
  area: AreaData,
  field: 'buenas' | 'malas' | 'excedente' | 'noprocess' | 'defectuoso'
) => {
  const block = getAreaBlock(area) as any;
  if (!block) return 0;

  let total = 0;

  switch (field) {
    case 'buenas':
      total = toNum(
        block.release_quantity ?? block.good_quantity ?? block.plates
      );

      break;
    case 'malas':
      total = toNum(block.bad_quantity);

      break;
    case 'excedente':
      total = toNum(block.excess_quantity);

      break;
    case 'noprocess':
      total = toNum(block.noprocess_quantity);

      break;
    case 'defectuoso':
      total = toNum(block.material_quantity);

      break;
  }

  return Math.max(total, 0);
};

const getRemainder = (area: AreaData) => getRemainderByField(area, 'buenas');

const getPerPartialValues = (
  area: AreaData,
  field: 'cqm' | 'muestras' | 'defectuoso'
) => {
  const parc = area.parciales || 0;
  const hasRem = getRemainder(area) > 0;
  const cols = parc + (hasRem ? 1 : 0);

  const answersSorted = [...(area.answers ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const values: Array<number | string> = Array(cols).fill(0);

  for (let i = 0; i < parc; i++) {
    if (field === 'defectuoso') {
      values[i] = area.partials?.[i]?.material_quantity ?? 0;
    } else if (field === 'cqm') {
      values[i] = answersSorted[i]?.sample_quantity ?? 0;
    } else if (field === 'muestras') {
      values[i] = area.partials?.[i]?.formAuditory?.sample_auditory ?? '—';
    }
  }

  if (hasRem) {
    const block = (area.response as any)?.[getAreaKey(area)];
    const remIndex = cols - 1;

    if (field === 'defectuoso') {
      const totalDefectuoso = block?.material_quantity ?? 0;
      const sumParcialDefectuoso = (area.partials ?? []).reduce(
        (acc, p) => acc + (p?.material_quantity ?? 0),
        0
      );
      values[remIndex] = Math.max(totalDefectuoso - sumParcialDefectuoso, 0);
    } else if (field === 'cqm') {
      const remAns =
        answersSorted[parc] ?? answersSorted[answersSorted.length - 1];
      values[remIndex] = remAns?.sample_quantity ?? 0;
    } else if (field === 'muestras') {
      values[remIndex] = block?.formAuditory?.sample_auditory ?? '—';
    }
  }
  return values;
};

const getLastPartial = (area: AreaData) => {
  const list = area.partials ?? [];
  if (!list.length) return null;
  return [...list].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[list.length - 1];
};

const getPartialUserName = (
  p: AreaData['partials'][number] | null | undefined,
  area: AreaData,
  operatorByIdMap: Map<number, string>
) =>
  p?.user?.username ??
  (p?.user_id != null ? operatorByIdMap.get(p.user_id) : undefined) ??
  area.usuario ??
  'No definido';

// ---- Area data builder (by areaId) ----
const getAreaData = (
  areaId: number,
  areaResponse: any,
  partialReleases: any[] = [],
  flowUser: any = null
) => {
  const parciales = partialReleases.length;
  const parcialesValidados = partialReleases.filter((p) => p?.validated).length;

  const sumFromPartials = () =>
    partialReleases.reduce(
      (acc: any, curr: any) => {
        acc.buenas += curr.quantity || 0;
        acc.malas += curr.bad_quantity || 0;
        acc.excedente += curr.excess_quantity || 0;
        acc.noprocess += curr.noprocess_quantity || 0;
        acc.defectuoso += curr.material_quantity || 0;
        return acc;
      },
      { buenas: 0, malas: 0, excedente: 0, noprocess: 0, defectuoso: 0 }
    );

  const getCommonData = (areaKey: string) => {
    const hasResponse = !!areaResponse?.[areaKey];
    const usuario = areaResponse?.user?.username || flowUser?.username || '';
    const auditor = areaResponse?.[areaKey]?.formAuditory?.user?.username || '';

    if (!hasResponse && parciales > 0) {
      const resumen = sumFromPartials();
      return {
        ...resumen,
        cqm: 0,
        muestras: 0,
        usuario,
        auditor,
        parciales,
        parcialesValidados,
        partials: partialReleases,
      };
    }

    return {
      buenas:
        areaResponse?.[areaKey]?.good_quantity ||
        areaResponse?.[areaKey]?.release_quantity ||
        areaResponse?.[areaKey]?.plates ||
        0,
      malas: areaResponse?.[areaKey]?.bad_quantity || 0,
      excedente: areaResponse?.[areaKey]?.excess_quantity || 0,
      noprocess: areaResponse?.[areaKey]?.noprocess_quantity || 0,
      defectuoso: areaResponse?.[areaKey]?.material_quantity || 0,
      cqm: areaResponse?.[areaKey]?.form_answer?.sample_quantity ?? 0,
      muestras: areaResponse?.[areaKey]?.formAuditory?.sample_auditory ?? 0,
      usuario,
      auditor,
      parciales,
      parcialesValidados,
      partials: partialReleases,
    };
  };

  switch (areaId) {
    case 1:
      return getCommonData('prepress');
    case 2:
      return getCommonData('impression');
    case 3:
      return getCommonData('serigrafia');
    case 4:
      return getCommonData('empalme');
    case 5:
      return getCommonData('laminacion');
    case 6:
      return getCommonData('corte');
    case 7:
      return getCommonData('colorEdge');
    case 8:
      return getCommonData('hotStamping');
    case 9:
      return getCommonData('millingChip');
    case 10:
      return getCommonData('personalizacion');
    default:
      return {
        buenas: 0,
        malas: 0,
        excedente: 0,
        noprocess: 0,
        defectuoso: 0,
        cqm: 0,
        muestras: 0,
        usuario: '',
        auditor: '',
        parciales: 0,
        parcialesValidados: 0,
        partials: [],
      };
  }
};

const guessMimeFromName = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
};

function sumDetailFromPartial(
  partial: AreaData['partials'][number] | null | undefined,
  ownerSourceId: number,
  targetAreaId: number
) {
  let bad = 0;
  let mat = 0;
  if (!partial) return { bad, mat };
  const list = Array.isArray(partial.badQuantityDetails)
    ? partial.badQuantityDetails
    : [];
  for (const d of list) {
    if (
      Number(d?.source_area_id) === Number(ownerSourceId) &&
      Number(d?.target_area_id) === Number(targetAreaId)
    ) {
      bad += toNum(d?.bad_quantity);
      mat += toNum(d?.material_quantity);
    }
  }
  return { bad, mat };
}

// Suma malas/material del REMANENTE (partial_release_id == null) para (source, target)
function sumDetailFromRem(
  workOrder: any,
  ownerSourceId: number,
  targetAreaId: number
) {
  let bad = 0;
  let mat = 0;
  const flows = Array.isArray(workOrder?.flow) ? workOrder.flow : [];
  for (const f of flows) {
    const details = Array.isArray(f?.badQuantityDetails)
      ? f.badQuantityDetails
      : [];
    for (const d of details) {
      if (d?.partial_release_id != null) continue; // solo REM
      if (
        Number(d?.source_area_id) === Number(ownerSourceId) &&
        Number(d?.target_area_id) === Number(targetAreaId)
      ) {
        bad += toNum(d?.bad_quantity);
        mat += toNum(d?.material_quantity);
      }
    }
  }
  return { bad, mat };
}

// ========================================================
// Component
// ========================================================

export default function SeguimientoDeOtsAuxPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  // ---- State ----
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [operatorUsers, setOperatorUsers] = useState<OperatorUser[]>([]);
  const [vistosBuenosHistory, setVistosBuenosHistory] = useState([]);
  const [inconformities, setInconformities] = useState<InconformityData[]>([]);

  const [loading, setLoading] = useState(true);
  const [progressWidth, setProgressWidth] = useState(0);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<{
    [key: string]: string;
  }>({});

  const [qualitySectionOpen, setQualitySectionOpen] = useState(false);
  const [partialSectionOpen, setPartialSectionOpen] = useState(false);
  const [inconformitySectionOpen, setInconformitySectionOpen] = useState(false);

  const [badModalOwner, setBadModalOwner] = useState<AreaData | null>(null);
  const [badModalPartial, setBadModalPartial] = useState<
    AreaData['partials'][number] | null
  >(null);
  const [modalAreas, setModalAreas] = useState<AreaForBadQty[]>([]);
  const modalBaselineRef = useRef<
    Map<
      number,
      { bad: number; material: number | null; supportsMaterial: boolean }
    >
  >(new Map());

  // Totales REM (solo detalles con partial_release_id === null)
  const remBadBySourceTarget = useMemo(() => {
    const map = new Map<number, Map<number, { bad: number; mat: number }>>();

    const flows = workOrder?.flow ?? [];
    flows.forEach((f: any) => {
      (f?.badQuantityDetails ?? []).forEach((d: any) => {
        // 👈 Solo REM
        if (d?.partial_release_id == null) {
          const sourceId = Number(d?.source_area_id) || 0;
          const targetId = Number(d?.target_area_id) || 0;
          if (!sourceId || !targetId) return;

          const bad = toNum(d?.bad_quantity);
          const mat = toNum(d?.material_quantity);

          if (!map.has(sourceId)) map.set(sourceId, new Map());
          const tgt = map.get(sourceId)!;
          const prev = tgt.get(targetId) ?? { bad: 0, mat: 0 };
          tgt.set(targetId, { bad: prev.bad + bad, mat: prev.mat + mat });
        }
      });
    });

    return map;
  }, [workOrder]);

  // Indexa totales de MALAS por P1..Pn y REM a nivel de cada flow (área)
  const pxTotalsByAreaId = useMemo(() => {
    const map = new Map<
      number,
      { orderLabels: string[]; totals: Record<string, number> }
    >();

    const flows = workOrder?.flow ?? [];
    flows.forEach((f: any) => {
      const areaId = Number(f?.area_id);
      if (!areaId) return;

      // 1) Ordena los parciales por fecha y crea mapping pr.id -> P#
      const prs = Array.isArray(f?.partialReleases)
        ? [...f.partialReleases]
        : [];
      prs.sort(
        (a: any, b: any) =>
          new Date(a?.created_at).getTime() - new Date(b?.created_at).getTime()
      );
      const prLabelById = new Map<number, string>(
        prs.map((pr: any, i: number) => [Number(pr?.id), `P${i + 1}`])
      );

      // 2) Suma malas por etiqueta Px o REM desde badQuantityDetails del FLOW
      const totals: Record<string, number> = {};
      const details = Array.isArray(f?.badQuantityDetails)
        ? f.badQuantityDetails
        : [];
      for (const d of details) {
        const prId =
          d?.partial_release_id == null ? null : Number(d.partial_release_id);
        const label =
          prId == null ? 'REM' : prLabelById.get(prId) ?? `PR#${prId}`;
        const bad = Number(d?.bad_quantity) || 0;
        totals[label] = (totals[label] || 0) + bad;
      }

      // 3) Orden natural de salida: P1..Pn y, si aplica, REM al final
      const orderLabels = [
        ...prs
          .map((pr: any) => prLabelById.get(Number(pr?.id))!)
          .filter(Boolean),
        ...(totals['REM'] ? ['REM'] : []),
      ];

      map.set(areaId, { orderLabels, totals });
    });

    return map;
  }, [workOrder]);

  // Helpers para consumir arriba:
  const getPxTotal = (areaId: number, partialIndex: number) => {
    const entry = pxTotalsByAreaId.get(Number(areaId));
    if (!entry) return 0;
    const label = entry.orderLabels[partialIndex];
    return entry.totals[label] || 0;
  };

  const getRemTotal = (areaId: number) => {
    const entry = pxTotalsByAreaId.get(Number(areaId));
    const remFromDetails = Number(entry?.totals?.['REM'] ?? 0);

    const area = areas.find((a) => a.id === areaId);
    const blockKey = areaBlockMap[areaId];
    const selfBad = Number(area?.response?.[blockKey]?.bad_quantity ?? 0);

    // 🔍 Corrige la prioridad: si selfBad es mayor, úsalo
    // y solo usa remFromDetails si es realmente superior
    if (selfBad > remFromDetails) {
      return selfBad;
    }

    // si ambos son 0 o iguales, devuelve el mayor
    return Math.max(remFromDetails, selfBad);
  };

  // ---- Operators maps ----
  const operatorOptionsByAreaId = useMemo(() => {
    const map = new Map<number, Array<{ id: number; username: string }>>();
    operatorUsers.forEach((u) => {
      const aId = u.areasOperator?.id;
      if (!aId) return;
      if (!map.has(aId)) map.set(aId, []);
      map.get(aId)!.push({ id: u.id, username: u.username });
    });
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.username.localeCompare(b.username));
      map.set(k, arr);
    }
    return map;
  }, [operatorUsers]);

  const operatorById = useMemo(() => {
    const m = new Map<number, string>();
    operatorUsers.forEach((u) => m.set(u.id, u.username));
    return m;
  }, [operatorUsers]);

  const getUserOptionsForArea = (areaId: number) =>
    operatorOptionsByAreaId.get(areaId) ?? [];

  // ---- Operator modal ----
  type PartialType = AreaData['partials'][number] | null;
  const [opModal, setOpModal] = useState<{
    open: boolean;
    area: AreaData | null;
    partial: PartialType;
    areaId: number | null;
    selectedUserId: number | null;
    search: string;
  }>({
    open: false,
    area: null,
    partial: null,
    areaId: null,
    selectedUserId: null,
    search: '',
  });

  const openOperatorModal = (area: AreaData, partial: PartialType) => {
    const currentId = partial?.user_id ?? area.assigned_user_id ?? null;
    setOpModal({
      open: true,
      area,
      partial,
      areaId: area.id ?? null,
      selectedUserId: currentId,
      search: '',
    });
  };

  const closeOperatorModal = () => setOpModal((s) => ({ ...s, open: false }));

  const areaTotalsByAreaId = useMemo(
    () => buildAreaTotalsByAreaId(workOrder),
    [workOrder]
  );

  // Suma de malas/material por área DESTINO a partir de TODOS los badQuantityDetails del flujo
  const badQtyAgg = useMemo(() => {
    const bySourceTarget = new Map<
      number,
      Map<number, { bad: number; mat: number; partial: boolean }>
    >();

    const flows = workOrder?.flow ?? [];
    flows.forEach((f: any) => {
      (f?.badQuantityDetails ?? []).forEach((d: any) => {
        const sourceId = Number(d?.source_area_id) || 0;
        const targetId = Number(d?.target_area_id) || 0;
        if (!sourceId || !targetId) return;

        const bad = toNum(d?.bad_quantity);
        const mat = toNum(d?.material_quantity);
        const isPartial = Number(d?.partial_release_id) > 0;

        if (!bySourceTarget.has(sourceId)) {
          bySourceTarget.set(sourceId, new Map());
        }
        const targetMap = bySourceTarget.get(sourceId)!;
        const prev = targetMap.get(targetId) ?? {
          bad: 0,
          mat: 0,
          partial: false,
        };

        targetMap.set(targetId, {
          bad: prev.bad + bad,
          mat: prev.mat + mat,
          partial: prev.partial || isPartial,
        });
      });
    });

    return { bySourceTarget };
  }, [workOrder]);

  const modalOptions = useMemo(() => {
    if (!opModal.areaId) return [];
    const base = getUserOptionsForArea(opModal.areaId);
    const q = opModal.search.trim().toLowerCase();
    return q ? base.filter((u) => u.username.toLowerCase().includes(q)) : base;
  }, [opModal.areaId, opModal.search, operatorOptionsByAreaId]);

  // ---- First-load reload workaround ----
  useEffect(() => {
    const alreadyReloaded = sessionStorage.getItem('alreadyReloaded');
    if (!alreadyReloaded) {
      sessionStorage.setItem('alreadyReloaded', 'true');
      window.location.reload();
    }
  }, []);

  // ---- Load data ----
  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      const data = await fetchWorkOrderById(id);
      const users = await fetchAllUsers();
      setOperatorUsers(users || []);
      setWorkOrder(data);

      // Vistos Buenos history
      const historyData =
        data.flow
          .filter((item: any) => item.answers?.length > 0)
          .map((item: any) => {
            const areaName = item.area?.name?.toLowerCase() || '';
            const mode = ['impresion'].includes(areaName) ? 'doble' : 'simple';
            return {
              areaName: item.area?.name || 'Sin nombre',
              username: item.user?.username || '',
              questions: item.area?.formQuestions || [],
              formAnswers: item.answers.map((a: any) => ({
                accepted: a.accepted,
                altura_chip: a.altura_chip,
                apariencia_quemado: a.apariencia_quemado,
                carga_aplicacion: a.carga_aplicacion,
                codigo_barras: a.codigo_barras,
                color: a.color,
                color_edge: a.color_edge,
                color_foil: a.color_foil,
                color_personalizacion: a.color_personalizacion,
                finish_validation: a.finish_validation,
                holographic_type: a.holographic_type,
                imagen_holograma: a.imagen_holograma,
                localizacion_contactos: a.localizacion_contactos,
                magnetic_band: a.magnetic_band,
                revisar_posicion: a.revisar_posicion,
                revisar_tecnologia: a.revisar_tecnologia,
                sample_quantity: a.sample_quantity,
                testtype_cqm: a.testtype_cqm,
                prueba_over: a.prueba_over,
                prueba_cinta_magnetica: a.prueba_cinta_magnetica,
                prueba_centro: a.prueba_centro,
                tipo_personalizacion: a.tipo_personalizacion,
                track_type: a.track_type,
                validar_inlays: a.validar_inlays,
                validar_kvc: a.validar_kvc,
                validar_kvc_perso: a.validar_kvc_perso,
                valor_anclaje: a.valor_anclaje,
                verificar_etiqueta: a.verificar_etiqueta,
                verificar_script: a.verificar_script,
                created_at: a.created_at,
                reviewer: a.reviewer || [],
                FormAnswerResponse: a.FormAnswerResponse || [],
              })),
              mode,
            };
          }) || [];

      setVistosBuenosHistory(historyData);

      // Áreas
      const areaData =
        data?.flow?.map((item: any) => ({
          id: item.area_id,
          name: item.area?.name || 'Sin nombre',
          status: item.status || 'Desconocido',
          isCollator: data.isCollator || false,
          response: item.areaResponse || {},
          answers: item.answers || [],
          flowId: item.id,
          assigned_user_id: item.assigned_user,
          badQuantitySummary: item.badQuantitySummary || [],
          ...getAreaData(
            item.area_id,
            item.areaResponse,
            item.partialReleases,
            item.user
          ),
        })) || [];

      setAreas(areaData);

      // Inconformidades (directas + parciales + auditorías)
      const allInconformities: InconformityData[] =
        data?.flow?.flatMap((flowItem: any) => {
          const areaName = flowItem.area?.name || 'Área desconocida';

          const direct =
            flowItem?.areaResponse?.inconformities?.map((inc: any) => ({
              id: inc.id,
              comments: inc.comments,
              createdAt: inc.created_at ?? inc.createdAt,
              createdBy: inc.user?.username || inc.created_by || 'Desconocido',
              area: areaName,
            })) || [];

          const partials =
            flowItem?.partialReleases?.flatMap((release: any) =>
              (release?.inconformities || []).map((inc: any) => ({
                id: inc.id,
                comments: inc.comments,
                createdAt: inc.created_at ?? inc.createdAt,
                createdBy:
                  inc.user?.username || inc.created_by || 'Desconocido',
                area: areaName,
              }))
            ) || [];

          const partialsAuditory =
            flowItem?.partialReleases?.flatMap((release: any) =>
              (release?.formAuditory?.inconformidades || []).map(
                (inc: any) => ({
                  id: inc.id,
                  comments: inc.comments,
                  createdAt: inc.created_at ?? inc.createdAt,
                  createdBy:
                    inc.user?.username || inc.created_by || 'Desconocido',
                  area: areaName,
                })
              )
            ) || [];

          const audits: InconformityData[] = [];
          if (flowItem.areaResponse) {
            Object.values(flowItem.areaResponse).forEach((block: any) => {
              if (block?.formAuditory?.inconformities) {
                block.formAuditory.inconformities.forEach((inc: any) => {
                  audits.push({
                    id: inc.id,
                    comments: inc.comments,
                    createdAt: inc.created_at,
                    createdBy: inc.user?.username || 'Desconocido',
                    area: areaName,
                  });
                });
              }
            });
          }

          return [...direct, ...partials, ...partialsAuditory, ...audits];
        }) || [];

      setInconformities(allInconformities);

      // Progreso
      const completedCount = areaData.filter(
        (a: any) => a.status === 'Completado'
      ).length;
      const percentage = areaData.length
        ? (completedCount / areaData.length) * 100
        : 0;
      setTimeout(() => setProgressWidth(percentage), 100);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ======================================================
  // Derived totals / helpers
  // ======================================================

  const areaColSpan = (area: AreaData) => {
    const base = Math.max(1, area.parciales || 0);
    const hasRem = area.parciales > 0 && getRemainder(area) > 0;
    return area.parciales > 0 ? base + (hasRem ? 2 : 0) : 1;
  };

  const badAgg = useMemo(() => {
    const bySourceTarget = new Map<
      number,
      Map<number, { bad: number; mat: number; partial: boolean }>
    >();

    const flows = workOrder?.flow ?? [];
    flows.forEach((f: any) => {
      (f?.badQuantityDetails ?? []).forEach((d: any) => {
        const sourceId = Number(d?.source_area_id) || 0;
        const targetId = Number(d?.target_area_id) || 0;
        if (!sourceId || !targetId) return;

        const bad = toNum(d?.bad_quantity);
        const mat = toNum(d?.material_quantity);
        const isPartial = Number(d?.partial_release_id) > 0;

        if (!bySourceTarget.has(sourceId)) {
          bySourceTarget.set(sourceId, new Map());
        }
        const targetMap = bySourceTarget.get(sourceId)!;
        const prev = targetMap.get(targetId) ?? {
          bad: 0,
          mat: 0,
          partial: false,
        };

        targetMap.set(targetId, {
          bad: prev.bad + bad,
          mat: prev.mat + mat,
          partial: prev.partial || isPartial,
        });
      });
    });

    return { bySourceTarget };
  }, [workOrder]);

  const sumBadBySource = (sourceId: number, includeSelf: boolean) => {
    const m = badAgg.bySourceTarget.get(Number(sourceId));
    if (!m) return 0;
    let total = 0;
    m.forEach((v, tId) => {
      if (!includeSelf && Number(tId) === Number(sourceId)) return;
      total += toNum(v.bad);
    });
    return total;
  };

  const getBlockKey = (areaId: number): BlockKey | undefined =>
    areaBlockMap[Number(areaId)];

  const getSelfBadAndMat = (area: AreaData) => {
    const block = getBlockKey(Number(area.id));
    const bad = toNum(area?.response?.[block as BlockKey]?.bad_quantity ?? 0);
    // si manejas material en response (p.ej. corte), úsalo; si no, 0.
    const mat = toNum(
      area?.response?.[block as BlockKey]?.material_quantity ?? 0
    );
    return { bad, mat };
  };

  const handleOpenBadQuantityModal = (
    ownerArea: AreaData,
    partial?: AreaData['partials'][number] | null
  ) => {
    const initialValues: Record<string, string> = {};
    const orderedAreas: AreaData[] = [];

    // ✅ Mostrar SIEMPRE las áreas 1..6 (si existen en la OT) + el área actual
    const PREV_IDS = [2, 3, 4, 5, 6];
    const prevTargets = PREV_IDS.map((id) =>
      areas.find((a) => Number(a.id) === id)
    ).filter(Boolean) as AreaData[];

    const pushUnique = (candidate?: AreaData | null) => {
      if (!candidate) return;
      if (!orderedAreas.some((x) => Number(x.id) === Number(candidate.id))) {
        orderedAreas.push(candidate);
      }
    };

    // 1) Agrega 1..6 en orden
    prevTargets.forEach((a) => pushUnique(a));
    // 2) Agrega el área actual (si no estaba ya)
    pushUnique(ownerArea);

    const modalAreaSummaries: AreaForBadQty[] = [];
    modalBaselineRef.current = new Map();

    orderedAreas.forEach((area) => {
      const key = normalizeAreaKey(area.name);
      const supportsMaterial = Number(area.id) >= 6; // < 6 no muestra "malo de fábrica"

      const sourceId = Number(ownerArea.id);
      const targetId = Number(area.id);

      // Trae el detalle desde parcial o remanente (como en tu lógica actual)
      let badValue = 0;
      let materialValue = 0;

      if (partial) {
        const { bad, mat } = sumDetailFromPartial(partial, sourceId, targetId);
        badValue = bad;
        materialValue = mat;
      } else {
        const { bad, mat } = sumDetailFromRem(workOrder, sourceId, targetId);
        badValue = bad;
        materialValue = mat;
      }

      // Fallback desde badQuantitySummary si no hay detalle
      const summaryEntry = Array.isArray(ownerArea.badQuantitySummary)
        ? ownerArea.badQuantitySummary.find(
            (e) => Number(e.areaId) === targetId
          )
        : null;

      if (!badValue && summaryEntry) {
        const badFromSummary = summaryEntry.values.find(
          (e: any) => normalizeSummaryLabel(e.label) === 'malas'
        );
        if (badFromSummary) badValue = toNum(badFromSummary.value);
      }
      if (supportsMaterial && !materialValue && summaryEntry) {
        const materialFromSummary = summaryEntry.values.find((e: any) => {
          const n = normalizeSummaryLabel(e.label);
          return n.includes('fabrica') || n.includes('materia');
        });
        if (materialFromSummary)
          materialValue = toNum(materialFromSummary.value);
      }

      // Baseline para deltas
      modalBaselineRef.current.set(targetId, {
        bad: Number(badValue) || 0,
        material: supportsMaterial ? Number(materialValue) || 0 : null,
        supportsMaterial,
      });

      // Inputs iniciales
      initialValues[`${key}_bad`] = String(Number(badValue) || 0);
      if (supportsMaterial) {
        initialValues[`${key}_material`] = String(Number(materialValue) || 0);
      }

      // Fila del modal
      modalAreaSummaries.push({
        id: targetId,
        name: area.name,
        malas: Number(badValue) || 0,
        defectuoso: supportsMaterial
          ? Number(materialValue) || 0
          : Number(area.defectuoso ?? 0),
        supportsMaterial,
      });
    });

    setModalAreas(modalAreaSummaries);
    setAreaBadQuantities(initialValues);
    setBadModalOwner(ownerArea);
    setBadModalPartial(partial ?? null);
    setShowBadQuantity(true);
  };

  const getAreaSumaTotal = (area: AreaData) => {
    const badToOthers = sumBadBySource(Number(area.id ?? 0), false);

    // Caso 1: Áreas con parciales (y con id >= 6)
    if (area.partials?.length && area.id >= 6) {
      const p = area.partials[0];
      const firstAnswer = area.answers?.[0];

      const buenas = Number(p?.quantity ?? 0);
      const malas = Number(p?.bad_quantity ?? 0);
      const excedente = Number(p?.excess_quantity ?? 0);
      const defectuoso = Number(p?.material_quantity ?? 0);
      const muestras = Number(p?.formAuditory?.sample_auditory ?? 0);
      const cqm = Number(firstAnswer?.sample_quantity ?? 0);
      const noprocess = Number(p?.noprocess_quantity ?? 0);

      return (
        buenas +
        malas +
        excedente +
        badToOthers +
        defectuoso +
        cqm +
        muestras +
        noprocess
      );
    }

    // Caso 2: Áreas con id < 6
    if (area.id < 6) {
      const buenas = Number(area.buenas ?? 0);
      const excedente = Number(area.excedente ?? 0);
      const defectuoso = Number(area.defectuoso ?? 0);
      const cqm = Number(area.cqm ?? 0);
      const muestras = Number(area.muestras ?? 0);
      const noprocess = Number(area.noprocess ?? 0);

      return (
        buenas +
        excedente +
        badToOthers +
        defectuoso +
        cqm +
        muestras +
        noprocess
      );
    }

    // Caso 3: Sin parciales (id >= 6 pero sin partials)
    // Caso 2: Áreas con id < 6
    if (area.id < 6) {
      const buenas = Number(area.buenas ?? 0);
      const excedente = Number(area.excedente ?? 0);
      const defectuoso = Number(area.defectuoso ?? 0);
      const cqm = Number(area.cqm ?? 0);
      const muestras = Number(area.muestras ?? 0);
      const noprocess = Number(area.noprocess ?? 0);

      return (
        buenas +
        excedente +
        badToOthers +
        defectuoso +
        cqm +
        muestras +
        noprocess
      );
    }

    // Caso 3: Sin parciales (id >= 6 pero sin partials)
    const buenas = Number(area.buenas ?? 0);
    const malas = Number(area.malas ?? 0);
    const excedente = Number(area.excedente ?? 0);
    const defectuoso = Number(area.defectuoso ?? 0);
    const cqm = Number(area.cqm ?? 0);
    const muestras = Number(area.muestras ?? 0);
    const noprocess = Number(area.noprocess ?? 0);

    return (
      buenas +
      malas +
      excedente +
      badToOthers +
      defectuoso +
      cqm +
      muestras +
      noprocess
    );
  };

  const cantidadHojasRaw = Number(workOrder?.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;
  const totalSheetsEffective = workOrder?.total_sheets ?? cantidadHojas;

  const ultimaArea = areas[areas.length - 1];
  const totalMalas = areas.reduce((acc, area) => {
    if (area.id < 6) {
      return 0; // ignora áreas menores a 6
    }

    const blockKey = getBlockKey(area.id);
    const badToOthers = toNum(sumBadBySource(area.id, false));
    const selfBad = toNum(
      pickBlock(area.response, blockKey)?.bad_quantity ?? 0
    );

    // parciales malas (solo si no hay selfBad)
    const partialsBad =
      selfBad > 0
        ? 0
        : (area.partials ?? []).reduce(
            (pAcc, p) => pAcc + toNum(p.bad_quantity),
            0
          );

    const areaTotalBad = badToOthers + selfBad + partialsBad;

    return acc + areaTotalBad;
  }, 0);
  const totalDefectuoso = areas.reduce(
    (acc, area) => acc + (area.defectuoso || 0),
    0
  );
  const totalCqm = areas
    .filter((area) => area.id >= 6)
    .reduce((acc, area) => acc + (area.cqm || 0), 0);
  const totalMuestras = areas.reduce((acc, area) => {
    if (area.partials.length > 0) {
      acc += area.partials.reduce(
        (pAcc, p) => pAcc + Number(p?.formAuditory?.sample_auditory ?? 0),
        0
      );
    }
    acc += area.muestras || 0;
    return acc;
  }, 0);
  const totalUltimaBuenas = ultimaArea?.buenas || 0;
  const totalUltimaExcedente = ultimaArea?.excedente || 0;
  const totalUltimaNoProcess = ultimaArea?.noprocess || 0;

  const totalGeneral =
    totalUltimaBuenas +
    totalUltimaExcedente +
    totalMalas +
    totalDefectuoso +
    totalCqm +
    totalMuestras;

  const getAnswerValue = (
    ans: any,
    field: 'defectuoso' | 'cqm' | 'muestras',
    area: any
  ) => {
    switch (field) {
      case 'cqm':
        return ans?.sample_quantity ?? 0;
      case 'muestras':
        return ans?.sample_auditory ?? '—';
      case 'defectuoso':
        return (
          area?.areaResponse?.impression?.bad_quantity ??
          area?.areaResponse?.prepress?.bad_quantity ??
          0
        );
      default:
        return 0;
    }
  };

  // ======================================================
  // Actions
  // ======================================================

  useEffect(() => {
    const alreadyReloaded = sessionStorage.getItem('alreadyReloaded');
    if (!alreadyReloaded) {
      sessionStorage.setItem('alreadyReloaded', 'true');
      window.location.reload();
    }
  }, []);
  console.log(vistosBuenosHistory);

  const handleChangeUser = async (
    area: AreaData,
    _partial: AreaData['partials'][number] | null,
    newUserId: number
  ) => {
    const prevAreas = areas;

    setAreas((prev) =>
      prev.map((a) =>
        a.id === area.id
          ? {
              ...a,
              assigned_user_id: newUserId,
              usuario: operatorById.get(newUserId) ?? a.usuario,
            }
          : a
      )
    );

    try {
      if (!area.flowId) throw new Error('Falta flowId del área');
      await updateFlowAssignedUser(area.flowId, newUserId);
    } catch (e) {
      setAreas(prevAreas);
      alert('No se pudo actualizar el encargado. Se revirtieron los cambios.');
    }
  };

  const handleCloseOrder = async () => {
    try {
      await closeWorkOrder(workOrder?.ot_id);
      router.push('/seguimientoDeOts');
    } catch (error) {
      console.log('Error al enviar datos:', error);
    }
  };

  const renderCell = (area: AreaData, field: NumericField) => {
    // 1. OT cerrada → lectura
    if (workOrder?.status === 'Cerrado')
      return <span>{Number(area[field] ?? 0)}</span>;

    // 2. Área no completada → lectura
    if (area.status !== 'Completado')
      return <span>{Number(area[field] ?? 0)}</span>;

    // 3. Preprensa → solo 'buenas' editable

    if (['buenas', 'excedente', 'noprocess'].includes(field)) {
      return (
        <input
          type="number"
          value={Number(area[field] ?? 0)}
          min={0}
          onChange={(e) => handleValueChange(area.id, field, e.target.value)}
          style={{ width: '80px', padding: '4px', textAlign: 'center' }}
        />
      );
    }

    // 4. CQM editable desde Impresión (id >= 2)
    if (field === 'cqm') {
      if (area.id >= 2) {
        return (
          <input
            type="number"
            value={Number(area[field] ?? 0)}
            min={0}
            onChange={(e) => handleValueChange(area.id, field, e.target.value)}
            style={{ width: '80px', padding: '4px', textAlign: 'center' }}
          />
        );
      }
      return <span>{Number(area[field] ?? 0)}</span>;
    }

    // 5. Muestras y Defectuoso editables desde Corte (id >= 6)
    if (field === 'muestras' || field === 'defectuoso') {
      if (area.id >= 6) {
        return (
          <input
            type="number"
            value={Number(area[field] ?? 0)}
            min={0}
            onChange={(e) => handleValueChange(area.id, field, e.target.value)}
            style={{ width: '80px', padding: '4px', textAlign: 'center' }}
          />
        );
      }
      return <span>{Number(area[field] ?? 0)}</span>;
    }

    // 6. Malas: desde Corte en adelante se gestiona via modal acumulado
    console.log('aeaa', area);

    if (field === 'malas') {
      if (area.id >= 6) {
        const blockKey = areaBlockMap[area.id];
        console.log(blockKey, 'blovkkey');
        const selfBad = toNum(area?.response?.[blockKey]?.bad_quantity ?? 0);
        console.log(area);
        console.log(selfBad, 'selfBad');

        const badToOthers = sumBadBySource(Number(area.id), false);
        const displayBad = selfBad + badToOthers;

        return (
          <input
            type="number"
            value={displayBad}
            min={0}
            onClick={() => handleOpenBadQuantityModal(area)}
            readOnly
            style={{
              width: '80px',
              padding: '4px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#f9f9f9',
            }}
          />
        );
      }

      return (
        <input
          type="number"
          value={area[field]}
          min={0}
          onChange={(e) => handleValueChange(area.id, field, e.target.value)}
          style={{ width: '80px', padding: '4px', textAlign: 'center' }}
        />
      );
    }

    // 7. Resto de campos editables si área = Completado
    return (
      <input
        type="number"
        value={area[field]}
        min={0}
        onChange={(e) => handleValueChange(area.id, field, e.target.value)}
        style={{ width: '80px', padding: '4px', textAlign: 'center' }}
      />
    );
  };

  const handleValueChange = (
    areaId: number,
    field: NumericField,
    value: string | number
  ) => {
    setAreas((prev) =>
      prev.map((area) =>
        area.id === areaId ? { ...area, [field]: Number(value) } : area
      )
    );
  };

  const handleSaveChanges = async (modalResult?: BadQuantityModalResult) => {
    if (!workOrder) {
      alert('No se encontró información de la orden de trabajo.');
      return;
    }

    const toInt = (v: any) => {
      const n = parseInt(String(v ?? '0').trim(), 10);
      return Number.isFinite(n) ? n : 0;
    };

    // ====== 1) Baseline y detección de cambios del modal ======
    const baselineMap =
      modalBaselineRef.current ??
      new Map<
        number,
        { bad: number; material: number | null; supportsMaterial: boolean }
      >();

    const modalInputsRaw = modalResult?.inputsByArea ?? [];
    const modalInputs = modalInputsRaw.filter((entry) => {
      const baseline = baselineMap.get(Number(entry.areaId));
      if (!baseline) return true;
      const values = entry.values ?? [];
      const badFromSummary = values.find(
        (v) => normalizeSummaryLabel(v.label) === 'malas'
      );
      const nextBad = toInt(badFromSummary?.value);
      const badChanged = nextBad !== toInt(baseline.bad);

      let materialChanged = false;
      if (baseline.supportsMaterial) {
        const matEntry = values.find((v) => {
          const n = normalizeSummaryLabel(v.label);
          return n.includes('fabrica') || n.includes('materia');
        });
        const nextMat = toInt(matEntry?.value);
        materialChanged = nextMat !== toInt(baseline.material ?? 0);
      }
      return badChanged || materialChanged;
    });

    // === (A) NO contamines el payload de tabla con los números del modal
    // Puedes seguir actualizando UI si quieres, pero NO uses esos valores para construir el payload de tabla.
    const updatedAreasFromModal = modalResult?.updatedAreas ?? null;
    if (updatedAreasFromModal) {
      // Solo para UI
      setAreas((prev) =>
        prev.map((a) => {
          const r = updatedAreasFromModal.find((x) => x.id === a.id);
          return r
            ? {
                ...a,
                malas: Number(r.malas ?? a.malas ?? 0),
                defectuoso: Number(r.defectuoso ?? a.defectuoso ?? 0),
              }
            : a;
        })
      );
    }

    // Para construir la tabla en esta ejecución usa SIEMPRE el estado crudo:
    const areasForTableBuild = areas; // <— clave

    // ====== 2) Mapa de bloques ======
    const blockMap: Record<string, BlockKey> = {
      preprensa: 'prepress',
      impresion: 'impression',
      serigrafia: 'serigrafia',
      empalme: 'empalme',
      laminacion: 'laminacion',
      corte: 'corte',
      coloredge: 'colorEdge',
      millingchip: 'millingChip',
      hotstamping: 'hotStamping',
      personalizacion: 'personalizacion',
    };
    const ALLOW_BAD_FROM_TABLE: BlockKey[] = [
      'impression',
      'serigrafia',
      'laminacion',
      'empalme',
    ];

    // ====== 3) Summary del modal ======
    const summary = modalInputs
      .map((item) => {
        const areaId = Number(item.areaId);
        const areaName =
          item.areaName ??
          areasForTableBuild.find((a) => Number(a.id) === areaId)?.name ??
          '';
        const values = (item.values ?? [])
          .map((e) => ({
            label: e?.label ?? '',
            value: Number.isFinite(Number(e?.value)) ? Number(e?.value) : 0,
          }))
          .filter((e) => !!e.label);
        return { areaId, areaName, values };
      })
      .filter(
        (e) => Number.isFinite(e.areaId) && !!e.areaName && e.values.length > 0
      );

    const areaIdsTouchedByModal = new Set(summary.map((s) => Number(s.areaId)));

    // ====== 4) Payload de TABLA (usando areasForTableBuild) ======
    const areasFromTable = areasForTableBuild
      .filter((area) => area.status === 'Completado')
      .map((area) => {
        const normalizedName = normalizeAreaKey(area.name);
        const block = (blockMap[normalizedName] || 'otros') as
          | BlockKey
          | 'otros';

        const blockId = (area.response as any)?.[block]?.id;
        const formId = (area.response as any)?.[block]?.form_auditory_id;
        const cqmId = (area.response as any)?.[block]?.form_answer_id;

        // === (B) Bloquea bad_quantity desde tabla si hay modal o si el modal tocó esa área
        const canSendBadFromTable =
          block !== 'otros' &&
          ALLOW_BAD_FROM_TABLE.includes(block as BlockKey) &&
          !modalResult && // <- si hay modalResult, NO mandes bad desde tabla
          !areaIdsTouchedByModal.has(Number(area.id));

        let data: Record<string, number> = {
          good_quantity: Number(area.buenas ?? 0),
          ...(canSendBadFromTable
            ? { bad_quantity: Number(area.malas ?? 0) }
            : {}),
          excess_quantity: Number(area.excedente ?? 0),
          noprocess_quantity: Number(area.noprocess ?? 0),
        };

        let sample_data: Record<string, number> = {};
        if (typeof area.cqm === 'number')
          sample_data.sample_quantity = Number(area.cqm ?? 0);
        if (typeof area.muestras === 'number')
          sample_data.sample_auditory = Number(area.muestras ?? 0);

        if (block === 'prepress') {
          data = { plates: Number(area.buenas ?? 0) };
        }
        if (
          ['impression', 'serigrafia', 'laminacion', 'empalme'].includes(block)
        ) {
          data = {
            release_quantity: Number(area.buenas ?? 0),
            ...(canSendBadFromTable
              ? { bad_quantity: Number(area.malas ?? 0) }
              : {}),
            excess_quantity: Number(area.excedente ?? 0),
            noprocess_quantity: Number(area.noprocess ?? 0),
          };
          sample_data = { sample_quantity: Number(area.cqm ?? 0) };
        }

        return {
          areaId: area.id,
          block,
          blockId,
          formId,
          cqmId,
          data,
          sample_data,
        };
      });

    const areasForDataUpdate = areasFromTable
      .map((item) => {
        if (!item || !item.block || item.block === 'otros') return null;
        const areaIdNum = Number(item.areaId);
        const blockIdNum = Number(item.blockId);
        if (
          !Number.isFinite(areaIdNum) ||
          !Number.isFinite(blockIdNum) ||
          blockIdNum <= 0
        )
          return null;

        const sanitizedData: Record<string, number> = {};
        Object.entries(item.data ?? {}).forEach(([k, v]) => {
          const n = Number(v);
          if (Number.isFinite(n)) sanitizedData[k] = Math.round(n);
        });

        const sampleSanitized: Record<string, number> = {};
        const sampleRaw = (item as any).sample_data ?? {};
        if (sampleRaw.sample_quantity !== undefined) {
          const n = Number(sampleRaw.sample_quantity);
          if (Number.isFinite(n))
            sampleSanitized.sample_quantity = Math.round(n);
        }
        if (sampleRaw.sample_auditory !== undefined) {
          const n = Number(sampleRaw.sample_auditory);
          if (Number.isFinite(n))
            sampleSanitized.sample_auditory = Math.round(n);
        }

        if (
          Object.keys(sanitizedData).length === 0 &&
          Object.keys(sampleSanitized).length === 0
        )
          return null;

        const entry: {
          areaId: number;
          block: BlockKey;
          blockId: number;
          formId?: number;
          cqmId?: number;
          data: Record<string, number>;
          sample_data?: Record<string, number>;
        } = {
          areaId: areaIdNum,
          block: item.block as BlockKey,
          blockId: blockIdNum,
          data: sanitizedData,
        };

        const formIdNum = Number((item as any).formId);
        if (Number.isFinite(formIdNum) && formIdNum > 0)
          entry.formId = formIdNum;
        const cqmIdNum = Number((item as any).cqmId);
        if (Number.isFinite(cqmIdNum) && cqmIdNum > 0) entry.cqmId = cqmIdNum;
        if (Object.keys(sampleSanitized).length > 0)
          entry.sample_data = sampleSanitized;

        return entry;
      })
      .filter(Boolean) as Array<{
      areaId: number;
      block: BlockKey;
      blockId: number;
      formId?: number;
      cqmId?: number;
      data: Record<string, number>;
      sample_data?: Record<string, number>;
    }>;

    try {
      // ====== 5) Si hay MODAL: guarda SOLO el modal + bump y sal ======
      if (summary.length > 0 && modalResult) {
        const sourceAreaId = badModalOwner?.id ?? null;
        const sourceWorkOrderFlowId =
          workOrder?.flow?.find((f: any) => Number(f?.area_id) === sourceAreaId)
            ?.id ?? null;
        const partialReleaseId = badModalPartial?.id ?? null;

        const payload: any = {
          badQuantitySummary: summary,
          sourceAreaId,
          sourceWorkOrderFlowId,
          partialReleaseId,
        };
        await updateWorkOrderAreas(workOrder.ot_id, payload);

        // === BUMP opcional: subir counters del bloque para reflejo inmediato en UI ===
        const deltas: Array<{
          areaId: number;
          deltaBad: number;
          deltaMat: number;
        }> = [];
        for (const item of modalInputs) {
          const areaId = Number(item.areaId);
          const base = baselineMap.get(areaId);
          if (!base) continue;

          const badEntry = (item.values ?? []).find(
            (v) => normalizeSummaryLabel(v.label) === 'malas'
          );
          const nextBad = toInt(badEntry?.value);
          const deltaBad = nextBad - toInt(base.bad);

          let deltaMat = 0;
          if (base.supportsMaterial) {
            const matEntry = (item.values ?? []).find((v) => {
              const n = normalizeSummaryLabel(v.label);
              return n.includes('fabrica') || n.includes('materia');
            });
            deltaMat = toInt(matEntry?.value) - toInt(base.material ?? 0);
          }

          if (deltaBad !== 0 || deltaMat !== 0) {
            deltas.push({ areaId, deltaBad, deltaMat });
          }
        }

        const bumps = deltas
          .map(({ areaId, deltaBad, deltaMat }) => {
            const block = areaBlockMap[areaId] as BlockKey | undefined;
            if (!block) return null;
            const flow = workOrder?.flow?.find(
              (f: any) => Number(f.area_id) === areaId
            );
            const blockId = flow?.areaResponse?.[block]?.id;
            if (!blockId) return null;

            const data: Record<string, number> = {};
            if (deltaBad !== 0) {
              const now = toInt(flow?.areaResponse?.[block]?.bad_quantity ?? 0);
              data.bad_quantity = now + deltaBad;
            }
            if (deltaMat !== 0) {
              const now = toInt(
                flow?.areaResponse?.[block]?.material_quantity ?? 0
              );
              data.material_quantity = now + deltaMat;
            }
            if (Object.keys(data).length === 0) return null;

            return { areaId, block, blockId, data };
          })
          .filter(Boolean);

        if (bumps.length > 0) {
          await updateAreaResponseData(workOrder.ot_id, {
            areas: bumps as any,
          });
        }

        await loadData();
        alert('Cambios guardados correctamente');
        modalBaselineRef.current = new Map();
        return; // <— (C) SHORT-CIRCUIT: no guardar tabla en esta ejecución
      }
      // ====== 6) Sin modal → guarda TABLA ======
      if (areasForDataUpdate.length === 0) {
        alert('No hay cambios para guardar');
        modalBaselineRef.current = new Map();
        return;
      }

      await updateAreaResponseData(workOrder.ot_id, {
        areas: areasForDataUpdate,
      });
      await loadData();
      alert('Cambios guardados correctamente');
    } catch (err) {
      console.error(err);
      alert('Error al guardar los cambios');
    } finally {
      modalBaselineRef.current = new Map();
    }
  };

  const downloadFile = async (filename: string) => {
    try {
      const arrayBuffer = await getFileByName(filename);
      const mime = guessMimeFromName(filename);
      const blob = new Blob([arrayBuffer], { type: mime });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error al abrir el archivo:', error);
    }
  };

  const canEditUser = (
    area: AreaData,
    partial?: AreaData['partials'][number] | null
  ) => {
    if (workOrder?.status === 'Cerrado') return false;

    const editableStatuses = [
      'En proceso',
      'Parcial',
      'Enviado a CQM',
      'Listo',
      'En inconformidad',
      'En inconformidad CQM',
    ];

    if (partial)
      return !partial.validated && editableStatuses.includes(area.status);
    return editableStatuses.includes(area.status);
  };
  const confirmOperatorModal = async () => {
    if (!opModal.area || opModal.selectedUserId == null) return;
    if (!canEditUser(opModal.area, opModal.partial)) return;
    await handleChangeUser(
      opModal.area,
      opModal.partial,
      opModal.selectedUserId
    );
    closeOperatorModal();
  };

  const fieldLabels: Record<string, string> = {
    buenas: 'Buenas',
    malas: 'Malas',
    excedente: 'Excedente',
    noprocess: 'Sin procesar',
  };

  // ======================================================
  // UI Guards
  // ======================================================

  if (loading) {
    return (
      <Container>
        <Title>Cargando Orden de Trabajo...</Title>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500" />
        </div>
      </Container>
    );
  }

  if (!workOrder) {
    return (
      <Container>
        <Title>No se encontró la orden de trabajo.</Title>
      </Container>
    );
  }

  const totalColsDynamic = areas.reduce(
    (sum, area) => sum + areaColSpan(area),
    0
  );
  const filteredAreas = areas.filter(
    (area) =>
      area.status === 'Completado' && area.name.toLowerCase() !== 'preprensa'
  );

  // ======================================================
  // Render
  // ======================================================

  return (
    <>
      <Container>
        <Title>Información Complementaria Orden de Trabajo</Title>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground text-black">
                Número de Orden
              </p>
              <p className="text-xl font-semibold text-black">
                {workOrder?.ot_id}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground text-black">
                Presupuesto
              </p>
              <p className="text-xl font-semibold text-black">
                {workOrder?.mycard_id}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground text-black">
                Cantidad (Tarjetas)
              </p>
              <p className="text-xl font-semibold text-black">
                {workOrder?.quantity}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-400">
            <CardContent>
              <p className="text-sm text-muted-foreground text-black">
                Cantidad (Hojas Frente / Hojas Vuelta)
              </p>
              <p className="text-xl font-semibold text-black">
                {totalSheetsEffective}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground text-black">
                Fecha de Creación
              </p>
              <p className="text-xl font-semibold text-black">
                {new Date(workOrder?.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground text-black">
                Comentarios
              </p>
              <p className="text-xl font-semibold text-black">
                {workOrder?.comments}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground text-black">
                Archivos de la Orden de Trabajo
              </p>
              {workOrder?.files && workOrder.files.length > 0 ? (
                <div className=" flex gap-3 m-2">
                  {workOrder.files.map((file: any) => {
                    const label =
                      file.type === 'OT'
                        ? 'Ver OT'
                        : file.type === 'SKU'
                        ? 'Ver SKU'
                        : file.type === 'OP'
                        ? 'Ver OP'
                        : file.type === 'CARD_IMAGE'
                        ? 'Ver TARJETA'
                        : 'Adjunto';
                    return (
                      <button
                        key={file.id}
                        onClick={() => downloadFile(file.file_path)}
                        className="flex-row items-center
                                 rounded-xl border border-gray-200
                                 bg-white px-4 py-2 text-sm font-medium text-gray-700
                                 shadow-sm transition
                                 hover:bg-gray-50 hover:shadow-md
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                 active:scale-[0.98]"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xl font-semibold text-black">
                  No se ha adjuntado ningun archivo
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground text-black">
                Evidencias de destrucción
              </p>

              {workOrder?.files?.some(
                (f: any) => f.type === 'DESTRUCTION_EVIDENCE'
              ) ? (
                <div className="flex gap-3 m-2">
                  {workOrder.files
                    .filter((file: any) => file.type === 'DESTRUCTION_EVIDENCE')
                    .map((file: any, idx: number) => (
                      <button
                        key={file.id ?? `evidence-${idx}`}
                        onClick={() => downloadFile(file.file_path)}
                        className="flex-row items-center
                        rounded-xl border border-gray-200
                        bg-white px-4 py-2 text-sm font-medium text-gray-700
                        shadow-sm transition
                        hover:bg-gray-50 hover:shadow-md
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                        active:scale-[0.98]"
                      >
                        {`Ver Evidencia ${idx + 1}`}
                      </button>
                    ))}
                </div>
              ) : (
                <p className="text-xl font-semibold text-black">
                  No hay evidencias adjuntas
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        {areas.length > 0 && (
          <ProgressBarAreas areas={areas} progressWidth={progressWidth} />
        )}

        <Section>
          <SectionTitle>Datos de Producción</SectionTitle>
          <TableWrapper>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse bg-white rounded-xl shadow text-sm">
                <thead className="bg-gray-100 sticky top-0 z-10 text-gray-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left p-3 align-bottom" rowSpan={2}>
                      Dato
                    </th>
                    {areas.map((area, index) => (
                      <th
                        key={`${area.id}-${index}-header-area`}
                        className="p-3 text-center font-semibold align-bottom"
                        colSpan={areaColSpan(area)} // antes: Math.max(1, area.parciales)
                      >
                        {area.name}{' '}
                        {area.isCollator && area.id === 4 ? '(C)' : ''}
                        <div className="text-[0.65rem] text-gray-400 mt-1">
                          {area.status}
                        </div>
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {areas.map((area, index) => {
                      if (area.parciales > 0) {
                        const rem = getRemainder(area) > 0;
                        return (
                          <Fragment key={`${area.id}-${index}-subgroup`}>
                            {Array.from({ length: area.parciales }).map(
                              (_, i) => (
                                <th
                                  key={`${area.id}-${index}-sub-${i}`}
                                  className="p-2 text-center font-normal text-[0.7rem] text-gray-500"
                                >
                                  {`P${i + 1}`}
                                </th>
                              )
                            )}
                            {rem && (
                              <>
                                <th
                                  key={`${area.id}-${index}-sub-rem`}
                                  className="p-2 text-center font-normal text-[0.7rem] text-gray-500"
                                >
                                  Rem
                                </th>
                                <th
                                  key={`${area.id}-${index}-sub-sum`}
                                  className="p-2 text-center font-normal text-[0.7rem] text-gray-500"
                                >
                                  Σ
                                </th>
                              </>
                            )}
                          </Fragment>
                        );
                      }
                      return (
                        <th
                          key={`${area.id}-${index}-sub-total`}
                          className="p-2 text-center font-normal text-[0.7rem] text-gray-500"
                        >
                          Total
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-gray-800">
                  {/* Encargado (remanente) */}
                  <tr>
                    <td className="p-3 font-semibold">Encargado (remanente)</td>
                    {areas.map((area, index) => {
                      const editable = canEditUser(area, null);
                      const currentAssignedName =
                        (area.assigned_user_id != null
                          ? operatorById.get(area.assigned_user_id)
                          : undefined) ??
                        area.usuario ??
                        'No definido';

                      return (
                        <td
                          key={`${area.id}-encargado-${index}`}
                          className="text-center"
                          colSpan={areaColSpan(area)}
                        >
                          {editable ? (
                            <button
                              className="border rounded px-2 py-1 hover:bg-gray-50"
                              onClick={() => openOperatorModal(area, null)}
                              title="Cambiar encargado del remanente"
                            >
                              {currentAssignedName}
                            </button>
                          ) : (
                            currentAssignedName
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Usuario */}
                  <tr>
                    <td className="p-3 font-semibold">Usuario</td>
                    {areas.flatMap((area, aIndex) => {
                      const hasPartials = area.partials?.length > 0;

                      if (hasPartials) {
                        const cells = area.partials.map((p, pIndex) => {
                          const releasedByName = getPartialUserName(
                            p,
                            area,
                            operatorById
                          );
                          return (
                            <td
                              key={`area-${area.id}-usuario-${p.id ?? pIndex}`}
                              className="text-center"
                            >
                              {releasedByName}
                            </td>
                          );
                        });

                        // si hay remanente, añade columna Rem con el usuario del último parcial
                        const rem = getRemainder(area) > 0;
                        if (rem) {
                          const lastP = getLastPartial(area);
                          const lastUser = getPartialUserName(
                            lastP,
                            area,
                            operatorById
                          );
                          cells.push(
                            <React.Fragment
                              key={`area-${area.id}-usuario-rem-wrapper`}
                            >
                              <td
                                key={`area-${area.id}-usuario-rem`}
                                className="text-center font-medium"
                                title="Remanente"
                              >
                                {lastUser}
                              </td>
                              <td
                                key={`area-${area.id}-usuario-rem-sum`}
                                className="text-center font-medium"
                                title="Remanente"
                              >
                                {lastUser}
                              </td>
                            </React.Fragment>
                          );
                        }
                        return cells;
                      }

                      // Sin parciales: mostrar encargado actual como texto (edición se hace en fila Encargado)
                      const currentNameNoPartial =
                        (area.assigned_user_id != null
                          ? operatorById.get(area.assigned_user_id)
                          : undefined) ??
                        area.usuario ??
                        'No definido';

                      return (
                        <td
                          key={`area-${area.id}-usuario-${aIndex}`}
                          className="text-center"
                        >
                          {currentNameNoPartial}
                        </td>
                      );
                    })}
                  </tr>
                  {/* ✅ Calidad (reviewer por answer, alineado por parciales y Rem) */}
                  <tr>
                    <td className="p-3 font-semibold">Calidad</td>
                    {areas.flatMap((area, aIdx) => {
                      if (area.parciales > 0) {
                        const reviewers = getPerPartialReviewers(area);
                        const hasRem = getRemainder(area) > 0;

                        const cells = reviewers.map((name, i) => (
                          <td
                            key={`cell-area-${area.id}-parcial-${i}-calidad`}
                            className="text-center"
                            title={
                              i >= area.parciales
                                ? 'Remanente'
                                : `Parcial ${i + 1}`
                            }
                          >
                            <span
                              className={`px-2 py-1 rounded-lg text-sm font-medium ${
                                name && name !== '—'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : ''
                              }`}
                            >
                              {name || '—'}
                            </span>
                          </td>
                        ));

                        // ⚠️ Agregar la celda Σ para cuadrar colSpan cuando hay remanente
                        if (hasRem) {
                          cells.push(
                            <td
                              key={`cell-area-${area.id}-calidad-sum`}
                              className="text-center font-semibold"
                              title="Suma total (parciales + remanente)"
                            >
                              {/* Puedes dejar '—' o repetir el último revisor si lo prefieres */}
                              —
                            </td>
                          );
                        }

                        return cells;
                      }

                      // Sin parciales → último answer
                      const lastAns = getLastAnswer(area);
                      const reviewerName = getReviewerNameFromAnswer(lastAns);

                      return (
                        <td
                          key={`cell-area-${area.id}-calidad-${aIdx}`}
                          className="text-center"
                        >
                          <span
                            className={`px-2 py-1 rounded-lg text-sm font-medium ${
                              reviewerName && reviewerName !== '—'
                                ? 'bg-yellow-100 text-yellow-800'
                                : ''
                            }`}
                          >
                            {reviewerName || '—'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Auditor */}
                  <tr>
                    <td className="p-3 font-semibold">Auditor</td>
                    {areas.flatMap((area, aIdx) => {
                      if (area.parciales > 0) {
                        const reviewers = getPerPartialAuditors(area);
                        const hasRem = getRemainder(area) > 0;

                        const cells = reviewers.map((name, i) => (
                          <td
                            key={`cell-area-${area.id}-partial-${i}-auditor`}
                            className="text-center"
                            title={
                              i >= area.parciales
                                ? 'Remanente'
                                : `Parcial ${i + 1}`
                            }
                          >
                            <span
                              className={`px-2 py-1 rounded-lg text-sm font-medium ${
                                name && name !== '—'
                                  ? 'bg-purple-100 text-purple-800'
                                  : ''
                              }`}
                            >
                              {name || '—'}
                            </span>
                          </td>
                        ));

                        // ⚠️ Agregar la celda Σ para cuadrar colSpan cuando hay remanente
                        if (hasRem) {
                          cells.push(
                            <td
                              key={`cell-area-${area.id}-auditor-sum`}
                              className="text-center font-semibold"
                              title="Suma total (parciales + remanente)"
                            >
                              —
                            </td>
                          );
                        }

                        return cells;
                      }

                      // Sin parciales → último auditor
                      const auditor = getLastAuditor(area);
                      const auditorName = auditor?.username ?? '—';

                      return (
                        <td
                          key={`cell-area-${area.id}-auditor-${aIdx}`}
                          className="text-center"
                        >
                          <span
                            className={`px-2 py-1 rounded-lg text-sm font-medium ${
                              auditorName !== '—'
                                ? 'bg-purple-100 text-purple-800'
                                : ''
                            }`}
                          >
                            {auditorName}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Estado con Badge visual */}
                  <tr>
                    <td className="p-3 font-semibold">Estado</td>
                    {areas.map((area, index) => (
                      <td
                        key={`${area.id}-status-${index}`}
                        className="text-center"
                        colSpan={areaColSpan(area)}
                      >
                        <span
                          className={`px-2 py-1 rounded-lg text-sm font-medium ${getStatusStyle(
                            area.status
                          )}`}
                        >
                          {area.status}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Entradas */}
                  <tr>
                    <td
                      colSpan={1 + totalColsDynamic} // 1 extra por la primera columna "Dato"
                      className="bg-gray-50 px-3 py-2 font-bold text-gray-500"
                    >
                      📥 Producción
                    </td>
                  </tr>
                  {(['buenas', 'malas', 'excedente', 'noprocess'] as const).map(
                    (field) => (
                      <tr key={field}>
                        <td className="p-3 capitalize font-semibold">
                          {fieldLabels[field]}
                        </td>

                        {areas.flatMap((area: any, aIndex) => {
                          if (area.parciales > 0 && area.partials?.length) {
                            const rem = getRemainder(area);
                            const aggregatedFieldValue = Number(
                              area[field] ?? 0
                            );
                            const isEditableAggregateField =
                              ['excedente', 'noprocess'].includes(field) &&
                              area.status === 'Completado';

                            // ⭐ Calcula una vez por área:
                            const badToOthers = toNum(
                              sumBadBySource(area.id, false)
                            );
                            const blockKey = areaBlockMap[area.id];
                            const selfBad = toNum(
                              area?.response?.[blockKey]?.bad_quantity ?? 0
                            );
                            const totalBad = badToOthers + selfBad;

                            let partialSumForSigma = 0;
                            const cells: React.ReactNode[] = area.partials.map(
                              (p: any, pIndex: number) => {
                                const value =
                                  field === 'buenas'
                                    ? toNum(p.quantity)
                                    : field === 'malas'
                                    ? toNum(p.bad_quantity)
                                    : field === 'excedente'
                                    ? toNum(p.excess_quantity)
                                    : toNum(p.noprocess_quantity);

                                const partialBadDetailsSum = (
                                  p.badQuantityDetails ?? []
                                ).reduce(
                                  (acc: any, detail: any) =>
                                    acc + toNum(detail?.bad_quantity),
                                  0
                                );
                                const partialTotalBad =
                                  toNum(p.bad_quantity) + partialBadDetailsSum;

                                if (field === 'buenas') {
                                  partialSumForSigma += value;
                                }

                                const isLastPartial =
                                  rem <= 0 &&
                                  pIndex === area.partials.length - 1;

                                const allowBadQuantityModal =
                                  field === 'malas' &&
                                  area.id >= 6 &&
                                  area.status === 'Completado';

                                const shouldRenderAggregateInput =
                                  isEditableAggregateField &&
                                  isLastPartial &&
                                  rem <= 0;

                                const displayValue =
                                  field === 'malas'
                                    ? getPxTotal(area.id, pIndex)
                                    : value;

                                const partialContent = allowBadQuantityModal ? (
                                  <button
                                    type="button"
                                    className="inline-flex min-w-[64px] justify-center rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    onClick={() =>
                                      handleOpenBadQuantityModal(area, p)
                                    }
                                    title={`Cantidad mala total del parcial: ${partialTotalBad}`}
                                  >
                                    {displayValue}
                                  </button>
                                ) : shouldRenderAggregateInput ? (
                                  <input
                                    type="number"
                                    value={aggregatedFieldValue}
                                    min={0}
                                    onChange={(e) =>
                                      handleValueChange(
                                        area.id,
                                        field,
                                        e.target.value
                                      )
                                    }
                                    className="w-20 rounded border border-gray-200 px-2 py-1 text-center"
                                  />
                                ) : (
                                  displayValue
                                );

                                return (
                                  <td
                                    key={`area-${area.id}-parcial-${
                                      p.id ?? pIndex
                                    }-${field}`}
                                    className="text-center"
                                  >
                                    {field === 'malas' ? partialContent : value}
                                  </td>
                                );
                              }
                            );

                            if (rem > 0) {
                              let remValue = 0;
                              let remSum = 0;
                              switch (field) {
                                case 'buenas':
                                  remValue = getRemainderByField(
                                    area,
                                    'buenas'
                                  );
                                  remSum = getRemainderBySum(area, 'buenas');
                                  break;
                                case 'excedente':
                                  remValue = getRemainderByField(
                                    area,
                                    'excedente'
                                  );
                                  remSum = getRemainderBySum(area, 'excedente');
                                  break;
                                case 'noprocess':
                                  remValue = getRemainderByField(
                                    area,
                                    'noprocess'
                                  );
                                  remSum = getRemainderBySum(area, 'noprocess');
                                  break;
                                case 'malas': {
                                  remValue = getRemTotal(area.id); // <- solo no liberados (REM) desde flow.badQuantityDetails
                                  remSum = totalBad; // puedes mantener tu total acumulado como Σ
                                  break;
                                }
                                default:
                                  remValue = 0;
                              }

                              const allowBadQuantityModalRem =
                                field === 'malas' &&
                                area.id >= 6 &&
                                area.status === 'Completado';

                              let remainderAggregateContent: React.ReactNode;
                              if (field === 'malas') {
                                if (area.id < 6) {
                                  remainderAggregateContent = (
                                    <input
                                      type="number"
                                      value={area.malas ?? selfBad ?? 0} // ← usa selfBad solo si malas aún no existe
                                      min={0}
                                      onChange={(e) =>
                                        handleValueChange(
                                          area.id,
                                          'malas',
                                          e.target.value
                                        )
                                      }
                                      className="w-20 rounded border border-gray-300 bg-white px-2 py-1 text-center"
                                    />
                                  );
                                } else {
                                  remainderAggregateContent = totalBad;
                                }
                              } else if (isEditableAggregateField) {
                                remainderAggregateContent = (
                                  <input
                                    type="number"
                                    value={aggregatedFieldValue}
                                    min={0}
                                    onChange={(e) =>
                                      handleValueChange(
                                        area.id,
                                        field,
                                        e.target.value
                                      )
                                    }
                                    className="w-20 rounded px-2 py-1 text-center"
                                  />
                                );
                              } else if (field === 'buenas') {
                                remainderAggregateContent = (
                                  <input
                                    type="number"
                                    value={partialSumForSigma + remValue}
                                    min={0}
                                    onChange={(e) =>
                                      handleValueChange(
                                        area.id,
                                        field,
                                        e.target.value
                                      )
                                    }
                                    className="w-20 rounded px-2 py-1 text-center"
                                  />
                                );
                              } else {
                                remainderAggregateContent = remSum;
                              }

                              const remainderPartialContent =
                                allowBadQuantityModalRem ? (
                                  <button
                                    type="button"
                                    className="inline-flex min-w-[64px] justify-center rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    onClick={() =>
                                      handleOpenBadQuantityModal(area)
                                    }
                                    title={`Cantidad mala total del área: ${aggregatedFieldValue}`}
                                  >
                                    {remValue}
                                  </button>
                                ) : (
                                  remValue
                                );

                              cells.push(
                                <React.Fragment
                                  key={`area-${area.id}-usuario-rem-wrapper-partial`}
                                >
                                  <td
                                    key={`area-${area.id}-parcial-rem-${field}`}
                                    className="text-center font-semibold"
                                    title="Remanente"
                                  >
                                    {remainderPartialContent}
                                  </td>

                                  <td
                                    key={`area-${area.id}-parcial-rem-${field}-sum`}
                                    className="text-center font-semibold"
                                    title="Remanente"
                                  >
                                    {remainderAggregateContent}
                                  </td>
                                </React.Fragment>
                              );
                            }

                            return cells;
                          }

                          return (
                            <td
                              key={`area-${area.id}-no-parciales-${field}-${aIndex}`}
                              className="text-center"
                            >
                              {renderCell(area, field)}
                            </td>
                          );
                        })}
                      </tr>
                    )
                  )}

                  {/* Control de calidad */}
                  <tr>
                    <td
                      colSpan={1 + totalColsDynamic} // 1 extra por la primera columna "Dato"
                      className="bg-gray-50 px-3 py-2 font-bold text-gray-500"
                    >
                      🔍 Calidad
                    </td>
                  </tr>
                  {['defectuoso', 'cqm', 'muestras'].map((field) => (
                    <tr key={field}>
                      <td className="p-3 capitalize font-semibold">
                        {field === 'defectuoso'
                          ? 'materia prima defectuosa'
                          : field}
                      </td>

                      {areas.flatMap((area, aIdx) => {
                        if (area.parciales > 0) {
                          const hasRem = getRemainder(area) > 0;

                          let vals: Array<number | string>;
                          if (field === 'cqm') {
                            vals = getPerPartialCqm(area) as number[];
                          } else {
                            vals = getPerPartialValues(
                              area,
                              field as 'defectuoso' | 'muestras'
                            );
                          }
                          const cells = vals.map((v, i) => (
                            <td
                              key={`cell-area-${area.id}-parcial-${i}-${field}`}
                              className="text-center"
                              title={
                                i >= area.parciales
                                  ? 'Remanente'
                                  : `Parcial ${i + 1}`
                              }
                            >
                              {v}
                            </td>
                          ));
                          if (hasRem) {
                            // suma numérica; en 'muestras' reemplazamos '—' por 0
                            const toN = (x: any) =>
                              typeof x === 'number' ? x : toNum(x);
                            const sumVal = (
                              vals as (number | string)[]
                            ).reduce<number>((acc, x) => acc + toN(x), 0);

                            cells.push(
                              <td
                                key={`cell-area-${area.id}-parcial-sum-${field}`}
                                className="text-center font-semibold"
                                title="Suma total (parciales + remanente)"
                              >
                                {sumVal}
                              </td>
                            );
                          }

                          return cells;
                        }
                        const totalValue =
                          field === 'cqm'
                            ? getSingleCqm(area)
                            : renderCell?.(area, field as any) ??
                              getAnswerValue(undefined, field as any, area);

                        return (
                          <td
                            key={`cell-area-${area.id}-no-ans-${field}-${aIdx}`}
                            className="text-center"
                          >
                            {totalValue ?? 0}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* SUMA TOTAL */}
                  <tr className="bg-slate-100 font-semibold text-sm">
                    <td className="p-3">📊 Suma Total</td>
                    {areas.map((area, index) => (
                      <td
                        key={`${area.id}-total-${index}`}
                        className="text-center"
                        colSpan={areaColSpan(area)}
                      >
                        {getAreaSumaTotal(area)}
                      </td>
                    ))}
                  </tr>

                  {/* Buenas + Excedente */}
                  <tr className="bg-green-100 font-semibold">
                    <td className="p-3">✅ Buenas + Excedente</td>
                    {areas.map((area, index) => (
                      <td
                        key={`${area.id}-b+e-${index}`}
                        className="text-center"
                        colSpan={areaColSpan(area)} // 👈 clave
                      >
                        {area.id >= 6 ? area.buenas + area.excedente : ''}
                      </td>
                    ))}
                  </tr>

                  {/* Control de Auditoria */}

                  <tr className="font-semibold">
                    <td className="p-3">🔍 Auditoría</td>
                    {areas.map((area, index) => {
                      const ps = area.partials ?? [];
                      const totalQty = ps.reduce(
                        (s: any, p: any) => s + (Number(p?.quantity) || 0),
                        0
                      );
                      const totalRel = ps.reduce(
                        (s: any, p: any) =>
                          s + (Number(p?.release_quantity) || 0),
                        0
                      );
                      const restante = totalQty - totalRel;
                      return (
                        <td
                          key={`${area.id}-b+e-${index}`}
                          className="text-center"
                          colSpan={areaColSpan(area)} // 👈 clave
                        >
                          {index === areas.length - 1 && area.parciales > 0
                            ? restante
                            : ''}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </TableWrapper>
          {workOrder?.status !== 'En proceso' && (
            <>
              <SectionTitle>Cuadres</SectionTitle>
              <TableWrapper>
                <TableCuadres>
                  <thead>
                    <tr>
                      <th />
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Buenas Última Operación</td>
                      {ultimaArea && (
                        <td key={`${ultimaArea.id}-last`}>
                          {ultimaArea.buenas}
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td>Excedente Última Operación</td>
                      {ultimaArea && (
                        <td key={`${ultimaArea.id}-last`}>
                          {ultimaArea.excedente}
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td>Total Malas</td>
                      <td>{totalMalas}</td>
                    </tr>
                    <tr>
                      <td>Total Materia Prima Defectuosa</td>
                      <td>{totalDefectuoso}</td>
                    </tr>
                    <tr>
                      <td>Total CQM</td>
                      <td>{totalCqm}</td>
                    </tr>
                    <tr>
                      <td>Total Muestras</td>
                      <td>{totalMuestras}</td>
                    </tr>
                    <tr>
                      <td>TOTAL</td>
                      <td>{totalGeneral}</td>
                    </tr>
                  </tbody>
                </TableCuadres>
              </TableWrapper>
            </>
          )}
          <PartialHistory
            workOrder={workOrder}
            partialSectionOpen={partialSectionOpen}
            togglePartialSection={() => setPartialSectionOpen((s) => !s)}
            areaTotalsByAreaId={areaTotalsByAreaId}
          />
          <VistosBuenosHistory
            history={vistosBuenosHistory}
            qualitySectionOpen={qualitySectionOpen}
            toggleQualitySection={() => setQualitySectionOpen((s) => !s)}
          />
          <InconformitiesHistory
            inconformities={inconformities}
            qualitySectionOpen={inconformitySectionOpen}
            toggleQualitySection={() => setInconformitySectionOpen((s) => !s)}
          />
          {opModal.open && (
            <ModalOverlay>
              <ModalBox>
                <h4 className="font-semibold mb-3">
                  Asignar operador{' '}
                  {opModal.area ? `- ${opModal.area.name}` : ''}
                  {opModal.partial ? ' (Parcial abierto)' : ''}
                </h4>

                {/* Buscador */}
                <input
                  type="text"
                  value={opModal.search}
                  onChange={(e) =>
                    setOpModal((s) => ({ ...s, search: e.target.value }))
                  }
                  placeholder="Buscar operador por nombre..."
                  className="w-full border rounded px-3 py-2 mb-3"
                />

                {/* Lista de operadores */}
                <div className="max-h-64 overflow-y-auto border rounded">
                  {modalOptions.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">
                      No hay operadores para esta área o no hay coincidencias.
                    </div>
                  ) : (
                    modalOptions.map((u) => {
                      const selected = u.id === opModal.selectedUserId;
                      return (
                        <button
                          key={u.id}
                          onClick={() =>
                            setOpModal((s) => ({ ...s, selectedUserId: u.id }))
                          }
                          className={`w-full text-left px-3 py-2 border-b last:border-b-0 ${
                            selected ? 'bg-blue-100' : 'hover:bg-gray-50'
                          }`}
                        >
                          {u.username}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <CancelButton onClick={closeOperatorModal}>
                    Cancelar
                  </CancelButton>
                  <ConfirmButton
                    onClick={confirmOperatorModal}
                    disabled={opModal.selectedUserId == null}
                  >
                    Guardar
                  </ConfirmButton>
                </div>
              </ModalBox>
            </ModalOverlay>
          )}
          {workOrder?.status !== 'Cerrado' && (
            <>
              <SaveButton onClick={() => handleSaveChanges()}>
                Guardar Cambios
              </SaveButton>
              <CloseButton onClick={() => setShowConfirm(true)}>
                Cerrar Orden de Trabajo
              </CloseButton>
            </>
          )}
        </Section>
      </Container>
      {showBadQuantity && (
        <BadQuantityModal
          areas={modalAreas}
          areaBadQuantities={areaBadQuantities}
          setAreaBadQuantities={setAreaBadQuantities}
          onConfirm={(result: BadQuantityModalResult) => {
            setShowBadQuantity(false);
            handleSaveChanges(result);
            setModalAreas(() => []);
            setBadModalOwner(null);
            setBadModalPartial(null);
            modalBaselineRef.current = new Map();
          }}
          onClose={() => {
            setShowBadQuantity(false);
            setModalAreas(() => []);
            setBadModalOwner(null);
            setBadModalPartial(null);
            modalBaselineRef.current = new Map();
          }}
        />
      )}
      {showConfirm && (
        <ModalOverlay>
          <ModalBox>
            <h4>¿Estás segura/o que deseas cerrar esta Orden de Trabajo?</h4>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              <CancelButton onClick={() => setShowConfirm(false)}>
                Cancelar
              </CancelButton>
              <ConfirmButton onClick={handleCloseOrder}>
                Confirmar
              </ConfirmButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </>
  );
}

// =================== Styled Components ===================

const Container = styled.div`
  padding: 20px 20px 20px 50px;
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
  font-size: 2rem;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const Section = styled.div`
  margin-top: 30px;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  margin-bottom: 2rem;
  border-radius: 15px;
`;

const TableCuadres = styled.table`
  width: 40%;
  border-collapse: collapse;
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);

  th,
  td {
    padding: 0.75rem;
    text-align: left;
    color: rgb(4, 4, 4);
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background: #f3f4f6;
    color: #374151;
    font-weight: 600;
  }

  tr:nth-child(even) {
    background: #fafafa;
  }
`;

const SaveButton = styled.button`
  background-color: #a9a9a9;
  color: white;
  padding: 0.9rem 1.5rem;
  margin-right: 1rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
  transition: background 0.3s;

  &:hover {
    background: #1d4ed8;
  }
`;

const CloseButton = styled.button`
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: white;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
  transition: background 0.3s;

  &:hover {
    background: #1d4ed8;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  color: black;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  overflow-y: auto;
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  justify-content: center;
  max-width: 500px;
  max-height: 80%;
  overflow-y: auto;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ConfirmButton = styled.button`
  background-color: #0038a8;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;

  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover,
  &:focus {
    background-color: #1e40af;
    outline: none;
  }
`;

const CancelButton = styled.button`
  background-color: #bbbbbb;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;

  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover,
  &:focus {
    background-color: #a0a0a0;
    outline: none;
  }
`;
// ========================================================
// Local helpers (non-visual)
// ========================================================

function getStatusStyle(status: string) {
  switch (status) {
    case 'Completado':
      return 'bg-green-100 text-green-800';
    case 'Pendiente':
      return 'bg-yellow-100 text-yellow-800';
    case 'En proceso':
      return 'bg-blue-100 text-blue-800';
    case 'Listo':
    case 'En calidad':
    case 'Enviado a CQM':
      return 'bg-yellow-100 text-yellow-800';
    case 'Enviado a Auditoria':
      return 'bg-purple-100 text-purple-800';
    case 'Parcial':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
