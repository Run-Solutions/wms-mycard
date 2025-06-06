// myorg/apps/frontend-web/src/app/(protected)/seguimientoDeOts/[id]/page.tsx
'use client'

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import PreprensaComponent from "@/components/Inconformidades/PreprensaComponent";
import ImpresionComponent from "@/components/Inconformidades/ImpresionComponent";
import ImpresionComponentCQM from "@/components/Inconformidades/ImpresionComponentCQM";
import SerigrafiaComponent from "@/components/Inconformidades/SerigrafiaComponent";
import SerigrafiaComponentCQM from "@/components/Inconformidades/SerigrafiaComponentCQM";
import EmpalmeComponent from "@/components/Inconformidades/EmpalmeComponent";
import EmpalmeComponentCQM from "@/components/Inconformidades/EmpalmeComponentCQM";
import LaminacionComponent from "@/components/Inconformidades/LaminacionComponent";
import LaminacionComponentCQM from "@/components/Inconformidades/LaminacionComponentCQM";
import CorteComponent from "@/components/Inconformidades/CorteComponent";
import CorteComponentCQM from "@/components/Inconformidades/CorteComponentCQM";
import ColorEdgeComponent from "@/components/Inconformidades/ColorEdgeComponent";
import ColorEdgeComponentCQM from "@/components/Inconformidades/ColorEdgeComponentCQM";
import HotStampingComponent from "@/components/Inconformidades/HotStampingComponent";
import HotStampingComponentCQM from "@/components/Inconformidades/HotStampingComponentCQM";
import PersonalizacionComponent from "@/components/Inconformidades/PersonalizacionComponent";
import PersonalizacionComponentCQM from "@/components/Inconformidades/PersonalizacionComponentCQM";
import MillingChipComponent from "@/components/Inconformidades/MillingChipComponent";
import MillingChipComponentCQM from "@/components/Inconformidades/MillingChipComponentCQM";

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
  console.log('CQM previa', areaInconformidadCQM);

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
        case 7:
          return <ColorEdgeComponent workOrder={lastCompleted}/>
        case 8:
          return <HotStampingComponent workOrder={lastCompleted}/>
        case 9:
          return <MillingChipComponent workOrder={lastCompleted}/>
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
        case 7:
          return <ColorEdgeComponentCQM workOrder={areaInconformidadCQM}/>
        case 8:
          return <HotStampingComponentCQM workOrder={areaInconformidadCQM}/>
        case 9:
          return <MillingChipComponentCQM workOrder={areaInconformidadCQM}/>
        case 10:
            return <PersonalizacionComponentCQM workOrder={areaInconformidadCQM}/>
        default: 
          return <div>Area no reconocida.</div>
    }
  };

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

