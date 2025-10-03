'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { InternalStackParamList } from '../../../../navigation/types';
import {
  fetchWorkOrderById,
  closeWorkOrder,
  fetchAllUsers,
  updateFlowAssignedUser,
  updateWorkOrderAreas,
  updateAreaResponseData,
} from '../../../../api/seguimientoDeOts';
import { TextInput } from 'react-native-paper';
import InfoCard from '../../../../components/SeguimientoDeOts/InfoCard';
import InconformitiesHistory from '../../../../components/SeguimientoDeOts/InconformitiesHistory';
import ProgressBarAreas from '../../../../components/SeguimientoDeOts/ProgressBarAreas';
import BadQuantityModal, {
  BadQuantityModalResult,
} from '../../../../components/SeguimientoDeOts/BadQuantityModal';
import { VistosBuenosHistory } from '../../../../components/SeguimientoDeOts/VistosBuenosHistory';
import PartialHistory from '../../../../components/SeguimientoDeOts/PartialHistory';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import FileViewer from 'react-native-file-viewer';
import { getFileByName } from '../../../../api/finalizacion';
import {
  getPerPartialReviewers,
  getLastAnswer,
  getSingleCqm,
  getReviewerNameFromAnswer,
  getPerPartialCqm,
  getPerPartialAuditors,
  getLastAuditor,
} from '../../../../components/SeguimientoDeOts/util/quality';
import { AreaTotalsForPartialHistory } from '../../../../components/SeguimientoDeOts/PartialHistory';

type WorkOrderDetailRouteProp = RouteProp<
  InternalStackParamList,
  'WorkOrderDetailScreen'
>;

// ========================================================
// Types
// ========================================================

interface Props {
  params: Promise<{ id: string }>;
}

export type AreaData = {
  id: number;
  name: string;
  status: string;
  isCollator: boolean;
  response: {
    prepress: { id: number };
    impression: { id: number };
    serigrafia: { id: number };
    empalme: { id: number };
    laminacion: { id: number };
    corte: { id: number };
    colorEdge: { id: number };
    millingChip: { id: number };
    hotStamping: { id: number };
    personalizacion: { id: number };
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
const getAreaKey = (area: AreaData) => AREA_KEY_BY_ID[area.id] ?? null;

const blockSupportsMaterial = (block?: string | null) =>
  !!block &&
  ['corte', 'colorEdge', 'millingChip', 'personalizacion'].includes(block);

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
    case 'malas':
      total = toNum(block.bad_quantity);
      parcialesSum = (area.partials ?? []).reduce(
        (acc, p) => acc + toNum(p?.bad_quantity),
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

const getAreaSumaTotal = (area: AreaData) => {
  // Si existen parciales -> sumar SOLO el primer parcial
  if (area.partials?.length && area.id >= 6) {
    const p = area.partials[0];
    const firstAnswer = area.answers?.[0];

    const buenas = Number(p?.quantity ?? 0);
    const malas = Number(p?.bad_quantity ?? 0);
    const excedente = Number(p?.excess_quantity ?? 0);
    const defectuoso = Number(p?.material_quantity ?? 0);
    const muestras = Number(p?.formAuditory?.sample_auditory ?? 0);
    const cqm = Number(firstAnswer?.sample_quantity ?? 0);

    // noprocess SOLO del primer parcial (con alias defensivos por si cambia el nombre)
    const noprocess = Number(
      (p as any)?.noprocess ??
        (p as any)?.no_process ??
        (p as any)?.not_processed ??
        (p as any)?.notProcessed ??
        0
    );

    return buenas + malas + excedente + defectuoso + cqm + muestras + noprocess;
  }

  // Si NO hay parciales -> usar los valores del área completos
  const buenas = Number(area.buenas ?? 0);
  const malas = Number(area.malas ?? 0);
  const excedente = Number(area.excedente ?? 0);
  const defectuoso = Number(area.defectuoso ?? 0);
  const cqm = Number(area.cqm ?? 0);
  const muestras = Number(area.muestras ?? 0);
  const noprocess = Number(area.noprocess ?? 0);

  return buenas + malas + excedente + defectuoso + cqm + muestras + noprocess;
};

const WorkOrderDetailScreen: React.FC = () => {
  const route = useRoute<WorkOrderDetailRouteProp>();
  const { id } = route.params;
  const navigation = useNavigation();

  const [workOrder, setWorkOrder] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [inconformities, setInconformities] = useState<InconformityData[]>([]);
  const [progressWidth, setProgressWidth] = useState(0);
  const [partialSectionOpen, setPartialSectionOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [qualitySectionOpen, setQualitySectionOpen] = useState(false);
  const [inconformitySectionOpen, setInconformitySectionOpen] = useState(false);
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<{
    [key: string]: string;
  }>({});
  const [badModalOwner, setBadModalOwner] = useState<AreaData | null>(null);
  const [vistosBuenosHistory, setVistosBuenosHistory] = useState<any[]>([]);

  const toggleQualitySection = () => setQualitySectionOpen(!qualitySectionOpen);
  const toggleInconformitySection = () =>
    setInconformitySectionOpen(!inconformitySectionOpen);

  type OperatorUser = {
    id: number;
    username: string;
    areasOperator?: { id: number; name: string };
  };

  // --- operadores (nuevo) ---
  const [operatorUsers, setOperatorUsers] = useState<OperatorUser[]>([]);
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

  const modalOptions = useMemo(() => {
    if (!opModal.areaId) return [];
    const base = getUserOptionsForArea(opModal.areaId);
    const q = opModal.search.trim().toLowerCase();
    return q ? base.filter((u) => u.username.toLowerCase().includes(q)) : base;
  }, [opModal.areaId, opModal.search, operatorOptionsByAreaId]);

  const canEditUser = (
    area: AreaData,
    partial?: AreaData['partials'][number] | null
  ) => {
    // bloquea si la OT completa está cerrada
    if (workOrder?.status === 'Cerrado') return false;

    // con parciales: solo si el parcial NO está validado y el área está "En proceso"
    if (partial)
      return (
        !partial.validated &&
        [
          'En proceso',
          'Parcial',
          'Enviado a CQM',
          'Listo',
          'En inconformidad',
          'En inconformidad CQM' /*, 'Otro estado'*/,
        ].includes(area.status)
      );

    // sin parciales: solo si el área está "En proceso"
    return [
      'En proceso',
      'Parcial',
      'Enviado a CQM',
      'Listo',
      'En inconformidad',
      'En inconformidad CQM' /*, 'Otro estado'*/,
    ].includes(area.status);
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

  function getLabelByType(type: string) {
    switch (type) {
      case 'OT':
        return 'Ver OT';
      case 'SKU':
        return 'Ver SKU';
      case 'OP':
        return 'Ver OP';
      case 'CARD_IMAGE':
        return 'Ver TARJETA';
      default:
        return 'Adjunto';
    }
  }

  const downloadFile = async (filename: string) => {
    try {
      const res = await getFileByName(filename);
      if (!res) {
        console.error('❌ Error desde el backend');
        return;
      }
      const base64Data = Buffer.from(res, 'binary').toString('base64');
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileViewer.open(fileUri, {
        showOpenWithDialog: true,
        displayName: filename,
      });
    } catch (error) {
      console.error('Error al abrir el archivo:', error);
    }
  };

  // ----------------------- loadData con defensas y logs -----------------------
  // ✅ función reutilizable para cargar y setear todo
  const fetchAndSetData = async (workOrderId: string) => {
    try {
      setLoading(true);

      const data = await fetchWorkOrderById(workOrderId);
      const users = await fetchAllUsers();

      setOperatorUsers(users || []);
      setWorkOrder(data);

      // Vistos Buenos history
      const historyData =
        data.flow
          ?.filter((item: any) => item.answers?.length > 0)
          ?.map((item: any) => {
            const areaName = item.area?.name?.toLowerCase() || '';
            const mode = ['impresion'].includes(areaName) ? 'doble' : 'simple';
            return {
              areaName: item.area?.name || 'Sin nombre',
              username: item.user?.username || '',
              questions: item.area?.formQuestions || [],
              formAnswers: (item.answers || []).map((a: any) => ({
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
              (release?.formAuditory?.inconformities || []).map((inc: any) => ({
                id: inc.id,
                comments: inc.comments,
                createdAt: inc.created_at ?? inc.createdAt,
                createdBy:
                  inc.user?.username || inc.created_by || 'Desconocido',
                area: areaName,
              }))
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
      const percentage = (completedCount / areaData.length) * 100;
      setTimeout(() => setProgressWidth(percentage), 100);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchAndSetData(String(id)); // 👈 en lugar de loadData()
  }, [id]);

  const badAgg = useMemo(() => {
    const byTarget = new Map<number, number>(); // opcional: acumulados por target
    const byTargetMat = new Map<number, number>(); // opcional: material por target
    const bySourceTarget = new Map<
      number,
      Map<number, { bad: number; mat: number }>
    >();

    const flows = workOrder?.flow ?? [];
    flows.forEach((f: any) => {
      (f?.badQuantityDetails ?? []).forEach((d: any) => {
        const s = Number(d?.source_area_id) || 0;
        const t = Number(d?.target_area_id) || 0;
        const bad = toNum(d?.bad_quantity);
        const mat = toNum(d?.material_quantity);

        if (t) {
          byTarget.set(t, (byTarget.get(t) || 0) + bad);
          byTargetMat.set(t, (byTargetMat.get(t) || 0) + mat);
        }
        if (s) {
          if (!bySourceTarget.has(s)) bySourceTarget.set(s, new Map());
          const m = bySourceTarget.get(s)!;
          const prev = m.get(t) ?? { bad: 0, mat: 0 };
          m.set(t, { bad: prev.bad + bad, mat: prev.mat + mat });
        }
      });
    });

    return { byTarget, byTargetMat, bySourceTarget };
  }, [workOrder]);

  const sumBadBySource = (sourceId: number, { includeSelf = false } = {}) => {
    const m = badAgg.bySourceTarget.get(sourceId);
    if (!m) return 0;
    let total = 0;
    m.forEach((v, tId) => {
      if (!includeSelf && tId === sourceId) return;
      total += toNum(v.bad);
    });
    return total;
  };

  const handleOpenBadQuantityModal = (ownerArea: AreaData) => {
    const initialValues: Record<string, string> = {};

    const areasForModal = areas.filter(
      (a) => a.status === 'Completado' && a.name.toLowerCase() !== 'preprensa'
    );

    const perTarget = badAgg.bySourceTarget.get(ownerArea.id) ?? new Map();

    areasForModal.forEach((area) => {
      if (area.id === ownerArea.id) return; // 🔒 excluye self-target
      const key = area.name.toLowerCase().replace(/\s/g, '');
      const agg = perTarget.get(area.id) ?? { bad: 0, mat: 0 };
      initialValues[`${key}_bad`] = String(agg.bad);
      if (area.id >= 6) initialValues[`${key}_material`] = String(agg.mat);
    });

    setAreaBadQuantities(initialValues);
    setBadModalOwner(ownerArea);
    setShowBadQuantity(true);
  };

  const cantidadHojasRaw = Number(workOrder?.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;
  const totalSheetsEffective = workOrder?.total_sheets ?? cantidadHojas;
  const ultimaArea = areas[areas.length - 1];
  const totalMalas = areas.reduce((acc, area) => acc + (area.malas || 0), 0);
  const totalDefectuoso = areas.reduce(
    (acc, area) => acc + (area.defectuoso || 0),
    0
  );
  const totalCqm = areas
    .filter((area) => area.id >= 6)
    .reduce((acc, area) => acc + (area.cqm || 0), 0);
  const totalMuestras = areas.reduce(
    (acc, area) => acc + (area.muestras || 0),
    0
  );
  const totalUltimaBuenas = ultimaArea?.buenas || 0;
  const totalUltimaExcedente = ultimaArea?.excedente || 0;
  const totalUltimaNoProcess = ultimaArea?.noprocess || 0;

  const totalGeneral =
    totalUltimaBuenas +
    totalUltimaExcedente +
    totalUltimaNoProcess +
    totalMalas +
    totalDefectuoso +
    totalCqm +
    totalMuestras;

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
      console.error(e);
      setAreas(prevAreas);
      alert('No se pudo actualizar el encargado. Se revirtieron los cambios.');
    }
  };

  // ---- Remainders (by field) ----
  const getAnswerValue = (
    ans: any,
    field: 'defectuoso' | 'cqm' | 'muestras',
    area: any
  ) => {
    switch (field) {
      case 'cqm':
        // Por answer → cuántas muestras reportó ese answer (sample_quantity)
        return ans?.sample_quantity ?? 0;
      case 'muestras':
        // Si quieres ver el tipo de prueba por answer (string tipo "perfil")
        // cámbialo por lo que necesites mostrar aquí:
        return ans?.sample_auditory ?? '—';

      case 'defectuoso':
        // Sigue viniendo del bloque del área (no por answer)
        return (
          area?.areaResponse?.impression?.bad_quantity ??
          area?.areaResponse?.prepress?.bad_quantity ??
          0
        );
      default:
        return 0;
    }
  };

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

  const handleCloseOrder = async () => {
    try {
      await closeWorkOrder(workOrder?.ot_id);
      Alert.alert('Orden cerrada', 'La orden de trabajo ha sido cerrada.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo cerrar la orden.');
    }
  };

  const ensureElement = (node: React.ReactNode): React.ReactElement => {
    if (React.isValidElement(node)) return node;
    if (typeof node === 'string' || typeof node === 'number') {
      return <Text>{String(node)}</Text>;
    }
    // fallback seguro (nunca devolvemos string/number sueltos)
    return <View />;
  };
  const areaColSpan = (area: AreaData) => {
    const base = Math.max(1, area.parciales || 0);
    const hasRem = area.parciales > 0 && getRemainder(area) > 0;
    return area.parciales > 0 ? base + (hasRem ? 2 : 0) : 1;
  };

  const totalColsDynamic = areas.reduce(
    (sum, area) => sum + areaColSpan(area),
    0
  );

  // ✅ cuenta P1..Pn + (Rem + Σ si hay rem), o 1 si no hay parciales
  const getAreaSpanCount = (area: any) =>
    (area.parciales || 0) > 0
      ? (area.parciales || 0) + (getRemainder(area) > 0 ? 2 : 0)
      : 1;

  /**
   * Simula colSpan repitiendo celdas.
   * - i === 0: renderiza el contenido real (tu badge, botón, etc.)
   * - resto: placeholders vacíos para alinear columnas, ocupando Rem y Σ si aplican
   * Si quisieras repetir el contenido en todas (incluida Σ), pasa { repeat: true }.
   */
  const renderSpannedCells = (
    area: any,
    key: string,
    renderer: () => React.ReactNode,
    opts?: { repeat?: boolean }
  ) => {
    const span = getAreaSpanCount(area);
    return Array.from({ length: span }).map((_, i) => (
      <View
        key={`${key}-${area.id}-${i}`}
        style={[
          styles.cellUser,
          { justifyContent: 'center', alignItems: 'center' }, // 👈 centrado
        ]}
      >
        {opts?.repeat || i === 0 ? (
          // contenido real en la primera celda (o en todas si repeat)
          React.isValidElement(renderer()) ? (
            renderer()
          ) : (
            <Text>{String(renderer())}</Text>
          )
        ) : (
          // placeholder invisible para mantener el grid (ocupa Rem y Σ)
          <Text style={{ opacity: 0 }}>.</Text>
        )}
      </View>
    ));
  };

  const handleValueChange = (
    areaId: number,
    field: keyof AreaData,
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
      Alert.alert(
        'Error',
        'No se encontró información de la orden de trabajo.'
      );
      return;
    }

    const toInt = (v: any) => {
      const n = parseInt(String(v ?? '0').trim(), 10);
      return Number.isFinite(n) ? n : 0;
    };

    const modalInputs = modalResult?.inputsByArea ?? [];
    const updatedAreasFromModal = modalResult?.updatedAreas ?? null;

    const effectiveAreas = updatedAreasFromModal
      ? areas.map((area) => {
          const replacement = updatedAreasFromModal.find(
            (item) => item.id === area.id
          );
          if (!replacement) return area;
          return {
            ...area,
            malas: Number(replacement.malas ?? area.malas ?? 0),
            defectuoso: Number(replacement.defectuoso ?? area.defectuoso ?? 0),
          };
        })
      : areas;

    if (updatedAreasFromModal) {
      setAreas(effectiveAreas);
    }

    const blockMap: Record<string, string> = {
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

    const areasFromTable = effectiveAreas
      .filter((area) => area.status === 'Completado')
      .map((area) => {
        const normalizedName = area.name.toLowerCase().replace(/\s/g, '');
        const block = blockMap[normalizedName] ?? null;
        if (!block) return null;

        const blockData = (area.response as any)?.[block];
        const blockId = blockData?.id ?? null;
        if (!blockId) return null;

        const formId = blockData?.form_auditory_id ?? null;
        const cqmId = blockData?.form_answer_id ?? null;

        let data: Record<string, number> = {
          good_quantity: Number(area.buenas ?? 0),
          bad_quantity: Number(area.malas ?? 0),
          excess_quantity: Number(area.excedente ?? 0),
          noprocess_quantity: Number(area.noprocess ?? 0),
          material_quantity: Number(area.defectuoso ?? 0),
        };
        let sample_data: Record<string, number> = {
          sample_quantity: Number(area.cqm ?? 0),
          sample_auditory: Number(area.muestras ?? 0),
        };

        if (block === 'prepress') {
          data = { plates: Number(area.buenas ?? 0) };
        }
        if (
          ['impression', 'serigrafia', 'laminacion', 'empalme'].includes(block)
        ) {
          data = {
            release_quantity: Number(area.buenas ?? 0),
            bad_quantity: Number(area.malas ?? 0),
            excess_quantity: Number(area.excedente ?? 0),
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
      })
      .filter(
        (
          item
        ): item is {
          areaId: number;
          block: string;
          blockId: number;
          formId: number | null;
          cqmId: number | null;
          data: Record<string, number>;
          sample_data: Record<string, number>;
        } => item !== null
      );

    let areasFromBadModal: Array<{
      areaId: number;
      block: string;
      blockId: number | null;
      formId: number | null;
      cqmId: number | null;
      data: Record<string, number>;
      inputsByArea: Array<{ label: string; value: number }>;
    }> = [];

    if (modalInputs.length) {
      const flows = workOrder?.flow ?? [];
      const inputsMap = new Map(modalInputs.map((i) => [i.areaId, i.values]));

      areasFromBadModal = flows.flatMap((flow: any) => {
        const areaIdNum = Number(flow?.area_id);
        if (!Number.isFinite(areaIdNum)) return [];

        const block = AREA_KEY_BY_ID[areaIdNum];
        if (!block) return [];

        const blockData = flow.areaResponse?.[block];
        const blockId = blockData?.id ?? null;
        if (!blockId) return [];

        const formId = blockData?.form_auditory_id ?? null;
        const cqmId = blockData?.form_answer_id ?? null;

        const areaKey = (flow.area?.name ?? '')
          .toLowerCase()
          .replace(/\s/g, '');
        const supportsMaterial = blockSupportsMaterial(block);
        const badKey = `${areaKey}_bad`;
        const materialKey = `${areaKey}_material`;

        const data: Record<string, number> = {
          bad_quantity: toInt(areaBadQuantities[badKey]),
        };
        if (supportsMaterial) {
          data.material_quantity = toInt(areaBadQuantities[materialKey]);
        }

        return [
          {
            areaId: areaIdNum,
            block,
            blockId,
            formId,
            cqmId,
            data,
            inputsByArea: inputsMap.get(areaIdNum) ?? [],
          },
        ];
      });
    }

    const sourceAreaId = badModalOwner?.id ?? null;
    const sourceWorkOrderFlowId =
      workOrder?.flow?.find((f: any) => Number(f?.area_id) === sourceAreaId)
        ?.id ?? null;

    const combinedAreas = [...areasFromTable, ...areasFromBadModal];

    const areasForDataUpdate = combinedAreas
      .map((item) => {
        if (!item?.block) return null;

        const areaIdNum = Number(item.areaId);
        const blockIdNum = Number(item.blockId);

        if (
          !Number.isFinite(areaIdNum) ||
          !Number.isFinite(blockIdNum) ||
          blockIdNum <= 0
        ) {
          return null;
        }

        const sanitizedData: Record<string, number> = {};
        Object.entries(item.data ?? {}).forEach(([key, value]) => {
          const numeric = Number(value);
          if (Number.isFinite(numeric)) {
            sanitizedData[key] = Math.round(numeric);
          }
        });

        const sampleRaw = (item as any).sample_data ?? {};
        const sampleSanitized: Record<string, number> = {};

        if (sampleRaw.sample_quantity !== undefined) {
          const numeric = Number(sampleRaw.sample_quantity);
          if (Number.isFinite(numeric)) {
            sampleSanitized.sample_quantity = Math.round(numeric);
          }
        }
        if (sampleRaw.sample_auditory !== undefined) {
          const numeric = Number(sampleRaw.sample_auditory);
          if (Number.isFinite(numeric)) {
            sampleSanitized.sample_auditory = Math.round(numeric);
          }
        }

        if (
          Object.keys(sanitizedData).length === 0 &&
          Object.keys(sampleSanitized).length === 0
        ) {
          return null;
        }

        const entry: {
          areaId: number;
          block: string;
          blockId: number;
          formId?: number;
          cqmId?: number;
          data: Record<string, number>;
          sample_data?: Record<string, number>;
        } = {
          areaId: areaIdNum,
          block: String(item.block),
          blockId: blockIdNum,
          data: sanitizedData,
        };

        const formIdNum = Number((item as any).formId);
        if (Number.isFinite(formIdNum) && formIdNum > 0) {
          entry.formId = formIdNum;
        }

        const cqmIdNum = Number((item as any).cqmId);
        if (Number.isFinite(cqmIdNum) && cqmIdNum > 0) {
          entry.cqmId = cqmIdNum;
        }

        if (Object.keys(sampleSanitized).length > 0) {
          entry.sample_data = sampleSanitized;
        }

        return entry;
      })
      .filter(Boolean) as Array<{
      areaId: number;
      block: string;
      blockId: number;
      formId?: number;
      cqmId?: number;
      data: Record<string, number>;
      sample_data?: Record<string, number>;
    }>;

    const summary = modalInputs
      .map((item) => {
        const areaId = Number(item.areaId);
        const areaName =
          item.areaName ??
          effectiveAreas.find((area) => Number(area.id) === areaId)?.name ??
          '';
        const values = (item.values ?? [])
          .map((entry) => ({
            label: entry?.label ?? '',
            value: Number.isFinite(Number(entry?.value))
              ? Number(entry?.value)
              : 0,
          }))
          .filter((entry) => !!entry.label);

        return {
          areaId,
          areaName,
          values,
        };
      })
      .filter(
        (entry) =>
          Number.isFinite(entry.areaId) &&
          !!entry.areaName &&
          entry.values.length > 0
      );

    if (areasForDataUpdate.length === 0 && summary.length === 0) {
      Alert.alert('Sin cambios', 'No hay cambios para guardar.');
      return;
    }

    try {
      if (areasForDataUpdate.length > 0) {
        await updateAreaResponseData(workOrder.ot_id, {
          areas: areasForDataUpdate,
        });
      }

      if (summary.length > 0) {
        const payload: any = {
          badQuantitySummary: summary,
        };
        if (sourceAreaId) {
          payload.sourceAreaId = sourceAreaId;
        }
        if (sourceWorkOrderFlowId) {
          payload.sourceWorkOrderFlowId = sourceWorkOrderFlowId;
        }

        await updateWorkOrderAreas(workOrder.ot_id, payload);
      }

      Alert.alert('Éxito', 'Cambios guardados correctamente');
      fetchAndSetData(String(id));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Error al guardar los cambios');
    } finally {
      setBadModalOwner(null);
    }
  };

  const filteredAreas = areas.filter(
    (area) =>
      area.status === 'Completado' && area.name.toLowerCase() !== 'preprensa'
  );
  const getStatusStyleMobile = (status: string) => {
    switch (status) {
      case 'Completado':
        return { backgroundColor: '#D1FAE5', textColor: '#065F46' };
      case 'Pendiente':
        return { backgroundColor: '#FEF3C7', textColor: '#92400E' };
      case 'En proceso':
        return { backgroundColor: '#DBEAFE', textColor: '#1E3A8A' };
      case 'Parcial':
        return { backgroundColor: '#FDE68A', textColor: '#92400E' };
      case 'En calidad':
      case 'Enviado a CQM':
      case 'Listo':
        return { backgroundColor: '#FEF9C3', textColor: '#92400E' };
      case 'Enviado a Auditoria':
        return { backgroundColor: '#E9D5FF', textColor: '#6B21A8' };
      default:
        return { backgroundColor: '#E5E7EB', textColor: '#374151' };
    }
  };

  const renderEditableNumber = (value: any, onChange: (t: string) => void) => (
    <TextInput
      mode="outlined"
      activeOutlineColor="#000"
      keyboardType="numeric"
      value={String(value ?? 0)}
      onChangeText={onChange}
      style={[styles.input, { height: 40 }]}
    />
  );

  const renderCell = (area: AreaData, field: NumericField) => {
    if (workOrder?.status === 'Cerrado')
      return <Text style={styles.cellUser}>{Number(area[field] ?? 0)}</Text>;
    if (area.status !== 'Completado')
      return <Text style={styles.cellUser}>{Number(area[field] ?? 0)}</Text>;

    if (area.id === 1 && field === 'buenas')
      return renderEditableNumber(area[field], (t) =>
        handleValueChange(area.id, field, t)
      );
    if (area.id === 1 && field !== 'buenas')
      return <Text style={styles.cellUser}>{Number(area[field] ?? 0)}</Text>;

    if (field === 'cqm') {
      if (area.id >= 2)
        return renderEditableNumber(area[field], (t) =>
          handleValueChange(area.id, field, t)
        );
      return <Text style={styles.cellUser}>{Number(area[field] ?? 0)}</Text>;
    }

    if (field === 'muestras' || field === 'defectuoso') {
      if (area.id >= 6)
        return renderEditableNumber(area[field], (t) =>
          handleValueChange(area.id, field, t)
        );
      return <Text style={styles.cellUser}>{Number(area[field] ?? 0)}</Text>;
    }

    if (field === 'malas') {
      if (area.id >= 6) {
        return (
          <TouchableOpacity onPress={() => handleOpenBadQuantityModal(area)}>
            <View
              style={[
                styles.input,
                {
                  height: 40,
                  backgroundColor: '#eaeaf5',
                  borderRadius: 9,
                  justifyContent: 'center',
                },
              ]}
            >
              <Text style={{ textAlign: 'center' }}>
                {sumBadBySource(area.id)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }
      return renderEditableNumber(area[field], (t) =>
        handleValueChange(area.id, field, t)
      );
    }

    // buenas / excedente normales
    return renderEditableNumber(area[field], (t) =>
      handleValueChange(area.id, field, t)
    );
  };

  const fieldLabels: Record<string, string> = {
    buenas: 'Buenas',
    malas: 'Malas',
    excedente: 'Excedente',
    noprocess: 'Sin procesar',
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Información de la Orden #{id}</Text>

      <View style={styles.card}>
        <InfoCard
          label="Número de Orden"
          value={String(workOrder?.ot_id ?? '')}
        />
        <InfoCard
          label="Id del Presupuesto"
          value={String(workOrder?.mycard_id ?? '')}
        />
        <InfoCard
          label="Cantidad (TARJETAS)"
          value={String(workOrder?.quantity ?? '')}
        />
        <InfoCard
          style={{ backgroundColor: '#93C5FD' }}
          label="Cantidad (Hojas Frente / Hojas Vuelta)"
          value={String(totalSheetsEffective)}
        />
        <InfoCard
          label="Fecha de Creación"
          value={
            workOrder?.createdAt
              ? new Date(workOrder.createdAt).toLocaleDateString()
              : '—'
          }
        />
        <InfoCard
          label="Comentarios"
          value={String(workOrder?.comments ?? '')}
        />
        <InfoCard label="Archivos de la Orden de Trabajo">
          {Array.isArray(workOrder?.files) && workOrder.files.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={fileStyles.row}
            >
              {workOrder.files.map((file: any) => (
                <TouchableOpacity
                  key={file.id}
                  onPress={() => downloadFile(file.file_path)}
                  style={fileStyles.button}
                  activeOpacity={0.8}
                >
                  <Text style={fileStyles.buttonText}>
                    {getLabelByType(file.type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={fileStyles.empty}>
              No se ha adjuntado ningún archivo
            </Text>
          )}
        </InfoCard>
        <InfoCard label="Evidencias de destrucción">
          {Array.isArray(workOrder?.files) &&
          workOrder.files.some(
            (f: any) => f.type === 'DESTRUCTION_EVIDENCE'
          ) ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={fileStyles.row}
            >
              {workOrder.files
                .filter((file: any) => file.type === 'DESTRUCTION_EVIDENCE')
                .map((file: any, idx: number) => (
                  <TouchableOpacity
                    key={file.id ?? `evidence-${idx}`}
                    onPress={() => downloadFile(file.file_path)}
                    style={fileStyles.button}
                    activeOpacity={0.8}
                  >
                    <Text style={fileStyles.buttonText}>
                      {`Ver Evidencia ${idx + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          ) : (
            <Text style={fileStyles.empty}>No hay evidencias adjuntas</Text>
          )}
        </InfoCard>
      </View>

      {areas.length > 0 && <ProgressBarAreas areas={areas} />}

      <Text style={styles.subtitle}>Datos de Producción por Área</Text>
      <ScrollView horizontal>
        <View style={styles.table}>
          {/* Encabezado con columnas por parciales y remanente */}
          <View style={styles.headerRow}>
            <Text style={styles.cellLabel} />
            {areas.map((area, idx) => (
              <View
                key={`hdr-${area.id}-${idx}`}
                style={{ flexDirection: 'row' }}
              >
                {area.parciales > 0 ? (
                  <>
                    {Array.from({ length: area.parciales }).map((_, i) => (
                      <Text
                        key={`hdr-${area.id}-p${i + 1}`}
                        style={styles.cellUser}
                      >
                        {area.name}{' '}
                        {area.isCollator && area.id === 4 ? '(C)' : ''}
                        {'\n'}
                        <Text style={{ fontSize: 11, color: '#6b7280' }}>{`P${
                          i + 1
                        }`}</Text>
                      </Text>
                    ))}
                    {getRemainder(area) > 0 && (
                      <>
                        <Text
                          key={`hdr-${area.id}-rem`}
                          style={[styles.cellUser, { fontWeight: '600' }]}
                        >
                          {area.name}
                          {'\n'}
                          <Text style={{ fontSize: 11, color: '#6b7280' }}>
                            Rem
                          </Text>
                        </Text>
                        <Text
                          key={`hdr-${area.id}-sum`}
                          style={[styles.cellUser, { fontWeight: '600' }]}
                        >
                          {area.name}
                          {'\n'}
                          <Text style={{ fontSize: 11, color: '#6b7280' }}>
                            Σ
                          </Text>
                        </Text>
                      </>
                    )}
                  </>
                ) : (
                  <Text key={`hdr-${area.id}-total`} style={styles.cellUser}>
                    {area.name}
                    {area.isCollator && area.id === 4 ? ' (C)' : ''}
                    {'\n'}
                    <Text style={{ fontSize: 11, color: '#6b7280' }}>
                      Total
                    </Text>
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Encargado (remanente) */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Encargado (remanente)</Text>
            {areas.map((area) => {
              const editable = canEditUser(area, null);
              const currentAssignedName =
                (area.assigned_user_id != null
                  ? operatorById.get(area.assigned_user_id)
                  : undefined) ??
                area.usuario ??
                'No definido';

              const cells = renderSpannedCells(area, 'encargado', () => (
                <TouchableOpacity
                  disabled={!editable}
                  onPress={() => openOperatorModal(area, null)}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    backgroundColor: editable ? '#fff' : '#f3f4f6',
                    alignSelf: 'center',
                  }}
                >
                  <Text style={{ color: '#111827' }}>
                    {currentAssignedName}
                  </Text>
                </TouchableOpacity>
              ));

              // 👉 Si hay Rem, fuerza también la celda Σ para alinear con el header
              const hasRem = getRemainder(area) > 0;
              if ((area.parciales || 0) > 0 && hasRem) {
                const expected = (area.parciales || 0) + 2; // P... + Rem + Σ
                while (cells.length < expected) {
                  cells.push(
                    <Text
                      key={`enc-${area.id}-sum`}
                      style={[styles.cellUser]}
                    />
                  );
                }
              }

              return (
                <React.Fragment key={`enc-${area.id}`}>{cells}</React.Fragment>
              );
            })}
          </View>

          {/* Usuario */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Usuario</Text>
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
                    <Text
                      key={`area-${area.id}-usuario-${p.id ?? pIndex}`}
                      style={styles.cellUser}
                    >
                      {releasedByName}
                    </Text>
                  );
                });
                const rem = getRemainder(area) > 0;
                if (rem) {
                  const lastP = getLastPartial(area);
                  const lastUser = getPartialUserName(
                    lastP,
                    area,
                    operatorById
                  );

                  // Rem
                  cells.push(
                    <Text
                      key={`area-${area.id}-usuario-rem`}
                      style={[styles.cellUser, { fontWeight: '600' }]}
                    >
                      {lastUser}
                    </Text>
                  );

                  // Σ (placeholder para alinear; si quieres, muestra también el usuario del total)
                  cells.push(
                    <Text
                      key={`area-${area.id}-usuario-sum`}
                      style={[styles.cellUser]}
                    >
                      {/* vacío para alinear o algún resumen */}
                    </Text>
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
                <Text
                  key={`area-${area.id}-usuario-${aIndex}`}
                  style={styles.cellUser}
                >
                  {currentNameNoPartial}
                </Text>
              );
            })}
          </View>

          {/* Calidad */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Calidad</Text>

            {areas.flatMap((area, aIdx) => {
              if ((area.parciales || 0) > 0) {
                const reviewers = getPerPartialReviewers(area) || [];

                return reviewers.map((name: string, i: number) => {
                  const highlighted = !!name && name !== '—';
                  const isRem = i >= (area.parciales || 0);

                  return (
                    <View
                      key={`cell-area-${area.id}-parcial-${i}-calidad`}
                      style={styles.cellUser}
                      accessible
                      accessibilityLabel={
                        isRem ? 'Remanente' : `Parcial ${i + 1}`
                      }
                    >
                      <View
                        style={[
                          pillStyles.pill,
                          highlighted && pillStyles.pillHighlighted,
                        ]}
                      >
                        <Text
                          style={[
                            pillStyles.pillText,
                            highlighted && pillStyles.pillTextHighlighted,
                          ]}
                        >
                          {name || '—'}
                        </Text>
                      </View>
                    </View>
                  );
                });
              }

              const lastAns = getLastAnswer(area);
              const reviewerName = getReviewerNameFromAnswer(lastAns) || '—';
              const highlighted = reviewerName !== '—';

              return (
                <View
                  key={`cell-area-${area.id}-calidad-${aIdx}`}
                  style={styles.cellUser}
                  accessible
                  accessibilityLabel="Calidad"
                >
                  <View
                    style={[
                      pillStyles.pill,
                      highlighted && pillStyles.pillHighlighted,
                    ]}
                  >
                    <Text
                      style={[
                        pillStyles.pillText,
                        highlighted && pillStyles.pillTextHighlighted,
                      ]}
                    >
                      {reviewerName}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Auditor */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Auditor</Text>
            {areas.flatMap((area, aIdx) => {
              if (area.parciales > 0) {
                const reviewers = getPerPartialAuditors(area) || [];
                const cells = reviewers.map((name, i) => (
                  <Text
                    key={`cell-area-${area.id}-partial-${i}-auditor`}
                    style={styles.cellUser}
                  >
                    {name || '-'}
                  </Text>
                ));

                if (getRemainder(area) > 0) {
                  cells.push(
                    <Text
                      key={`cell-area-${area.id}-auditor-sum`}
                      style={styles.cellUser}
                    >
                      {/* vacío o total de auditor si aplica */}
                    </Text>
                  );
                }

                return cells;
              }
              const auditor = getLastAuditor(area); // MiniAud | null
              const auditorName = auditor?.username ?? '—'; // <- normalizas a string
              console.log('LastNas auditorName', auditorName);
              return (
                <Text
                  key={`cell-area-${area.id}-auditor-${aIdx}`}
                  style={styles.cellUser}
                >
                  {auditorName}
                </Text>
              );
            })}
          </View>

          {/* Estado */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Estado</Text>
            {areas.map((area) => {
              const { backgroundColor, textColor } = getStatusStyleMobile(
                area.status
              );

              const cells = renderSpannedCells(area, 'estado', () => (
                <View
                  style={{
                    backgroundColor,
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    alignSelf: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: textColor,
                      fontWeight: 'bold',
                      fontSize: 12,
                    }}
                  >
                    {area.status}
                  </Text>
                </View>
              ));

              return (
                <React.Fragment key={`estado-${area.id}`}>
                  {cells}
                </React.Fragment>
              );
            })}
          </View>

          {/* Producción */}
          <View style={[styles.row, { backgroundColor: '#f3f4f6' }]}>
            <Text
              style={[
                styles.cellLabel,
                { fontWeight: '700', color: '#6b7280' },
              ]}
            >
              📥 Producción
            </Text>
            {Array.from({ length: totalColsDynamic }).map((_, i) => (
              <Text key={`prod-sp-${i}`} style={[styles.cellUser]} />
            ))}
          </View>

          {(
            ['buenas', 'malas', 'excedente', 'noprocess'] as NumericField[]
          ).map((field) => (
            <View key={`row-${field}`} style={styles.row}>
              <Text style={styles.cellLabel}>{fieldLabels[field]}</Text>
              {areas.flatMap((area, aIndex) => {
                if (area.parciales > 0 && area.partials?.length) {
                  const cells = area.partials.map((p, pIndex) => {
                    const value =
                      field === 'buenas'
                        ? toNum(p.quantity)
                        : field === 'malas'
                        ? toNum(p.bad_quantity)
                        : field === 'excedente'
                        ? toNum(p.excess_quantity)
                        : toNum(p.noprocess_quantity);

                    return (
                      <Text
                        key={`area-${area.id}-parcial-${p.id}-${field}-${pIndex}`}
                        style={styles.cellUser}
                      >
                        {value}
                      </Text>
                    );
                  });

                  const hasRem = getRemainder(area) > 0;
                  let remValue = 0;
                  if (hasRem) {
                    switch (field) {
                      case 'buenas':
                        remValue = getRemainderByField(area, 'buenas');
                        break;
                      case 'malas':
                        remValue = getRemainderByField(area, 'malas');
                        break;
                      case 'excedente':
                        remValue = getRemainderByField(area, 'excedente');
                        break;
                      case 'noprocess':
                        remValue = getRemainderByField(area, 'noprocess');
                        break;
                      default:
                        remValue = 0;
                    }

                    // Rem
                    cells.push(
                      <Text
                        key={`prod-${area.id}-${field}-rem`}
                        style={[styles.cellUser, { fontWeight: '600' }]}
                      >
                        {remValue}
                      </Text>
                    );

                    // Σ = suma de parciales + rem
                    const sumVal =
                      cells
                        .slice(0, area.parciales) // solo parciales (los primeros N)
                        .reduce(
                          (acc, el) => acc + toNum((el as any).props.children),
                          0
                        ) + toNum(remValue);

                    cells.push(
                      <Text
                        key={`prod-${area.id}-${field}-sum`}
                        style={[styles.cellUser, { fontWeight: '700' }]}
                      >
                        {renderCell(area, field)}
                      </Text>
                    );
                  }

                  return cells;
                }
                return (
                  <View
                    key={`prod-${area.id}-${field}-single-${aIndex}`}
                    style={styles.cellUser}
                  >
                    {renderCell(area, field)}
                  </View>
                );
              })}
            </View>
          ))}
          <View style={[styles.row, { backgroundColor: '#f3f4f6' }]}>
            <Text
              style={[
                styles.cellLabel,
                { fontWeight: '700', color: '#6b7280' },
              ]}
            >
              🔍 Calidad
            </Text>
            {Array.from({ length: totalColsDynamic }).map((_, i) => (
              <Text key={`prod-sp-${i}`} style={[styles.cellUser]} />
            ))}
          </View>

          {(['defectuoso', 'cqm', 'muestras'] as const).map((field) => (
            <View key={`row-${field}`} style={styles.row}>
              <Text style={styles.cellLabel}>
                {field === 'defectuoso' ? 'materia prima defectuosa' : field}
              </Text>
              {areas.flatMap((area, aIdx) => {
                if (area.parciales > 0) {
                  const hasRem = getRemainder(area) > 0;
                  const vals =
                    field === 'cqm'
                      ? getPerPartialCqm(area) // incluye Rem como último índice si lo manejas así
                      : getPerPartialValues(
                          area,
                          field as 'defectuoso' | 'muestras'
                        );

                  const cells = vals.map((v, i) => (
                    <Text
                      key={`cell-area-${area.id}-parcial-${i}-${field}`}
                      style={styles.cellUser}
                    >
                      {v}
                    </Text>
                  ));

                  if (hasRem) {
                    const toN = (x: any) =>
                      typeof x === 'number' ? x : toNum(x);
                    const sumVal = (vals as (number | string)[]).reduce<number>(
                      (acc, x) => acc + toN(x),
                      0
                    );
                    cells.push(
                      <Text
                        key={`cell-area-${area.id}-sum-${field}`}
                        style={[styles.cellUser, { fontWeight: '700' }]}
                      >
                        {renderCell(area, field)}
                      </Text>
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
                  <View
                    key={`cell-area-${area.id}-no-ans-${field}-${aIdx}`}
                    style={styles.cellUser}
                  >
                    {React.isValidElement(totalValue) ? (
                      totalValue
                    ) : (
                      <Text style={styles.cellUser}>
                        {String(totalValue ?? 0)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Suma Total */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>📊 Suma Total</Text>
            {areas.map((area) => {
              const cells = renderSpannedCells(area, 'suma-total', () => (
                <Text style={styles.cellUser}>
                  {String(getAreaSumaTotal(area))}
                </Text>
              ));
              return (
                <React.Fragment key={`suma-${area.id}`}>{cells}</React.Fragment>
              );
            })}
          </View>

          {/* Buenas + Excedente */}
          <View style={[styles.row, { backgroundColor: '#d7e6d1' }]}>
            <Text style={styles.cellLabel}>BUENAS + EXCEDENTE</Text>
            {areas.map((area) => {
              const cells = renderSpannedCells(area, 'buenas-excedente', () => (
                <Text style={styles.cellUser}>
                  {area.id >= 6 ? String(area.buenas + area.excedente) : ''}
                </Text>
              ));
              return (
                <React.Fragment key={`bx-${area.id}`}>{cells}</React.Fragment>
              );
            })}
          </View>

          {/* Control de Auditoria */}
          <View style={[styles.row, { backgroundColor: '#eef2ff' }]}>
            <Text style={styles.cellLabel}>🔍 Auditoría</Text>
            {areas.map((area, index) => {
              const partials = area.partials ?? [];
              const totalQty = partials.reduce(
                (sum, p) => sum + (Number(p?.quantity) || 0),
                0
              );
              const totalRel = partials.reduce(
                (sum, p) => sum + (Number(p?.release_quantity) || 0),
                0
              );
              const restante = totalQty - totalRel;

              const cells = renderSpannedCells(area, 'auditoria', () => (
                <Text style={styles.cellUser}>
                  {index === areas.length - 1 && area.parciales > 0
                    ? String(restante)
                    : ''}
                </Text>
              ));

              return (
                <React.Fragment key={`aud-${area.id}`}>{cells}</React.Fragment>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {workOrder?.status !== 'En proceso' && (
        <>
          <Text style={styles.subtitle}>Cuadres</Text>
          <View style={styles.tableCuadres}>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Buenas Última Operación</Text>
              <Text style={styles.cellValue}>{ultimaArea?.buenas ?? ''}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Excedente Última Operación</Text>
              <Text style={styles.cellValue}>
                {ultimaArea?.excedente ?? ''}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Total Malas</Text>
              <Text style={styles.cellValue}>{totalMalas}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>
                Total Materia Prima Defectuosa
              </Text>
              <Text style={styles.cellValue}>{totalDefectuoso}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Total CQM</Text>
              <Text style={styles.cellValue}>{totalCqm}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Total Muestras</Text>
              <Text style={styles.cellValue}>{totalMuestras}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>TOTAL</Text>
              <Text style={styles.cellValue}>{totalGeneral}</Text>
            </View>
          </View>
        </>
      )}

      {workOrder && (
        <PartialHistory
          workOrder={workOrder}
          partialSectionOpen={partialSectionOpen}
          togglePartialSection={() => setPartialSectionOpen((s) => !s)}
          areaTotalsByAreaId={areaTotalsByAreaId}
        />
      )}

      <VistosBuenosHistory
        history={vistosBuenosHistory}
        qualitySectionOpen={qualitySectionOpen}
        toggleQualitySection={toggleQualitySection}
      />
      <InconformitiesHistory
        inconformities={inconformities}
        qualitySectionOpen={inconformitySectionOpen}
        toggleQualitySection={toggleInconformitySection}
      />

      {workOrder?.status !== 'Cerrado' && (
        <>
          <TouchableOpacity
            style={styles.buttonSave}
            onPress={() => handleSaveChanges()}
          >
            <Text style={styles.buttonText}>Guardar Cambios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowConfirm(true)}
          >
            <Text style={styles.buttonText}>Cerrar Orden de Trabajo</Text>
          </TouchableOpacity>
        </>
      )}

      <BadQuantityModal
        visible={showBadQuantity}
        areas={filteredAreas}
        areaBadQuantities={areaBadQuantities}
        setAreaBadQuantities={setAreaBadQuantities}
        onConfirm={(result: BadQuantityModalResult) => {
          setShowBadQuantity(false);
          handleSaveChanges(result);
          setBadModalOwner(null);
        }}
        onClose={() => {
          setShowBadQuantity(false);
          setBadModalOwner(null);
        }}
      />

      {/* Modal reasignación operador */}
      <Modal visible={opModal.open} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={[styles.modalText, { fontWeight: '700' }]}>
              Asignar operador {opModal.area ? `- ${opModal.area.name}` : ''}
              {opModal.partial ? ' (Parcial abierto)' : ''}
            </Text>
            <TextInput
              mode="outlined"
              activeOutlineColor="#000"
              placeholder="Buscar operador por nombre..."
              value={opModal.search}
              onChangeText={(t) => setOpModal((s) => ({ ...s, search: t }))}
              style={{ marginBottom: 12 }}
            />
            <ScrollView
              style={{
                maxHeight: 240,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 10,
              }}
            >
              {modalOptions.length === 0 ? (
                <View style={{ padding: 12 }}>
                  <Text style={{ color: '#6b7280' }}>
                    No hay operadores para esta área o no hay coincidencias.
                  </Text>
                </View>
              ) : (
                modalOptions.map((u) => {
                  const selected = u.id === opModal.selectedUserId;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      onPress={() =>
                        setOpModal((s) => ({ ...s, selectedUserId: u.id }))
                      }
                      style={{
                        padding: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f3f4f6',
                        backgroundColor: selected ? '#DBEAFE' : 'white',
                      }}
                    >
                      <Text style={{ color: '#111827' }}>{u.username}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 16,
              }}
            >
              <TouchableOpacity
                onPress={closeOperatorModal}
                style={styles.cancelButton}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmOperatorModal}
                style={[
                  styles.confirmButton,
                  { opacity: opModal.selectedUserId == null ? 0.6 : 1 },
                ]}
                disabled={opModal.selectedUserId == null}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              ¿Deseas cerrar esta Orden de Trabajo?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowConfirm(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCloseOrder}
                style={styles.confirmButton}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default WorkOrderDetailScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fdfaf6',
  },
  cellHeader: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'left',
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  cellLabel: {
    flex: 1,
    fontWeight: '600',
    textAlign: 'left',
    width: 150,
  },
  cellUser: {
    flex: 1,
    minWidth: 100,
    maxWidth: 100,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellValue: {
    flex: 1,
    minWidth: 30,
    textAlign: 'right',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'black',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    elevation: 3,
  },
  label: {
    fontWeight: '600',
    marginTop: 8,
  },
  value: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  table: {
    padding: 10,
    backgroundColor: '#fff',
  },
  tableCuadres: {
    padding: 10,
    backgroundColor: '#fff',
    maxWidth: '76%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#cacecd',
    borderTopStartRadius: 6,
    fontSize: 17,
    height: 40,
    alignContent: 'center',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 7,
  },
  cell: {
    width: 85,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  input: {
    width: 80,
    marginVertical: 4,
  },
  button: {
    backgroundColor: '#0038A8',
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonSave: {
    backgroundColor: '#A9A9A9',
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 18,
    width: '80%',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 18,
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    padding: 10,
    borderRadius: 18,
    flex: 1,
  },
  modalButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
  progressContainer: {
    height: 12,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    marginTop: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 8,
  },
});

const fileStyles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
    marginRight: 8,
  },
  buttonText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  empty: { fontSize: 16, fontWeight: '600', color: '#111827' },
});
const pillStyles = {
  pill: {
    paddingHorizontal: 8, // px-2
    paddingVertical: 4, // py-1
    borderRadius: 10, // rounded-lg
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillHighlighted: {
    backgroundColor: '#FEF3C7', // bg-yellow-100
  },
  pillText: {
    fontSize: 12, // text-sm
    fontWeight: '500', // font-medium
  },
  pillTextHighlighted: {
    color: '#92400E', // text-yellow-800
    fontWeight: '600',
  },
} as const;
