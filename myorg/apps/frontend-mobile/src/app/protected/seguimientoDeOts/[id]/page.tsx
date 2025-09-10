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
} from '../../../../api/seguimientoDeOts';
import { TextInput } from 'react-native-paper';
import InfoCard from '../../../../components/SeguimientoDeOts/InfoCard';
import InconformitiesHistory from '../../../../components/SeguimientoDeOts/InconformitiesHistory';
import { InconformityData } from '../../../../components/SeguimientoDeOts/InconformitiesHistory';
import ProgressBarAreas from '../../../../components/SeguimientoDeOts/ProgressBarAreas';
import BadQuantityModal from '../../../../components/SeguimientoDeOts/BadQuantityModal';
import { VistosBuenosHistory } from '../../../../components/SeguimientoDeOts/VistosBuenosHistory';
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
} from '../../../../components/SeguimientoDeOts/util/quality';

type WorkOrderDetailRouteProp = RouteProp<
  InternalStackParamList,
  'WorkOrderDetailScreen'
>;

export type AreaData = {
  id: number;
  name: string;
  status: string;
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
    noprocess_quantity: number;
    user_id: number | null; // 👈 puede venir null
    validated: boolean;
    user?: { username: string } | null; // 👈 opcional
    created_at: string;
  }>;
};

// ---------- helpers / constantes (compartidos con web) ----------
type NumericField =
  | 'buenas'
  | 'malas'
  | 'excedente'
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

const getAreaReleaseTotal = (area: AreaData) => {
  const key = getAreaKey(area);
  const block: any = key ? (area.response as any)?.[key] : null;
  if (!block) return 0;
  return block.release_quantity ?? block.good_quantity ?? block.plates ?? 0;
};
const getSumParciales = (area: AreaData) =>
  (area.partials ?? []).reduce((acc, p) => acc + (p?.quantity ?? 0), 0);

const getRemainder = (area: AreaData) =>
  Math.max(getAreaReleaseTotal(area) - getSumParciales(area), 0);

function getPerPartialValues(
  area: AreaData,
  field: 'cqm' | 'muestras' | 'defectuoso'
) {
  const parc = area.parciales || 0;
  const hasRem = getRemainder(area) > 0;
  const cols = parc + (hasRem ? 1 : 0);

  const answersSorted = [...(area.answers ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const defaultVal = 0;
  const values: Array<number | string> = Array(cols).fill(defaultVal);

  for (let i = 0; i < parc; i++) {
    const ans = answersSorted[i];
    if (!ans) continue;
    if (field === 'cqm') values[i] = ans.sample_quantity ?? 0;
    else if (field === 'muestras')
      values[i] = (ans as any)?.sample_auditory ?? 0;
    else if (field === 'defectuoso') values[i] = 0;
  }

  if (hasRem) {
    const block = (area.response as any)?.[getAreaKey(area)];
    const remIndex = cols - 1;
    const remAns =
      answersSorted[parc] ?? answersSorted[answersSorted.length - 1];

    if (field === 'cqm') values[remIndex] = remAns?.sample_quantity ?? 0;
    else if (field === 'muestras')
      values[remIndex] = (remAns as any)?.sample_auditory ?? '—';
    else if (field === 'defectuoso')
      values[remIndex] = block?.material_quantity ?? block?.bad_quantity ?? 0;
  }
  return values;
}

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
) => {
  return (
    p?.user?.username ??
    (p?.user_id != null ? operatorByIdMap.get(p.user_id) : undefined) ??
    area.usuario ??
    'No definido'
  );
};

// -------- getAreaData (AHORA ES FUNCIÓN DECLARADA Y ARRIBA DE loadData) -----
const getAreaData = (
  areaId: number,
  areaResponse: any,
  partialReleases: any[] = [],
  flowUser: any = null,
  index: number = -1
) => {
  const parciales = partialReleases.length;
  const parcialesValidados = partialReleases.filter(
    (p) => p?.validated
  ).length;

  const sumFromPartials = () => {
    return partialReleases.reduce(
      (acc: any, curr: any) => {
        acc.buenas += curr.quantity || 0;
        acc.malas += curr.bad_quantity || 0;
        acc.excedente += curr.excess_quantity || 0;
        acc.noprocess += curr.noprocess_quantity || 0;
        return acc;
      },
      { buenas: 0, malas: 0, excedente: 0, noprocess: 0 }
    );
  };

  const getCommonData = (areaKey: string) => {
    const hasResponse = !!areaResponse?.[areaKey];
    const usuario = areaResponse?.user?.username || flowUser?.username || '';
    const auditor =
      areaResponse?.[areaKey]?.formAuditory?.user?.username || '';

    if (!hasResponse && parciales > 0) {
      const resumen = sumFromPartials();
      console.log('[PARCIAL DETECTADO]', areaKey, resumen);
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

const WorkOrderDetailScreen: React.FC = () => {
  const route = useRoute<WorkOrderDetailRouteProp>();
  const { id } = route.params;
  const navigation = useNavigation();

  const [workOrder, setWorkOrder] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [inconformities, setInconformities] = useState<InconformityData[]>([]);
  const [progressWidth, setProgressWidth] = useState(0);
  const [qualitySectionOpen, setQualitySectionOpen] = useState(false);
  const [inconformitySectionOpen, setInconformitySectionOpen] = useState(false);
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<{
    [key: string]: string;
  }>({});
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
        ['En proceso', 'Parcial' /*, 'Otro estado'*/].includes(area.status)
      );

    // sin parciales: solo si el área está "En proceso"
    return ['En proceso', 'Parcial' /*, 'Otro estado'*/].includes(area.status);
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
  const loadData = async () => {
    try {
      const data = await fetchWorkOrderById(id);
      const users = await fetchAllUsers();

      setOperatorUsers(users || []);
      setWorkOrder(data);

      // Historial de vistos buenos
      const historyData = (data?.flow ?? [])
        .filter((item: any) => item?.answers?.length > 0)
        .map((item: any) => {
          const areaName = item?.area?.name?.toLowerCase() || '';
          const mode = ['impresion'].includes(areaName) ? 'doble' : 'simple';
          return {
            areaName: item?.area?.name || 'Sin nombre',
            username: item?.user?.username || '',
            questions: item?.area?.formQuestions || [],
            formAnswers: (item?.answers || []).map((a: any) => ({
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
              prueba_over: a.prueba_over,
              prueba_cinta_magnetica: a.prueba_cinta_magnetica,
              prueba_centro: a.prueba_centro,
              sample_quantity: a.sample_quantity,
              testtype_cqm: a.testtype_cqm,
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
        });

      setVistosBuenosHistory(historyData ?? []);

      // Áreas (incluye parciales/remanente y answers como array)
      const areaData =
        data?.flow?.map((item: any, index: number) => ({
          id: item.area_id,
          name: item.area?.name || 'Sin nombre',
          status: item.status || 'Desconocido',
          response: item.areaResponse || {},
          answers: item.answers || [],
          flowId: item.id,
          assigned_user_id: item.assigned_user,
          ...getAreaData(
            item.area_id,
            item.areaResponse,
            item.partialReleases,
            item.user,
            index
          ),
        })) || [];
      setAreas(areaData);

      // Inconformidades
      const allInconformities =
        data?.flow?.flatMap((flowItem: any) => {
          const areaName = flowItem.area?.name || 'Área desconocida';

          const direct =
            flowItem?.areaResponse?.inconformities?.map((inc: any) => ({
              id: inc.id,
              comments: inc.comments,
              createdAt: inc.created_at,
              createdBy: inc.user?.username || 'Desconocido',
              area: areaName,
            })) || [];

          const partials =
            flowItem?.partialReleases?.flatMap(
              (release: any) =>
                release.inconformities?.map((inc: any) => ({
                  id: inc.id,
                  comments: inc.comments,
                  createdAt: inc.createdAt,
                  createdBy: inc.createdBy,
                  area: areaName,
                })) || []
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

          return [...direct, ...partials, ...audits];
        }) || [];
      setInconformities(allInconformities);

      // Progreso
      const completedCount = areaData.filter(
        (a: any) => a.status === 'Completado'
      ).length;
      const percentage = (completedCount / areaData.length) * 100;

      setTimeout(() => setProgressWidth(percentage), 100);
    } catch (err) {
      console.error('loadData error:', err);
      Alert.alert('Error', 'No se pudo cargar la orden de trabajo.');
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getSumaMalasHasta = (areaId: number): number => {
    return areas
      .filter((a) => a.id <= areaId)
      .reduce((sum, a) => sum + (a.malas || 0), 0);
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

  const areaColSpan = (area: AreaData) => {
    const base = Math.max(1, area.parciales || 0);
    const rem = area.parciales > 0 && getRemainder(area) > 0 ? 1 : 0;
    return area.parciales > 0 ? base + rem : 1;
  };
  const totalCols = areas.reduce(
    (sum, area) =>
      sum +
      (area.parciales > 0
        ? area.parciales + (getRemainder(area) > 0 ? 1 : 0)
        : 1),
    0
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
      await loadData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Error al guardar los cambios');
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

  // helpers de render
  const getPartialUserName = (
    p: AreaData['partials'][number] | null | undefined,
    area: AreaData
  ) =>
    p?.user?.username ??
    (p?.user_id != null ? operatorById.get(p.user_id) : undefined) ??
    area.usuario ??
    'No definido';

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

  const fieldLabels: Record<string, string> = {
    buenas: "Buenas",
    malas: "Malas",
    excedente: "Excedente",
    noprocess: "Sin procesar",
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
                        {area.name}
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
            {areas.map((area, index) => {
              const editable = canEditUser(area, null);
              const currentAssignedName =
                (area.assigned_user_id != null
                  ? operatorById.get(area.assigned_user_id)
                  : undefined) ??
                area.usuario ??
                'No definido';
              return (
                <View
                  key={`enc-${area.id}-${index}`}
                  style={[styles.cellUser, { flexDirection: 'row' }]}
                >
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
                    }}
                  >
                    <Text style={{ color: '#111827' }}>
                      {currentAssignedName}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Usuario */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Usuario</Text>
            {areas.flatMap((area, aIndex) => {
              const uniq = area.flowId ?? `${area.id}-${aIndex}`;

              if (area.partials?.length > 0) {
                const cells = area.partials.map((p, pIdx) => (
                  <Text
                    key={`usr-${uniq}-${p?.id ?? pIdx}`}
                    style={styles.cellUser}
                  >
                    {getPartialUserName(p, area)}
                  </Text>
                ));
                if (getRemainder(area) > 0) {
                  const lastP = getLastPartial(area);
                  cells.push(
                    <Text
                      key={`usr-${uniq}-rem`}
                      style={[styles.cellUser, { fontWeight: '600' }]}
                    >
                      {getPartialUserName(lastP, area)}
                    </Text>
                  );
                }
                return cells;
              }

              return (
                <Text key={`usr-${uniq}-single`} style={styles.cellUser}>
                  {(area.assigned_user_id != null
                    ? operatorById.get(area.assigned_user_id)
                    : undefined) ??
                    area.usuario ??
                    'No definido'}
                </Text>
              );
            })}
          </View>

          {/* Auditor */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Auditor</Text>
            {areas.map((area, index) => (
              <Text key={`${area.id}-auditor-${index}`} style={styles.cellUser}>
                {area.auditor}
              </Text>
            ))}
          </View>

          {/* Estado */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Estado</Text>
            {areas.map((area, index) => {
              const { backgroundColor, textColor } = getStatusStyleMobile(
                area.status
              );
              return (
                <View
                  key={`${area.id}-status-${index}`}
                  style={styles.cellUser}
                >
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
                </View>
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

          {(['buenas', 'malas', 'excedente', 'noprocess'] as NumericField[]).map((field) => (
            <View key={`row-${field}`} style={styles.row}>
              <Text style={styles.cellLabel}>
                {fieldLabels[field]}
              </Text>
              {areas.flatMap((area, aIndex) => {
                if (area.parciales > 0 && area.partials?.length) {
                  const cells = area.partials.map((p, pIndex) => {
                    const value =
                      field === 'buenas'
                        ? p.quantity
                        : field === 'malas'
                        ? p.bad_quantity ?? 0
                        : p.excess_quantity ?? 0;
                    return (
                      <Text
                        key={`prod-${area.id}-${field}-${p.id ?? pIndex}`}
                        style={styles.cellUser}
                      >
                        {value}
                      </Text>
                    );
                  });
                  const rem = getRemainder(area);
                  if (rem > 0) {
                    const remValue = field === 'buenas' ? rem : 0;
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
                {field === 'defectuoso'
                  ? 'Materia prima defectuosa'
                  : field.toUpperCase()}
              </Text>
              {areas.flatMap((area, idx) => {
                const uniq = area.flowId ?? `${area.id}-${idx}`;
                if (area.parciales > 0) {
                  const vals = getPerPartialValues(area, field);
                  return vals.map((v, i) => (
                    <Text
                      key={`qual-${uniq}-${field}-${i}`}
                      style={styles.cellUser}
                    >
                      {v}
                    </Text>
                  ));
                }
                return (
                  <View
                    key={`qual-${uniq}-${field}-single`}
                    style={styles.cellUser}
                  >
                    {renderCell(area, field as NumericField)}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Suma Total */}
          <View style={styles.row}>
            <Text style={styles.cellLabel}>SUMA TOTAL</Text>
            {areas.map((area, index) => (
              <Text key={`${area.id}-suma-${index}`} style={styles.cellUser}>
                {Number(area.buenas) +
                  Number(area.malas) +
                  Number(area.excedente) +
                  Number(area.cqm) +
                  Number(area.muestras)}
              </Text>
            ))}
          </View>

          {/* Buenas + Excedente */}
          <View style={[styles.row, { backgroundColor: '#d7e6d1' }]}>
            <Text style={styles.cellLabel}>BUENAS + EXCEDENTE</Text>
            {areas.map((area, index) => (
              <Text
                key={`${area.id}-buenas-excedente-${index}`}
                style={styles.cellUser}
              >
                {area.id >= 6 ? area.buenas + area.excedente : ''}
              </Text>
            ))}
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
            onPress={() => handleSaveChanges(areas)}
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
        onConfirm={(updatedAreas) => {
          setShowBadQuantity(false);
          handleSaveChanges(updatedAreas);
        }}
        onClose={() => setShowBadQuantity(false)}
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
