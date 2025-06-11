// myorg/apps/frontend-web/src/app/(protected)/configuracionVistosBuenos/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled, { useTheme } from 'styled-components';
import { getConfigVistosBuenos } from '@/api/configVistosBuenos';

// Se define el tipo de datos
interface FormQuestion {
  id: number;
  title: string;
  key: string;
  role_id: number | null;
  areas: {
    id: number;
    name: string;
  }[];
  created_at: string;
  updated_at: string;
}

const ConfigVistosBuenosPage: React.FC = () => {
  const [FormQuestions, setFormQuestions] = useState<FormQuestion[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchFormQuestions() {
      try {
        const data = await getConfigVistosBuenos();
        console.log('Datos obtenidos: ', data);
        setFormQuestions(data);
      } catch (err) {
        console.error(err);
        console.error('Error en fetchWorkOrders:', err);
      }
    }
    fetchFormQuestions();
  }, []);

  const uniqueAreas = Array.from(
    new Map(
      FormQuestions.flatMap((fq) => fq.areas).map((area) => [area.id, area])
    ).values()
  );

  const handleClick = (areaId: any) => {
    router.push(`/configuracionVistosBuenos/${areaId}`);
  };

  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Configuracion de Vistos Buenos</Title>
        <div style={{marginTop: '50px'}}className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uniqueAreas.map((area) => (
            <AreaCard key={area.id} onClick={() => handleClick(area.id)}>
              <h2>{area.name}</h2>
            </AreaCard>
          ))}
        </div>
      </TitleWrapper>
      
    </PageContainer>
  );
};

export default ConfigVistosBuenosPage;

// =================== Styled Components ===================

const PageContainer = styled.div`
  padding: 20px 20px 20px 50px;
  margin-top: -70px;
`;

const TitleWrapper = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  filter: drop-shadow(4px 4px 5px rgba(0, 0, 0, 0.4));
`;

const Title = styled.h1<{ theme: any }>`
  font-size: 2rem;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.primary}
`;

const AreaCard = styled.div`
  background-color: ${({ theme }) => theme.palette.background.paper};
  color: ${({ theme }) => theme.palette.text.primary};
  padding: 1.5rem;
  border-radius: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  text-align: center;
  font-weight: 500;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    background-color: ${({ theme }) => theme.palette.primary.main};
    color: #fff;
  }

  h2 {
    font-size: 1.2rem;
  }
`;