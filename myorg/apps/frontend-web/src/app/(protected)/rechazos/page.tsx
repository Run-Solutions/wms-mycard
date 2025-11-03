// myorg/apps/frontend-web/src/app/(protected)/rechazos/page.tsx
'use client';

import WorkOrderTable from '@/components/Rechazos/WorkOrderTable';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getWorkOrdersWithInconformidadAuditory } from '@/api/rechazos';

interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  created_by: number;
  status: string;
  validated: boolean;
  createdAt: string;
  updatedAt: string;
  user: { username: string };
  files: { id: number; type: string; file_path: string }[];
  flow: {
    id: number;
    area_id: number;
    status: string;
    assigned_user?: number;
    area?: { name?: string };
  }[];
  formAnswers?: any[];
}

const RechazosPage: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    async function fetchAllWorkOrders() {
      try {
        const res = await getWorkOrdersWithInconformidadAuditory();
        console.log(res, 'res');

        // ✅ Adaptado al nuevo backend
        const allFlows = Array.isArray(res?.pendingOrders)
          ? res.pendingOrders
          : [];

        // ✅ Aplana a WorkOrder y filtra nulos
        const allWorkOrders = allFlows
          .map((f: any) => f?.workOrder)
          .filter(Boolean);

        // ✅ Deduplica por id (por si acaso)
        const deduped = dedupeBy(allWorkOrders, (wo: WorkOrder) => wo.id);

        setWorkOrders(deduped);
      } catch (err) {
        console.error('Error en fetchAllWorkOrders', err);
      }
    }
    fetchAllWorkOrders();
  }, []);
  return (
    <PageContainer>
      <TitleWrapper>
        <Title>Rechazos</Title>
      </TitleWrapper>

      <WorkOrderTable
        orders={workOrders}
        title="Ordenes Devueltas por Inconformidad"
        statusFilter="En inconformidad auditoria"
      />
    </PageContainer>
  );
};

export default RechazosPage;

// =================== utils ===================
function dedupeBy<T>(arr: T[], keyFn: (x: T) => string | number): T[] {
  const seen = new Set<string | number>();
  const out: T[] = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

// =================== Styled Components ===================
const PageContainer = styled.div`
  padding: 1rem 2rem;
  margin-top: -70px;
`;
const TitleWrapper = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  filter: drop-shadow(4px 4px 5px rgba(0, 0, 0, 0.4));
`;
const Title = styled.h1`
  font-size: 2rem;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.primary};
`;
