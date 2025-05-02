// myorg/apps/frontend-web/src/app/(protected)/configuracionVistosBuenos/[id]/page.tsx
'use client'

import { use, useEffect, useState } from "react";
import styled from "styled-components";
import ImpresionComponent from "@/components/ConfiguracionVistosBuenos/ImpresionComponent";
import SerigrafiaComponent from "@/components/ConfiguracionVistosBuenos/SerigrafiaComponent";
import EmpalmeComponent from "@/components/ConfiguracionVistosBuenos/EmpalmeComponent";
import LaminacionComponent from "@/components/ConfiguracionVistosBuenos/LaminacionComponent";
import CorteComponent from "@/components/ConfiguracionVistosBuenos/CorteComponent";
import ColorEdgeComponent from "@/components/ConfiguracionVistosBuenos/ColorEdgeComponent";
import HotStampingComponent from "@/components/ConfiguracionVistosBuenos/HotStampingComponent";
import MillingChipComponent from "@/components/ConfiguracionVistosBuenos/MillingChipComponent";
import PersonalizacionComponent from "@/components/ConfiguracionVistosBuenos/PersonalizacionComponent";

interface Props {
  params: Promise<{ id: string }>;
}
  
export default function ConfigVistosBuenosAuxPage({ params }: Props) {
  const { id } = use(params);
  const [FormQuestions, setFormQuestions] = useState<any>(null)
  console.log('El id', id);
  
  useEffect(() => {
    async function fetchFormQuestions() {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/work-order-cqm/${id}/form-questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      console.log('Orden por area:', data)
      setFormQuestions(data)
    }
    fetchFormQuestions()
  }, [id])
  
    if (!FormQuestions) return <div>Cargando...</div>
  
    // Mostrar la liberacion del producto por area 
    const renderComponentByArea = () => {
      switch (parseInt(id)) {
        case 2:
        return <ImpresionComponent formQuestion={FormQuestions}/> 
        case 3:
        return <SerigrafiaComponent formQuestion={FormQuestions}/> 
        case 4:
        return <EmpalmeComponent formQuestion={FormQuestions}/> 
        case 5:
        return <LaminacionComponent formQuestion={FormQuestions}/> 
        case 6:
        return <CorteComponent formQuestion={FormQuestions}/> 
        case 7:
        return <ColorEdgeComponent formQuestion={FormQuestions}/> 
        case 8:
        return <HotStampingComponent formQuestion={FormQuestions}/> 
        case 9:
        return <MillingChipComponent formQuestion={FormQuestions}/> 
        case 10:
        return <PersonalizacionComponent formQuestion={FormQuestions}/> 
        default: 
          return <div>Area no reconocida.</div>
      }
    };
    return (
      <PageContainer>
        {renderComponentByArea()}
      </PageContainer>
    );
  }
  
  // =================== Styled Components ===================
  const PageContainer = styled.div`
    padding: 1rem 2rem;
    margin-top: -80px;
    width: 100%;
    align-content: flex-start;
    justify-content: center;
  `;
    


