// myorg/apps/frontend-mobile/src/app/protected/cerrarOrdenDeTrabajo/[id]/page.tsx
'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { InternalStackParamList } from '../../../../navigation/types';

import InfoCard from '../../../../components/SeguimientoDeOts/InfoCard';
import PartialHistory from '../../../../components/SeguimientoDeOts/PartialHistory';
import {
  fetchWorkOrderById,
  fetchAllUsers,
  updateFlowAssignedUser,
  updateWorkOrderAreas,
} from '../../../../api/seguimientoDeOts';
import { getFileByName } from '../../../../api/finalizacion';
import {
  cerrarParcialWorkOrderAuditory,
  liberarWorkOrderAuditory,
} from '../../../../api/cerrarOrdenDeTrabajo';
import { subirArchivoOrden } from '../../../../api/subirArchivoOrden';
import { AreaTotalsForPartialHistory } from '../../../../components/SeguimientoDeOts/PartialHistory';

import {
  getPerPartialReviewers,
  getLastAnswer,
  getSingleCqm,
  getReviewerNameFromAnswer,
  getPerPartialCqm,
  getPerPartialAuditors,
  getLastAuditor,
} from '../../../../components/SeguimientoDeOts/util/quality';

import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import FileViewer from 'react-native-file-viewer';
import * as DocumentPicker from 'expo-document-picker';

import {
  AreaData,
  OperatorUser,
  NumericField,
} from '../../seguimientoDeOts/[id]/page';

type WorkOrderDetailRouteProp = RouteProp<
  InternalStackParamList,
  'CerrarOrdenDeTrabajoAuxScreen'
>;

// ========================================================
// Types
// ========================================================

export type InconformityData = {
  id: number;
  comments: string;
  createdAt: string;
  createdBy: string;
  area: string;
};

interface Props {
  params: Promise<{ id: string }>;
}

type RNPickedFile = {
  uri: string;
  name: string;
  mimeType: string;
};

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

// ========================================================
// Component
// ========================================================

const CerrarOrdenDeTrabajoAuxScreen: React.FC = () => {
  const route = useRoute<WorkOrderDetailRouteProp>();
  const { id } = route.params;
  const navigation = useNavigation();

  const [workOrder, setWorkOrder] = useState<any>(null);
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [operatorUsers, setOperatorUsers] = useState<OperatorUser[]>([]);
  const [vistosBuenosHistory, setVistosBuenosHistory] = useState<any[]>([]);
  const [inconformities, setInconformities] = useState<InconformityData[]>([]);
  const [evidenceFile, setEvidenceFile] = useState<RNPickedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressWidth, setProgressWidth] = useState(0);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<{
    [key: string]: string;
  }>({});

  const [partialSectionOpen, setPartialSectionOpen] = useState(false);

  const [showQtyModal, setShowQtyModal] = useState(false);
  const [qtyToClient, setQtyToClient] = useState<string>('');
  const [qtyError, setQtyError] = useState<string>('');

  // ---- Derived ----

  // justo antes de lastStatus / needsEvidence (debajo de los useState está perfecto)
  const lastFlow = useMemo(() => {
    const flows = workOrder?.flow;
    if (!Array.isArray(flows) || flows.length === 0) return null;
    return flows[flows.length - 1];
  }, [workOrder]);

  const lastStatus = lastFlow?.status?.toLowerCase() ?? '';
  const needsEvidence = lastStatus === 'en auditoria';
  const getAreaSumaTotal = (area: AreaData) => {
    let buenas = Number(area.buenas ?? 0);
    let malas = Number(area.malas ?? 0);
    let excedente = Number(area.excedente ?? 0);
    let noprocess = Number(area.noprocess ?? 0);
    let defectuoso = Number(area.defectuoso ?? 0);
    let cqm = Number(area.cqm ?? 0);
    let muestras = Number(area.muestras ?? 0);

    if (area.partials?.length) {
      const sums = area.partials.reduce(
        (acc, p) => {
          acc.buenas += Number(p?.quantity ?? 0);
          acc.muestras += Number(p?.formAuditory?.sample_auditory ?? 0);
          return acc;
        },
        { buenas: 0, muestras: 0 }
      );

      const rem = getRemainder(area);
      buenas = sums.buenas + rem;

      const answersCqm = (area.answers ?? []).reduce(
        (s, a) => s + Number(a?.sample_quantity ?? 0),
        0
      );
      cqm = answersCqm;

      muestras = Number(area.muestras ?? 0) + sums.muestras;
    }

    return buenas + malas + excedente + noprocess + defectuoso + cqm + muestras;
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

  const modalOptions = useMemo(() => {
    if (!opModal.areaId) return [];
    const base = getUserOptionsForArea(opModal.areaId);
    const q = opModal.search.trim().toLowerCase();
    return q ? base.filter((u) => u.username.toLowerCase().includes(q)) : base;
  }, [opModal.areaId, opModal.search, operatorOptionsByAreaId]);

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

  // ======================================================
  // Derived totals / helpers
  // ======================================================

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

  const pickEvidence = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset) return;

      setEvidenceFile({
        uri: asset.uri,
        name: asset.name ?? 'evidencia',
        mimeType: asset.mimeType ?? 'application/octet-stream',
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
    }
  }, []);

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

  const getFlowIdInAudit = (workOrder: any): number | null => {
    const flows = workOrder?.flow ?? [];
    const norm = (s?: string | null) => (s ?? '').toLowerCase();

    const found = flows.find((f: any) => norm(f.status).includes('auditoria'));
    return found?.id ?? null;
  };

  const handleCloseOrder = async () => {
    try {
      if (needsEvidence && !evidenceFile) {
        Alert.alert(
          'Evidencia requerida',
          'Adjunta la evidencia (imagen o PDF) para cerrar la OT.'
        );
        return;
      }

      if (needsEvidence && evidenceFile) {
        const orderId = workOrder?.id ?? workOrder?.workOrder?.id;
        if (!orderId) {
          Alert.alert('Error', 'No se encontró el ID de la orden.');
          return;
        }

        await subirArchivoOrden(
          workOrder.id,
          evidenceFile,
          'DESTRUCTION_EVIDENCE'
        );
      }
      const flowId = getFlowIdInAudit(workOrder);
      if (flowId == null) {
        Alert.alert(
          'Error',
          'No se encontró un flujo en Auditoría para cerrar la OT.'
        );
        return;
      }

      const payload: { workOrderFlowId: number; workOrderId: number } = {
        workOrderFlowId: flowId, // ahora es number garantizado
        workOrderId: Number(workOrder.id),
      };

      console.log('Payload to send:', payload);

      await liberarWorkOrderAuditory(payload);
      setShowConfirm(false);
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

  const getAreaColCount = (area: AreaData) =>
    area.parciales > 0 ? area.parciales + (getRemainder(area) > 0 ? 1 : 0) : 1;

  const renderSpannedCells = (
    area: AreaData,
    keyBase: string,
    renderContent: () => React.ReactNode // 👈 acepta ReactNode
  ): React.ReactElement[] => {
    const cols = getAreaColCount(area);
    const contentEl = ensureElement(renderContent()); // 👈 obligamos a Element
    const emptyEl = <View />;

    const cells: React.ReactElement[] = [];
    for (let i = 0; i < cols; i++) {
      cells.push(
        <View key={`${keyBase}-${area.id}-${i}`} style={styles.cellUser}>
          {i === cols - 1 ? contentEl : emptyEl}
        </View>
      );
    }
    return cells;
  };

  const totalCols = areas.reduce(
    (sum, area) =>
      sum +
      (area.parciales > 0
        ? area.parciales + (getRemainder(area) > 0 ? 1 : 0)
        : 1),
    0
  );

  const getSumaMalasHasta = (areaId: number): number => {
    return areas
      .filter((a) => a.id <= areaId)
      .reduce((sum, a) => sum + (a.malas || 0), 0);
  };

  const handleConfirmQuantity = async () => {
    const indexPartial =
      workOrder?.flow?.[workOrder.flow.length - 1]?.partialReleases?.length - 1;
    const n = Number(qtyToClient);
    if (!Number.isFinite(n) || n <= 0) {
      setQtyError('Ingresa una cantidad válida mayor que 0.');
      return;
    }
    if (
      workOrder?.flow?.[workOrder.flow.length - 1]?.partialReleases?.[
        indexPartial
      ]?.quantity <
      n +
        workOrder?.flow?.[workOrder.flow.length - 1]?.partialReleases?.[
          indexPartial
        ]?.release_quantity
    ) {
      setQtyError('La cantidad no puede ser mayor a la del parcial.');
      return;
    }

    try {
      console.log(
        'data payload',
        workOrder?.flow?.[workOrder.flow.length - 1]?.partialReleases?.[
          indexPartial
        ]?.id,
        n
      );
      await cerrarParcialWorkOrderAuditory(
        workOrder?.flow?.[workOrder.flow.length - 1]?.partialReleases?.[
          indexPartial
        ]?.id,
        n
      );
      Alert.alert('Parcial cerrado', 'Se registró la entrega parcial.');
      setShowQtyModal(false);
      setQtyToClient('');
      setQtyError('');
      navigation.goBack();
    } catch (error) {
      console.error('Error al cerrar el parcial:', error);
      Alert.alert(
        'Error',
        'No se pudo cerrar la parcialidad. Inténtalo nuevamente.'
      );
    }
  };

  const handleCancelQuantity = () => {
    setShowQtyModal(false);
    setQtyToClient('');
    setQtyError('');
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

  const fieldLabels: Record<string, string> = {
    buenas: 'Buenas',
    malas: 'Malas',
    excedente: 'Excedente',
    noprocess: 'Sin procesar',
  };

  const handleOpenBadQuantityModal = () => {
    const initialValues: { [key: string]: string } = {};
    areas.forEach((area) => {
      const areaKey = area.name.toLowerCase().replace(/\s/g, '');
      initialValues[`${areaKey}_bad`] = area.malas?.toString() || '0';
      if (area.id >= 6)
        initialValues[`${areaKey}_material`] =
          area.defectuoso?.toString() || '0';
    });
    setAreaBadQuantities(initialValues);
    setShowBadQuantity(true);
  };

  const renderEditableNumber = (value: any, onChange: (t: string) => void) => (
    <TextInput
      keyboardType="numeric"
      value={String(value ?? 0)}
      onChangeText={onChange}
      placeholderTextColor="#9CA3AF"
      style={[
        styles.input,
        {
          height: 40,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          borderRadius: 9,
          paddingHorizontal: 8,
        },
      ]}
    />
  );

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

  const handleSaveChanges = async (updatedAreas: AreaData[]) => {
    const effectiveAreas = updatedAreas ?? areas;
    const payload = {
      areas: effectiveAreas
        .filter((area) => area.status === 'Completado')
        .map((updated) => {
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
          const normalizedName = updated.name.toLowerCase().replace(/\s/g, '');
          const block = blockMap[normalizedName] || 'otros';

          const blockId = (updated.response as any)?.[block]?.id;
          const formId = (updated.response as any)?.[block]?.form_auditory_id;
          const cqmId = (updated.response as any)?.[block]?.form_answer_id;

          let data: Record<string, number> = {
            good_quantity: updated.buenas,
            bad_quantity: updated.malas,
            excess_quantity: updated.excedente,
            noprocess_quantity: updated.noprocess,
            material_quantity: updated.defectuoso,
          };
          let sample_data: Record<string, number> = {
            sample_quantity: updated.cqm,
            sample_auditory: updated.muestras,
          };

          if (block === 'prepress') {
            data = { plates: updated.buenas };
          }
          if (
            ['impression', 'serigrafia', 'laminacion', 'empalme'].includes(
              block
            )
          ) {
            data = {
              release_quantity: updated.buenas,
              bad_quantity: updated.malas,
              excess_quantity: updated.excedente,
            };
            sample_data = { sample_quantity: updated.cqm };
          }

          return {
            areaId: updated.id,
            block,
            blockId,
            formId,
            cqmId,
            data,
            sample_data,
          };
        }),
    };

    console.log('Payload a enviar:', payload);

    try {
      await updateWorkOrderAreas(workOrder.ot_id, payload);
      Alert.alert('Éxito', 'Cambios guardados correctamente');
      fetchAndSetData(String(id));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Error al guardar los cambios');
    }
  };

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
          <TouchableOpacity onPress={handleOpenBadQuantityModal}>
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
                {getSumaMalasHasta(area.id)}
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
                  onPress={() => downloadFile(file.file_path)} // ver función abajo
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
      </View>

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
                  cells.push(
                    <Text
                      key={`area-${area.id}-usuario-rem`}
                      style={[styles.cellUser, { fontWeight: '600' }]}
                    >
                      {lastUser}
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
                const reviewers = getPerPartialAuditors(area);
                return reviewers.map((name, i) => (
                  <Text
                    key={`cell-area-${area.id}-partial-${i}-auditor`}
                    style={styles.cellUser}
                  >
                    {name || '-'}
                  </Text>
                ));
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
            {Array.from({ length: totalCols }).map((_, i) => (
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
                  const rem = getRemainder(area);
                  if (rem > 0) {
                    let remValue = 0;
                    switch (field) {
                      case 'buenas':
                        remValue = getRemainderByField(area, 'buenas');
                        break;
                      case 'excedente':
                        remValue = getRemainderByField(area, 'excedente');
                        break;
                      case 'noprocess':
                        remValue = getRemainderByField(area, 'noprocess');
                        break;
                      case 'malas':
                        remValue = getRemainderByField(area, 'malas');
                        break;
                      default:
                        remValue = 0;
                    }
                    cells.push(
                      <Text
                        key={`prod-${area.id}-${field}-rem`}
                        style={[styles.cellUser, { fontWeight: '600' }]}
                      >
                        {remValue}
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
            {Array.from({ length: totalCols }).map((_, i) => (
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
                  // ✅ AHORA llenamos cada parcial y (si existe) REM con datos reales
                  const vals =
                    field === 'cqm'
                      ? getPerPartialCqm(area) // ✅ sin fallback para Rem
                      : getPerPartialValues(
                          area,
                          field as 'defectuoso' | 'muestras'
                        );
                  return vals.map((v, i) => (
                    <Text
                      key={`cell-area-${area.id}-parcial-${i}-${field}`}
                      style={styles.cellUser}
                    >
                      {v}
                    </Text>
                  ));
                }
                // Sin parciales → comportamiento anterior (una sola celda)
                const totalValue =
                  field === 'cqm'
                    ? getSingleCqm(area) // ✅ ahora toma el sample_quantity del último answer
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

      {workOrder?.status !== 'Cerrado' && (
        <>
          <TouchableOpacity
            style={styles.buttonSave}
            onPress={() => handleSaveChanges(areas)}
          >
            <Text style={styles.buttonText}>Guardar Cambios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (lastStatus === 'parcial') {
                setShowQtyModal(true);
              } else {
                setShowConfirm(true);
              }
            }}
          >
            <Text style={styles.buttonText}>Cerrar Orden de Trabajo</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              ¿Deseas cerrar esta Orden de Trabajo?
            </Text>

            {needsEvidence ? (
              <View style={fileStyles.uploadWrapper}>
                <Text style={fileStyles.uploadLabel}>
                  Subir evidencia de destrucción de piezas malas (imagen o PDF){' '}
                  <Text style={fileStyles.required}>(Requerido)</Text>
                </Text>

                <View style={fileStyles.uploadRow}>
                  <TouchableOpacity
                    onPress={pickEvidence}
                    style={fileStyles.uploadButton}
                  >
                    <Text style={fileStyles.uploadButtonText}>
                      {evidenceFile ? 'Cambiar archivo' : 'Seleccionar archivo'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {evidenceFile ? (
                  <Text style={fileStyles.fileMeta}>{evidenceFile.name}</Text>
                ) : (
                  <Text style={fileStyles.errorText}>
                    La evidencia es obligatoria.
                  </Text>
                )}
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowConfirm(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCloseOrder}
                disabled={needsEvidence && !evidenceFile}
                style={[
                  styles.confirmButton,
                  needsEvidence &&
                    !evidenceFile &&
                    fileStyles.confirmButtonDisabled,
                ]}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showQtyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Esta OT está en estado parcial
            </Text>
            <Text style={[styles.modalText, { marginBottom: 12 }]}>
              Ingresa la{' '}
              <Text style={{ fontWeight: '700' }}>
                cantidad a enviar al cliente
              </Text>
              :
            </Text>
            <TextInput
              value={qtyToClient}
              onChangeText={(text) => {
                setQtyToClient(text);
                if (qtyError) setQtyError('');
              }}
              keyboardType="numeric"
              placeholder="Ej: 1000"
              style={styles.modalInput}
            />
            {qtyError ? <Text style={styles.errorText}>{qtyError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleCancelQuantity}
                style={styles.cancelButton}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmQuantity}
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

export default CerrarOrdenDeTrabajoAuxScreen;

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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#111827',
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
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

  // ⬇️ NUEVOS
  uploadWrapper: {
    marginTop: 8,
    gap: 8,
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  required: {
    color: '#DC2626',
    fontWeight: '700',
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fileMeta: {
    marginTop: 6,
    fontSize: 13,
    color: '#374151',
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: '#DC2626',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  // ⬆️ NUEVOS

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
