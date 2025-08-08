// myorg/apps/frontend-web/src/app/(protected)/configuracionVistosBuenos/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { getConfigVistosBuenos } from '@/api/configVistosBuenos';

// Tipos
interface Area {
  id: number;
  name: string;
}

interface FormQuestion {
  id: number;
  title: string;
  key: string;
  role_id: number | null;
  areas: Area[];
  created_at: string;
  updated_at: string;
}

const ConfigVistosBuenosPage: React.FC = () => {
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getConfigVistosBuenos();
        setFormQuestions(data);
      } catch (err) {
        console.error('Error al obtener preguntas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getUniqueAreas = (): Area[] => {
    return Array.from(
      new Map(
        formQuestions.flatMap((fq) => fq.areas).map((a) => [a.id, a])
      ).values()
    );
  };
  const handleClick = (areaId: number) => {
    router.push(`/configuracionVistosBuenos/${areaId}`);
  };
  const uniqueAreas = getUniqueAreas();


  return (
    <PageContainer>
      <Title>Configuración de Vistos Buenos</Title>
      {loading ? (
        <p className="text-center text-gray-500 mt-10">Cargando áreas...</p>
      ) : (
        <CardGrid>
          {uniqueAreas.map((area) => (
            <AreaCard key={area.id} onClick={() => handleClick(area.id)}>
              <h2>{area.name}</h2>
            </AreaCard>
          ))}
        </CardGrid>
      )}
    </PageContainer>
  );
};

export default ConfigVistosBuenosPage;

// =================== Styled Components ===================

const PageContainer = styled.div`
  padding: 20px 20px 20px 50px;
  margin-top: -70px;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary};
  text-align: center;
  margin-bottom: 5rem;
  margin-top: 0.5rem;
  filter: drop-shadow(3px 3px 5px rgba(0, 0, 0, 0.25));
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  max-width: 1100px;
  margin: 0 auto;
  gap: 1.5rem;

  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const AreaCard = styled.div`
  background-color: ${({ theme }) => theme.palette.background.paper};
  color: ${({ theme }) => theme.palette.text.primary};
  padding: 1.5rem;
  border-radius: 1rem;
  cursor: pointer;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    background-color: ${({ theme }) => theme.palette.primary.main};
    color: #fff;
  }

  h2 {
    font-size: 1.2rem;
  }
`;