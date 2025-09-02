// myorg/apps/frontend-web/src/app/(protected)/seguimientoDeOts/[id]/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { getWorkOrderInconformidadById } from '@/api/inconformidades';
import { Card, CardContent } from '@/components/ui/card';
import { getFileByName } from '@/api/seguimientoDeOts';

import PreprensaComponent from '@/components/Inconformidades/PreprensaComponent';
import ImpresionComponent from '@/components/Inconformidades/ImpresionComponent';
import ImpresionComponentCQM from '@/components/Inconformidades/ImpresionComponentCQM';
import SerigrafiaComponent from '@/components/Inconformidades/SerigrafiaComponent';
import SerigrafiaComponentCQM from '@/components/Inconformidades/SerigrafiaComponentCQM';
import EmpalmeComponent from '@/components/Inconformidades/EmpalmeComponent';
import EmpalmeComponentCQM from '@/components/Inconformidades/EmpalmeComponentCQM';
import LaminacionComponent from '@/components/Inconformidades/LaminacionComponent';
import LaminacionComponentCQM from '@/components/Inconformidades/LaminacionComponentCQM';
import CorteComponent from '@/components/Inconformidades/CorteComponent';
import CorteComponentCQM from '@/components/Inconformidades/CorteComponentCQM';
import ColorEdgeComponent from '@/components/Inconformidades/ColorEdgeComponent';
import ColorEdgeComponentCQM from '@/components/Inconformidades/ColorEdgeComponentCQM';
import HotStampingComponent from '@/components/Inconformidades/HotStampingComponent';
import HotStampingComponentCQM from '@/components/Inconformidades/HotStampingComponentCQM';
import PersonalizacionComponent from '@/components/Inconformidades/PersonalizacionComponent';
import PersonalizacionComponentCQM from '@/components/Inconformidades/PersonalizacionComponentCQM';
import MillingChipComponent from '@/components/Inconformidades/MillingChipComponent';
import MillingChipComponentCQM from '@/components/Inconformidades/MillingChipComponentCQM';

interface Props {
  params: Promise<{ id: string }>;
}

type AreaData = {
  name: string;
  status: string;
  response: string;
  answers: any;
  buenas: number;
  malas: number;
  cqm: number;
  excedente: number;
  muestras: number;
};

export default function InconformidadesAuxPage({ params }: Props) {
  const { id } = use(params);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const cantidadHojasRaw = Number(workOrder?.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;

  useEffect(() => {
    async function fetchWorkOrder() {
      const data = await getWorkOrderInconformidadById(id);
      console.log('Orden:', data);
      setWorkOrder(data);
    }
    fetchWorkOrder();
  }, [id]);

  if (!workOrder) return <div>Cargando...</div>;
  const lastCompleted = [...workOrder.flow]
    .reverse()
    .find((item) => item.status === 'En inconformidad');
  console.log('Area previa', lastCompleted);

  const areaInconformidadCQM = [...workOrder.flow]
    .reverse()
    .find((item) => item.status === 'En inconformidad CQM');
  console.log('CQM previa', areaInconformidadCQM);

  // Mostrar la liberacion del producto por area
  const renderComponentByArea = () => {
    if (lastCompleted !== undefined) {
      switch (lastCompleted.area_id) {
        case 1:
          return <PreprensaComponent workOrder={lastCompleted} />;
        case 2:
          return <ImpresionComponent workOrder={lastCompleted} />;
        case 3:
          return <SerigrafiaComponent workOrder={lastCompleted} />;
        case 4:
          return <EmpalmeComponent workOrder={lastCompleted} />;
        case 5:
          return <LaminacionComponent workOrder={lastCompleted} />;
        case 6:
          return <CorteComponent workOrder={lastCompleted} />;
        case 7:
          return <ColorEdgeComponent workOrder={lastCompleted} />;
        case 8:
          return <HotStampingComponent workOrder={lastCompleted} />;
        case 9:
          return <MillingChipComponent workOrder={lastCompleted} />;
        case 10:
          return <PersonalizacionComponent workOrder={lastCompleted} />;
        default:
          return <div>Area no reconocida.</div>;
      }
    }
  };

  // Mostrar la liberacion del producto por area
  const renderComponentByAreaCQM = () => {
    switch (areaInconformidadCQM.area_id) {
      case 2:
        return <ImpresionComponentCQM workOrder={areaInconformidadCQM} />;
      case 3:
        return <SerigrafiaComponentCQM workOrder={areaInconformidadCQM} />;
      case 4:
        return <EmpalmeComponentCQM workOrder={areaInconformidadCQM} />;
      case 5:
        return <LaminacionComponentCQM workOrder={areaInconformidadCQM} />;
      case 6:
        return <CorteComponentCQM workOrder={areaInconformidadCQM} />;
      case 7:
        return <ColorEdgeComponentCQM workOrder={areaInconformidadCQM} />;
      case 8:
        return <HotStampingComponentCQM workOrder={areaInconformidadCQM} />;
      case 9:
        return <MillingChipComponentCQM workOrder={areaInconformidadCQM} />;
      case 10:
        return <PersonalizacionComponentCQM workOrder={areaInconformidadCQM} />;
      default:
        return <div>Area no reconocida.</div>;
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

  return (
    <>
      <Container>
        <Title>Información De La Inconformidad De La Orden de Trabajo</Title>

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

          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground text-black">
                Cantidad (Hojas Frente / Hojas Vuelta)
              </p>
              <p className="text-xl font-semibold text-black">
                {cantidadHojas}
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
                <div className=' flex gap-3 m-2'>
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
        <Section>
          <SectionTitle>Detalles de Producción</SectionTitle>
          {lastCompleted !== undefined
            ? renderComponentByArea()
            : renderComponentByAreaCQM()}
        </Section>
      </Container>
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

const Section = styled.section`
  margin-top: 3rem;
  max-width: 80%;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.palette.text.primary};
`;
