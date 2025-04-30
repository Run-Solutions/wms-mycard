// myorg/apps/frontend-web/src/app/(protected)/seguimientoDeOts/[id]/page.tsx
'use client'

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import SerigrafiaComponent from "@/components/Inconformidades/SerigrafiaComponent";
import EmpalmeComponent from "@/components/Inconformidades/EmpalmeComponent";
import CorteComponentCQM from "@/components/Inconformidades/CorteComponentCQM";
import CorteComponent from "@/components/Inconformidades/CorteComponent";
import HotStampingComponent from "@/components/Inconformidades/HotStampingComponent";
import HotStampingComponentCQM from "@/components/Inconformidades/HotStampingComponentCQM";
import PersonalizacionComponentCQM from "@/components/Inconformidades/PersonalizacionComponentCQM";
import PersonalizacionComponent from "@/components/Inconformidades/PersonalizacionComponent";
import PreprensaComponent from "@/components/Inconformidades/PreprensaComponent";
import ImpresionComponentCQM from "@/components/Inconformidades/ImpresionComponentCQM";
import ImpresionComponent from "@/components/Inconformidades/ImpresionComponent";
import SerigrafiaComponentCQM from "@/components/Inconformidades/SerigrafiaComponentCQM";
import EmpalmeComponentCQM from "@/components/Inconformidades/EmpalmeComponentCQM";
import LaminacionComponentCQM from "@/components/Inconformidades/LaminacionComponentCQM";
import LaminacionComponent from "@/components/Inconformidades/LaminacionComponent";

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
  const [workOrder, setWorkOrder] = useState<any>(null)
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false); 

  useEffect(() => {
    async function fetchWorkOrder() {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/work-orders/${id}`, {
        headers: {
        'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      console.log('Orden:', data)
      setWorkOrder(data)
    }
    fetchWorkOrder()
  }, [id]);

  if (!workOrder) return <div>Cargando...</div>
  const lastCompleted = [...workOrder.flow]
    .reverse()
    .find((item) => item.status === "En inconformidad");
  console.log('Area previa', lastCompleted);
  
  const areaInconformidadCQM = [...workOrder.flow]
    .reverse()
    .find((item) => item.status === "En inconformidad CQM");
  console.log('Area previa', areaInconformidadCQM);

  // Mostrar la liberacion del producto por area 
  const renderComponentByArea = () => {
    if(lastCompleted !== undefined){
      switch (lastCompleted.area_id) {
        case 1:
          return <PreprensaComponent workOrder={lastCompleted}/>
        case 2:
          return <ImpresionComponent workOrder={lastCompleted}/>
        case 3:
          return <SerigrafiaComponent workOrder={lastCompleted}/>
        case 4:
          return <EmpalmeComponent workOrder={lastCompleted}/>
        case 5:
          return <LaminacionComponent workOrder={lastCompleted}/>
        case 6:
          return <CorteComponent workOrder={lastCompleted}/>
        case 8:
          return <HotStampingComponent workOrder={lastCompleted}/>
        case 10:
          return <PersonalizacionComponent workOrder={lastCompleted}/>
        default: 
          return <div>Area no reconocida.</div>
        }
      }
    };
    
    // Mostrar la liberacion del producto por area 
    const renderComponentByAreaCQM = () => {
      switch (areaInconformidadCQM.area_id) {
        case 2:
          return <ImpresionComponentCQM workOrder={areaInconformidadCQM}/>
        case 3:
          return <SerigrafiaComponentCQM workOrder={areaInconformidadCQM}/>
        case 4:
          return <EmpalmeComponentCQM workOrder={areaInconformidadCQM}/>
        case 5:
          return <LaminacionComponentCQM workOrder={areaInconformidadCQM}/>
        case 6:
          return <CorteComponentCQM workOrder={areaInconformidadCQM}/>
        case 8:
          return <HotStampingComponentCQM workOrder={areaInconformidadCQM}/>
        case 10:
            return <PersonalizacionComponentCQM workOrder={areaInconformidadCQM}/>
        default: 
          return <div>Area no reconocida.</div>
    }
  };

  // Función para obtener los datos específicos de cada área
  const getAreaData = (areaId: number, areaResponse: any) => {
    switch(areaId) {
      case 1: // preprensa
        return {
          buenas: areaResponse?.prepress?.plates || 0,
          malas: areaResponse?.prepress?.bad_quantity || '',
          excedente: areaResponse?.prepress?.excess_quantity || '',
          cqm: '',
          muestras: '',
        };
        case 2: // impresión
          return {
            buenas: areaResponse?.impression?.release_quantity || 0,
            malas: areaResponse?.impression?.bad_quantity || '',
            excedente: areaResponse?.impression?.excess_quantity || '',
            cqm: areaResponse?.impression?.form_answer?.sample_quantity ?? '',
            muestras: '',
          };
        case 3: // serigrafía
          return {
            buenas: areaResponse?.serigrafia?.release_quantity || 0,
            malas: areaResponse?.serigrafia?.bad_quantity || '',
            excedente: areaResponse?.serigrafia?.excess_quantity || '',
            cqm: areaResponse?.serigrafia?.form_answer?.sample_quantity ?? '',
            muestras: '',
          };
          case 4: // empalme
          return {
            buenas: areaResponse?.empalme?.release_quantity || '',
            malas: areaResponse?.empalme?.bad_quantity || '',
            excedente: areaResponse?.empalme?.excess_quantity || '',
            cqm: areaResponse?.empalme?.form_answer?.sample_quantity ?? '',
            muestras: '',
          };
          case 5: // empalme
          return {
            buenas: areaResponse?.laminacion?.release_quantity || 0,
            malas: areaResponse?.laminacion?.bad_quantity || '',
            excedente: areaResponse?.laminacion?.excess_quantity || '',
            cqm: areaResponse?.laminacion?.form_answer?.sample_quantity ?? '',
            muestras: '',
          };
        case 6: // empalme
          return {
            buenas: areaResponse?.corte?.good_quantity || 0,
            malas: areaResponse?.corte?.bad_quantity || 0,
            excedente: areaResponse?.corte?.excess_quantity || 0,
            cqm: areaResponse?.corte?.form_answer?.sample_quantity ?? '',
            muestras: areaResponse?.corte?.formAuditory?.sample_auditory ?? ''
          };
          case 7: // empalme
          return {
            buenas: areaResponse?.colorEdge?.good_quantity || 0,
            malas: areaResponse?.colorEdge?.bad_quantity || 0,
            excedente: areaResponse?.colorEdge?.excess_quantity || 0,
            cqm: areaResponse?.colorEdge?.form_answer?.sample_quantity ?? '',
            muestras: areaResponse?.corte?.formAuditory?.sample_auditory ?? ''
          };
          case 8: // empalme
          return {
            buenas: areaResponse?.hotStamping?.good_quantity || 0,
            malas: areaResponse?.hotStamping?.bad_quantity || 0,
            excedente: areaResponse?.hotStamping?.excess_quantity || 0,
            cqm: areaResponse?.hotStamping?.form_answer?.sample_quantity ?? '',
            muestras: areaResponse?.hotStamping?.formAuditory?.sample_auditory ?? ''
          };
          case 9: // empalme
          return {
            buenas: areaResponse?.millingChip?.good_quantity || 0,
            malas: areaResponse?.millingChip?.bad_quantity || 0,
            excedente: areaResponse?.millingChip?.excess_quantity || 0,
            cqm: areaResponse?.millingChip?.form_answer?.sample_quantity ?? '',
            muestras: areaResponse?.millingChip?.formAuditory?.sample_auditory ?? ''
          };
          case 10: // empalme
          return {
            buenas: areaResponse?.personalizacion?.good_quantity || 0,
            malas: areaResponse?.personalizacion?.bad_quantity || 0,
            excedente: areaResponse?.personalizacion?.excess_quantity || 0,
            cqm: areaResponse?.personalizacion?.form_answer?.sample_quantity ?? '',
            muestras: areaResponse?.personalizacion?.formAuditory?.sample_auditory ?? ''
          };
        default:
          return {
            buenas: 0,
            malas: 0,
            excedente: 0,
            muestras: 0,
            cqm: 0
          };
      }
    };

    // Para obtener todas las areas del flujo
    const areas: AreaData[] = workOrder?.flow?.map((item: any) => {
        const areaData = getAreaData(item.area_id, item.areaResponse);
        return {
          id: item.area_id,
          name: item.area?.name || 'Sin nombre',
          status: item.status || 'Desconocido',
          response: item.areaResponse || {},
          answers: item.answers?.[0] || {},
          ...areaData
        };
    }) || [];

    const handleCloseOrder = async () => {
      const payload = {
        ot_id: workOrder?.ot_id,
      }
      console.log(payload);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('No hay token de autenticación');
          return;
        }
        const res = await fetch('http://localhost:3000/work-orders/cerrar-work-order', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
    
        const data = await res.json();
        if (!res.ok) {
          console.error('Error en el servidor:', data);
          return;
        }
        router.push('/finalizacion');
      } catch (error) {
        console.log('Error al enviar datos:', error);
      }
    }

    return (
        <>
        <Container>
        <Title>Información De La Inconformidad De La  Orden de Trabajo</Title>

        <DataWrapper>
          <InfoItem>
            <Label>Número de Orden: </Label>
            <Value>{workOrder?.ot_id}</Value>
          </InfoItem>
          <InfoItem>
            <Label>ID del Presupuesto: </Label>
            <Value>{workOrder?.mycard_id}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Cantidad: </Label>
            <Value>{workOrder?.quantity}</Value>
          </InfoItem>
        </DataWrapper>
        <InfoItem>
          <Label>Comentarios: </Label>
          <Value>{workOrder?.comments}</Value>
        </InfoItem>

        <Section>
        <SectionTitle>Detalles de Producción</SectionTitle>
        {lastCompleted !== undefined ? renderComponentByArea() : renderComponentByAreaCQM()}
      </Section>
      </Container>
    </>
    );

};

// =================== Styled Components ===================

const Container = styled.div`
  padding: 20px 20px 20px 50px;
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
  font-size: 2rem;
  color: ${({ theme }) => theme.palette.text.primary}
`;

const DataWrapper = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  background: white;
  padding: 1.25rem 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
  color: black;
  flex: 1;
`;

const Label = styled.span`
  font-weight: 600;
  color: black;
  margin-bottom: 0.25rem;
`;

const Value = styled.span`
  font-size: 1.125rem;
  color: #111827;
  color: black;
`;

const Section = styled.section`
  margin-top: 3rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.palette.text.primary};
`;

