// myorg/apps/frontend-web/src/app/(protected)/seguimientoDeOts/[id]/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Card, CardContent } from '@/components/ui/card';
import ProgressBarAreas from '@/components/SeguimientoDeOts/ProgressBarAreas';
import InconformitiesHistory from '@/components/SeguimientoDeOts/InconformitiesHistory';
import BadQuantityModal from '@/components/SeguimientoDeOts/BadQuantityModal';
import {
  fetchWorkOrderById,
  closeWorkOrder,
  updateWorkOrderAreas,
} from '@/api/seguimientoDeOts';


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
  answers: any;
  usuario: string;
  auditor: string;
  buenas: number;
  malas: number;
  cqm: number;
  excedente: number;
  defectuoso: number;
  muestras: number;
};

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
  const toggleQualitySection = () => {
    setQualitySectionOpen(!qualitySectionOpen);
  };
  const [progressWidth, setProgressWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const alreadyReloaded = sessionStorage.getItem('alreadyReloaded');
    if (!alreadyReloaded) {
      sessionStorage.setItem('alreadyReloaded', 'true');
      window.location.reload();
    }
  }, []);
  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        // Iniciamos el estado de carga
        setLoading(true);
  
        // Tu llamada original a la API
        const data = await fetchWorkOrderById(id);
        setWorkOrder(data);
  
        // Procesamiento de áreas
        const areaData =
          data?.flow?.map((item: any, index: number) => ({
            id: item.area_id,
            name: item.area?.name || 'Sin nombre',
            status: item.status || 'Desconocido',
            response: item.areaResponse || {},
            answers: item.answers?.[0] || {},
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
              flowItem?.partialReleases?.flatMap((release: any) =>
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
        const completedCount = areaData.filter((a: any) => a.status === 'Completado').length;
        const percentage = (completedCount / areaData.length) * 100;
        setTimeout(() => setProgressWidth(percentage), 100);
  
      } finally {
        // Terminamos el estado de carga
        setLoading(false);
      }
    };
  
    loadData();

  }, [id]);

  const handleCloseOrder = async () => {
    try {
      await closeWorkOrder(workOrder?.ot_id);
      router.push('/seguimientoDeOts');
    } catch (error) {
      console.log('Error al enviar datos:', error);
    }
  };

  const renderCell = (area: AreaData, field: keyof AreaData) => {
    // 1. Si la orden está cerrada, todo es lectura
    if (workOrder?.status === 'Cerrado') {
      return <span>{area[field]}</span>;
    }

    // 2. Si el área no está en Completado, todo es lectura
    if (area.status !== 'Completado') {
      return <span>{area[field]}</span>;
    }

    // 3. Preprensa: solo 'buenas' editable
    if (area.id === 1) {
      if (field === 'buenas') {
        return (
          <input
            type="number"
            value={area[field]}
            min={0}
            onChange={(e) => handleValueChange(area.id, field, e.target.value)}
            style={{
              width: '80px',
              padding: '4px',
              textAlign: 'center',
            }}
          />
        );
      } else {
        return <span>{area[field]}</span>;
      }
    }

    // 4. CQM solo editable de Impresión en adelante (id >=2)
    if (field === 'cqm') {
      if (area.id >= 2) {
        return (
          <input
            type="number"
            value={area[field]}
            min={0}
            onChange={(e) => handleValueChange(area.id, field, e.target.value)}
            style={{
              width: '80px',
              padding: '4px',
              textAlign: 'center',
            }}
          />
        );
      } else {
        return <span>{area[field]}</span>;
      }
    }

    // 5. Muestras solo editable de Corte en adelante (id >=6)
    if (field === 'muestras' || field === 'defectuoso') {
      if (area.id >= 6) {
        return (
          <input
            type="number"
            value={area[field]}
            min={0}
            onChange={(e) => handleValueChange(area.id, field, e.target.value)}
            style={{
              width: '80px',
              padding: '4px',
              textAlign: 'center',
            }}
          />
        );
      } else {
        return <span>{area[field]}</span>;
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
            onChange={(e) => handleValueChange(area.id, field, e.target.value)}
            style={{
              width: '80px',
              padding: '4px',
              textAlign: 'center',
            }}
          />
        );
      }
    }

    // 6. El resto de campos (buenas, malas, excedente) editables si el área está en Completado
    return (
      <input
        type="number"
        value={area[field]}
        min={0}
        onChange={(e) => handleValueChange(area.id, field, e.target.value)}
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
    const sumFromPartials = () => {
      return partialReleases.reduce(
        (acc: any, curr: any) => {
          acc.buenas += curr.quantity || 0;
          acc.malas += curr.bad_quantity || 0;
          acc.excedente += curr.excess_quantity || 0;
          return acc;
        },
        { buenas: 0, malas: 0, excedente: 0 }
      );
    };

    const getCommonData = (areaKey: string) => {
      const hasResponse = !!areaResponse?.[areaKey];
      const usuario = areaResponse?.user?.username || flowUser?.username || '';
      const auditor =
        areaResponse?.[areaKey]?.formAuditory?.user?.username || '';

      if (!hasResponse && partialReleases.length > 0) {
        const resumen = sumFromPartials();
        console.log('[PARCIAL DETECTADO]', areaKey, resumen);
        return { ...resumen, cqm: 0, muestras: 0, usuario, auditor: '' };
      }

      return {
        buenas:
          areaResponse?.[areaKey]?.good_quantity ||
          areaResponse?.[areaKey]?.release_quantity ||
          areaResponse?.[areaKey]?.plates ||
          0,
        malas: areaResponse?.[areaKey]?.bad_quantity || 0,
        excedente: areaResponse?.[areaKey]?.excess_quantity || 0,
        defectuoso: areaResponse?.[areaKey]?.material_quantity || 0,
        cqm: areaResponse?.[areaKey]?.form_answer?.sample_quantity ?? 0,
        muestras: areaResponse?.[areaKey]?.formAuditory?.sample_auditory ?? 0,
        usuario,
        auditor,
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
          defectuoso: 0,
          cqm: 0,
          muestras: 0,
          usuario: '',
          auditor: '',
        };
    }
  };

  const cantidadHojasRaw = Number(workOrder?.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;
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

  const totalGeneral =
    totalUltimaBuenas +
    totalUltimaExcedente +
    totalMalas +
    totalDefectuoso +
    totalCqm +
    totalMuestras;

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

// pasar al return normal sin más guards globales

  return (
    <>
      <Container>
        <Title>Información Complementaria Orden de Trabajo</Title>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Número de Orden</p>
              <p className="text-xl font-semibold">{workOrder?.ot_id}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Presupuesto</p>
              <p className="text-xl font-semibold">{workOrder?.mycard_id}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cantidad (Tarjetas)
              </p>
              <p className="text-xl font-semibold">{workOrder?.quantity}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Cantidad (Kits)</p>
              <p className="text-xl font-semibold">{cantidadHojas}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Fecha de Creación</p>
              <p className="text-xl font-semibold">
                {new Date(workOrder?.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Comentarios</p>
              <p className="text-xl font-semibold">{workOrder?.comments}</p>
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
                    <th className="text-left p-3">Dato</th>
                    {areas.map((area, index) => (
                      <th
                        key={`${area.id}-${index}`}
                        className="p-3 text-center font-semibold"
                      >
                        {area.name}
                        <div className="text-[0.65rem] text-gray-400 mt-1">
                          {area.status}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-gray-800">
                  {/* Usuario */}
                  <tr>
                    <td className="p-3 font-semibold">Usuario</td>
                    {areas.map((area, index) => (
                      <td
                        key={`${area.id}-usuario-${index}`}
                        className="text-center"
                      >
                        {area.usuario}
                      </td>
                    ))}
                  </tr>

                  {/* Auditor */}
                  <tr>
                    <td className="p-3 font-semibold">Auditor</td>
                    {areas.map((area, index) => (
                      <td
                        key={`${area.id}-auditor-${index}`}
                        className="text-center"
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
                      colSpan={areas.length + 1}
                      className="bg-gray-50 px-3 py-2 font-bold text-gray-500"
                    >
                      📥 Producción
                    </td>
                  </tr>
                  {['buenas', 'malas', 'excedente'].map((field) => (
                    <tr key={field}>
                      <td className="p-3 capitalize font-semibold">{field}</td>
                      {areas.map((area, index) => (
                        <td
                          key={`${area.id}-${field}-${index}`}
                          className="text-center"
                        >
                          {renderCell(area, field as keyof AreaData)}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Control de calidad */}
                  <tr>
                    <td
                      colSpan={areas.length + 1}
                      className="bg-gray-50 px-3 py-2 font-bold text-gray-500"
                    >
                      🔍 Calidad
                    </td>
                  </tr>
                  {['defectuoso', 'cqm', 'muestras'].map((field, rowIndex) => (
                    <tr key={field}>
                      <td className="p-3 capitalize font-semibold">
                        {field === 'defectuoso'
                          ? 'materia prima defectuosa'
                          : field}
                      </td>
                      {areas.map((area, colIndex) => (
                        <td
                          key={`cell-${rowIndex}-${colIndex}-${field}-${area.name}-${area.id}`}
                          className="text-center"
                        >
                          {renderCell(area, field as keyof AreaData)}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* SUMA TOTAL */}
                  <tr className="bg-slate-100 font-semibold text-sm">
                    <td className="p-3">📊 Suma Total</td>
                    {areas.map((area, index) => (
                      <td
                        key={`${area.id}-total-${index}`}
                        className="text-center"
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
          <InconformitiesHistory
            inconformities={inconformities}
            qualitySectionOpen={qualitySectionOpen}
            toggleQualitySection={toggleQualitySection}
          />

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

const InputBad = styled.input`
  width: 100%;
  color: black;
  padding: 0.75rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  outline: none;
  font-size: 1rem;
  transition: border 0.3s;

  &:focus {
    border-color: #0038a8;
  }
`;
