'use client';

import { useEffect, useState, use } from "react";
import styled from "styled-components";
import { getFormQuestionsByArea } from "@/api/configVistosBuenos";

import ImpresionComponent from "@/components/ConfiguracionVistosBuenos/ImpresionComponent";
import SerigrafiaComponent from "@/components/ConfiguracionVistosBuenos/SerigrafiaComponent";
import EmpalmeComponent from "@/components/ConfiguracionVistosBuenos/EmpalmeComponent";
import LaminacionComponent from "@/components/ConfiguracionVistosBuenos/LaminacionComponent";
import CorteComponent from "@/components/ConfiguracionVistosBuenos/CorteComponent";
import ColorEdgeComponent from "@/components/ConfiguracionVistosBuenos/ColorEdgeComponent";
import HotStampingComponent from "@/components/ConfiguracionVistosBuenos/HotStampingComponent";
import MillingChipComponent from "@/components/ConfiguracionVistosBuenos/MillingChipComponent";
import PersonalizacionComponent from "@/components/ConfiguracionVistosBuenos/PersonalizacionComponent";

interface Params {
  id: string;
}
interface Props {
  params: Promise<Params>;
}

export default function ConfigVistosBuenosAuxPage({ params }: Props) {
  const { id: idString } = use(params); // Desempaquetar con React.use()
  const id = parseInt(idString, 10);
  const [FormQuestions, setFormQuestions] = useState<any>(null);

  useEffect(() => {
    async function fetchFormQuestions() {
      const data = await getFormQuestionsByArea(id);
      setFormQuestions(data);
    }
    fetchFormQuestions();
  }, [id]);

  if (!FormQuestions) return <div>Cargando...</div>;

  const renderComponentByArea = () => {
    switch (id) {
      case 2: return <ImpresionComponent formQuestion={FormQuestions}/> 
      case 3: return <SerigrafiaComponent formQuestion={FormQuestions}/> 
      case 4: return <EmpalmeComponent formQuestion={FormQuestions}/> 
      case 5: return <LaminacionComponent formQuestion={FormQuestions}/> 
      case 6: return <CorteComponent formQuestion={FormQuestions}/> 
      case 7: return <ColorEdgeComponent formQuestion={FormQuestions}/> 
      case 8: return <HotStampingComponent formQuestion={FormQuestions}/> 
      case 9: return <MillingChipComponent formQuestion={FormQuestions}/> 
      case 10: return <PersonalizacionComponent formQuestion={FormQuestions}/> 
      default: return <div>Área no reconocida.</div>
    }
  };

  return <PageContainer>{renderComponentByArea()}</PageContainer>;
}

const PageContainer = styled.div`
  padding: 1rem 2rem;
  margin-top: -80px;
  width: 100%;
  align-content: flex-start;
  justify-content: center;
`;