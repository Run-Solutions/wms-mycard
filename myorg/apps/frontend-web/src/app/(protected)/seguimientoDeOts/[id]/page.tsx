// myorg/apps/frontend-web/src/app/(protected)/seguimientoDeOts/[id]/page.tsx
'use client';

import { use, useState, Fragment, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Card, CardContent } from '@/components/ui/card';
import ProgressBarAreas from '@/components/SeguimientoDeOts/ProgressBarAreas';
import InconformitiesHistory from '@/components/SeguimientoDeOts/InconformitiesHistory';
import BadQuantityModal from '@/components/SeguimientoDeOts/BadQuantityModal';
import {
  fetchWorkOrderById,
  fetchAllUsers,
  updateFlowAssignedUser,
  closeWorkOrder,
  updateWorkOrderAreas,
} from '@/api/seguimientoDeOts';
import { VistosBuenosHistory } from '@/components/SeguimientoDeOts/VistosBuenosHistory';
import { getFileByName } from '@/api/seguimientoDeOts';
import {
  getPerPartialReviewers,
  getLastAnswer,
  getSingleCqm,
  getReviewerNameFromAnswer,
  getPerPartialCqm,
} from '@/components/SeguimientoDeOts/util/quality';

type NumericField =
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

const getPerPartialValues = (
  area: AreaData,
  field: 'cqm' | 'muestras' | 'defectuoso'
) => {
  const parc = area.parciales || 0;
  const hasRem = getRemainder(area) > 0;
  const cols = parc + (hasRem ? 1 : 0);

  // Ordenamos por fecha ascendente para alinear P1->primera respuesta, etc.
  const answersSorted = [...(area.answers ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Valor por defecto
  const defaultVal = field === 'defectuoso' ? 0 : 0;
  const values: Array<number | string> = Array(cols).fill(defaultVal);

  // Relleno por parcial usando respuestas (si existen)
  for (let i = 0; i < parc; i++) {
    const ans = answersSorted[i];
    if (!ans) continue;

    if (field === 'cqm') {
      values[i] = ans.sample_quantity ?? 0;
    } else if (field === 'muestras') {
      // Nota: en tu payload de "answers" no hay 'sample_auditory'.
      // Si en el futuro lo envías, cámbialo aquí:
      values[i] = (ans.sample_auditory as any) ?? 0;
    } else if (field === 'defectuoso') {
      // Normalmente no viene por answer. Deja 0 por parcial.
      values[i] = 0;
    }
  }

  // Columna REM: usa la respuesta "extra" (answers[parc]) o la última disponible
  if (hasRem) {
    const block = (area.response as any)?.[getAreaKey(area)];
    const remIndex = cols - 1;

    if (field === 'cqm') {
      const remAns =
        answersSorted[parc] ?? answersSorted[answersSorted.length - 1];
      values[remIndex] = remAns?.sample_quantity ?? 0;
    } else if (field === 'muestras') {
      const remAns =
        answersSorted[parc] ?? answersSorted[answersSorted.length - 1];
      values[remIndex] = (remAns as any)?.sample_auditory ?? '—';
    } else if (field === 'defectuoso') {
      // Para defectuoso usamos el bloque del área (material_quantity o bad_quantity)
      values[remIndex] = block?.material_quantity ?? block?.bad_quantity ?? 0;
    }
  }

  return values;
};
// último parcial por fecha
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

export type InconformityData = {
  id: number;
  comments: string;
  createdAt: string;
  createdBy: string;
  area: string;
};

type OperatorUser = {
  id: number;
  username: string;
  areasOperator?: { id: number; name: string };
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function SeguimientoDeOtsAuxPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<{
    [key: string]: string;
  }>({});
  const [inconformities, setInconformities] = useState<InconformityData[]>([]);
  const [qualitySectionOpen, setQualitySectionOpen] = useState(false);
  const [inconformitySectionOpen, setInconformitySectionOpen] = useState(false);
  const toggleQualitySection = () => {
    setQualitySectionOpen(!qualitySectionOpen);
  };
  const toggleInconformitySection = () => {
    setInconformitySectionOpen(!inconformitySectionOpen);
  };
  const [progressWidth, setProgressWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [vistosBuenosHistory, setVistosBuenosHistory] = useState([]);
  const [operatorUsers, setOperatorUsers] = useState<OperatorUser[]>([]);

  const operatorOptionsByAreaId = useMemo(() => {
    const map = new Map<number, Array<{ id: number; username: string }>>();
    operatorUsers.forEach((u) => {
      const aId = u.areasOperator?.id;
      if (!aId) return;
      if (!map.has(aId)) map.set(aId, []);
      map.get(aId)!.push({ id: u.id, username: u.username });
    });
    // orden opcional
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

  // --- MODAL ASIGNACIÓN DE OPERADOR ---
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

  const confirmOperatorModal = async () => {
    if (!opModal.area || opModal.selectedUserId == null) return;
    if (!canEditUser(opModal.area, opModal.partial)) return; // 🔒 bloqueo extra
    await handleChangeUser(
      opModal.area,
      opModal.partial,
      opModal.selectedUserId
    );
    closeOperatorModal();
  };
  // Opciones filtradas para el modal (por área + búsqueda)
  const modalOptions = useMemo(() => {
    if (!opModal.areaId) return [];
    const base = getUserOptionsForArea(opModal.areaId);
    const q = opModal.search.trim().toLowerCase();
    return q ? base.filter((u) => u.username.toLowerCase().includes(q)) : base;
  }, [opModal.areaId, opModal.search, operatorOptionsByAreaId]);

  useEffect(() => {
    const alreadyReloaded = sessionStorage.getItem('alreadyReloaded');
    if (!alreadyReloaded) {
      sessionStorage.setItem('alreadyReloaded', 'true');
      window.location.reload();
    }
  }, []);
  console.log(vistosBuenosHistory);
  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        // Iniciamos el estado de carga
        setLoading(true);

        // Tu llamada original a la API
        const data = await fetchWorkOrderById(id);
        const users = await fetchAllUsers();
        setOperatorUsers(users || []);
        setWorkOrder(data);
        const historyData = data.flow
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
          });

        setVistosBuenosHistory(historyData);

        // Procesamiento de áreas
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

        // Procesamiento de inconformidades
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

        // Cálculo del progreso de áreas completadas
        const completedCount = areaData.filter(
          (a: any) => a.status === 'Completado'
        ).length;
        const percentage = (completedCount / areaData.length) * 100;
        setTimeout(() => setProgressWidth(percentage), 100);
      } finally {
        // Terminamos el estado de carga
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const areaColSpan = (area: AreaData) => {
    const base = Math.max(1, area.parciales || 0);
    const rem = area.parciales > 0 && getRemainder(area) > 0 ? 1 : 0;
    return area.parciales > 0 ? base + rem : 1;
  };
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

  // Helpers
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
      router.push('/seguimientoDeOts');
    } catch (error) {
      console.log('Error al enviar datos:', error);
    }
  };

  const renderCell = (area: AreaData, field: NumericField) => {
    // 1. Si la orden está cerrada, todo es lectura
    if (workOrder?.status === 'Cerrado') {
      return <span>{Number(area[field] ?? 0)}</span>;
    }

    // 2. Si el área no está en Completado, todo es lectura
    if (area.status !== 'Completado') {
      return <span>{Number(area[field] ?? 0)}</span>;
    }

    // 3. Preprensa: solo 'buenas' editable
    if (area.id === 1) {
      if (field === 'buenas') {
        return (
          <input
            type="number"
            value={Number(area[field] ?? 0)}
            min={0}
            onChange={(e) =>
              handleValueChange(area.id, field as NumericField, e.target.value)
            }
            style={{
              width: '80px',
              padding: '4px',
              textAlign: 'center',
            }}
          />
        );
      } else {
        return <span>{Number(area[field] ?? 0)}</span>;
      }
    }

    // 4. CQM solo editable de Impresión en adelante (id >=2)
    if (field === 'cqm') {
      if (area.id >= 2) {
        return (
          <input
            type="number"
            value={Number(area[field] ?? 0)}
            min={0}
            onChange={(e) =>
              handleValueChange(area.id, field as NumericField, e.target.value)
            }
            style={{
              width: '80px',
              padding: '4px',
              textAlign: 'center',
            }}
          />
        );
      } else {
        return <span>{Number(area[field] ?? 0)}</span>;
      }
    }

    // 5. Muestras solo editable de Corte en adelante (id >=6)
    if (field === 'muestras' || field === 'defectuoso') {
      if (area.id >= 6) {
        return (
          <input
            type="number"
            value={Number(area[field] ?? 0)}
            min={0}
            onChange={(e) =>
              handleValueChange(area.id, field as NumericField, e.target.value)
            }
            style={{
              width: '80px',
              padding: '4px',
              textAlign: 'center',
            }}
          />
        );
      } else {
        return <span>{Number(area[field] ?? 0)}</span>;
      }
    }
    if (field === 'malas') {
      if (area.id >= 6) {
        return (
          <input
            type="number"
            value={getSumaMalasHasta(area.id)}
            min={0}
            onClick={handleOpenBadQuantityModal}
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
      } else {
        return (
          <input
            type="number"
            value={area[field]}
            min={0}
            onChange={(e) =>
              handleValueChange(area.id, field as NumericField, e.target.value)
            }
            style={{
              width: '80px',
              padding: '4px',
              textAlign: 'center',
            }}
          />
        );
      }
    }

    // 6. El resto de campos (buenas, malas, noprocess) editables si el área está en Completado
    return (
      <input
        type="number"
        value={area[field]}
        min={0}
        onChange={(e) =>
          handleValueChange(area.id, field as NumericField, e.target.value)
        }
        style={{
          width: '80px',
          padding: '4px',
          textAlign: 'center',
        }}
      />
    );
  };

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
      if (area.id >= 6) {
        initialValues[`${areaKey}_material`] =
          area.defectuoso?.toString() || '0';
      }
    });

    setAreaBadQuantities(initialValues);
    setShowBadQuantity(true);
  };

  // Función para obtener los datos específicos de cada área
  // Ahora acepta partialReleases como argumento externo
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

  const handleSaveChanges = async (updatedAreas: AreaData[]) => {
    const payload = {
      areas: areas
        .filter((area) => area.status === 'Completado')
        .map((area) => {
          const updated = updatedAreas.find((a) => a.id === area.id) || area;

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
            data = {
              plates: updated.buenas,
            };
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
            sample_data = {
              sample_quantity: updated.cqm,
            };
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
      alert('Cambios guardados correctamente');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Error al guardar los cambios');
    }
  };

  const getStatusStyle = (status: string) => {
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
  };

  const filteredAreas = areas.filter(
    (area) =>
      area.status === 'Completado' && area.name.toLowerCase() !== 'preprensa'
  );

  // justo antes de tu return principal

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

  // sólo comprobamos workOrder, no areas
  if (!workOrder) {
    return (
      <Container>
        <Title>No se encontró la orden de trabajo.</Title>
      </Container>
    );
  }
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

  const downloadFile = async (filename: string) => {
    try {
      const arrayBuffer = await getFileByName(filename); // <- ya la tienes
      const mime = guessMimeFromName(filename);
      const blob = new Blob([arrayBuffer], { type: mime });
      const url = window.URL.createObjectURL(blob);

      // abre en nueva pestaña (sirve para PDF e imágenes)
      window.open(url, '_blank');

      // liberar URL luego
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error al abrir el archivo:', error);
    }
  };

  // pasar al return normal sin más guards globales
  const totalCols = areas.reduce((sum, area) => {
    return sum + (area.parciales > 0 ? area.parciales : 1);
  }, 0);

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

  const fieldLabels: Record<string, string> = {
    buenas: "Buenas",
    malas: "Malas",
    excedente: "Excedente",
    noprocess: "Sin procesar",
  };
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
                        {area.name}
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
                              <th
                                key={`${area.id}-${index}-sub-rem`}
                                className="p-2 text-center font-normal text-[0.7rem] text-gray-500"
                              >
                                Rem
                              </th>
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
                          colSpan={areaColSpan(area)} // 👈 cubre todos los parciales de esa área
                        >
                          {editable ? (
                            <button
                              className="border rounded px-2 py-1 hover:bg-gray-50"
                              onClick={() => openOperatorModal(area, null)} // 👈 SOLO reasigna el flow
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
                            <td
                              key={`area-${area.id}-usuario-rem`}
                              className="text-center font-medium"
                              title="Remanente"
                            >
                              {lastUser}
                            </td>
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
                        return reviewers.map((name, i) => (
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
                                  ? 'bg-yellow-100 text-yellow-800' // badge “Calidad”
                                  : '' // badge vacío
                              }`}
                            >
                              {name || '—'}
                            </span>
                          </td>
                        ));
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
                    {areas.map((area, index) => (
                      <td
                        key={`${area.id}-auditor-${index}`}
                        className="text-center"
                        colSpan={areaColSpan(area)} // 👈 clave
                      >
                        {area.auditor}
                      </td>
                    ))}
                  </tr>

                  {/* Estado con Badge visual */}
                  <tr>
                    <td className="p-3 font-semibold">Estado</td>
                    {areas.map((area, index) => (
                      <td
                        key={`${area.id}-status-${index}`}
                        className="text-center"
                        colSpan={areaColSpan(area)} // 👈 clave
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
                      colSpan={1 + totalCols} // 1 extra por la primera columna "Dato"
                      className="bg-gray-50 px-3 py-2 font-bold text-gray-500"
                    >
                      📥 Producción
                    </td>
                  </tr>
                  {['buenas', 'malas', 'excedente', 'noprocess'].map(
                    (field) => (
                      <tr key={field}>
                        <td className="p-3 capitalize font-semibold">
                        {fieldLabels[field]}
                        </td>
                        {/* Por cada área, creamos tantas celdas como parciales (o 1 si no hay) */}
                        {areas.flatMap((area, aIndex) => {
                          // Si hay parciales, pintamos cada parcial como una columna
                          if (area.parciales > 0 && area.partials?.length) {
                            const cells = area.partials.map((p, pIndex) => {
                              const value =
                                field === 'buenas'
                                  ? p.quantity
                                  : field === 'malas'
                                  ? p.bad_quantity ?? 0
                                  : field === 'excedente' ? p.excess_quantity ?? 0
                                  : p.noprocess_quantity ?? '';
                              return (
                                <td
                                  key={`area-${area.id}-parcial-${p.id}-${field}-${pIndex}`}
                                  className="text-center"
                                >
                                  {value}
                                </td>
                              );
                            });

                            // Columna de REMANENTE solo si hay resto > 0
                            const rem = getRemainder(area);
                            if (rem > 0) {
                              const remValue = field === 'buenas' ? rem : 0; // por defecto 0 para malas/excedente
                              cells.push(
                                <td
                                  key={`area-${area.id}-parcial-rem-${field}`}
                                  className="text-center font-semibold"
                                  title="Remanente"
                                >
                                  {remValue}
                                </td>
                              );
                            }
                            return cells;
                          }

                          // Si NO hay parciales, dejamos una sola celda (Total del área)
                          const totalValue =
                            renderCell(area, field as NumericField) || 0;
                          return (
                            <td
                              key={`area-${area.id}-no-parciales-${field}-${aIndex}`}
                              className="text-center"
                            >
                              {totalValue}
                            </td>
                          );
                        })}
                      </tr>
                    )
                  )}

                  {/* Control de calidad */}
                  <tr>
                    <td
                      colSpan={1 + totalCols} // 1 extra por la primera columna "Dato"
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
                          // ✅ AHORA llenamos cada parcial y (si existe) REM con datos reales
                          const vals =
                            field === 'cqm'
                              ? getPerPartialCqm(area) // ✅ sin fallback para Rem
                              : getPerPartialValues(
                                  area,
                                  field as 'defectuoso' | 'muestras'
                                );
                          return vals.map((v, i) => (
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
                        }

                        // Sin parciales → comportamiento anterior (una sola celda)
                        const totalValue =
                          field === 'cqm'
                            ? getSingleCqm(area) // ✅ ahora toma el sample_quantity del último answer
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
                        colSpan={areaColSpan(area)} // 👈 clave
                      >
                        {area.buenas +
                          area.malas +
                          area.excedente +
                          area.cqm +
                          area.muestras}
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
              <SaveButton onClick={() => handleSaveChanges(areas)}>
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
          areas={filteredAreas}
          areaBadQuantities={areaBadQuantities}
          setAreaBadQuantities={setAreaBadQuantities}
          onConfirm={(updatedAreas) => {
            setShowBadQuantity(false);
            // Aquí puedes guardar cambios también
            console.log('updatedAreas:', updatedAreas);
            handleSaveChanges(updatedAreas);
          }}
          onClose={() => setShowBadQuantity(false)}
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
