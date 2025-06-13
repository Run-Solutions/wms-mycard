'use client'

import { use, useEffect, useState } from 'react';
import styled from 'styled-components';
import { fetchWorkOrderById, liberarWorkOrderAuditory } from '@/api/cerrarOrdenDeTrabajo';

interface Props {
  params: Promise<{ id: string }>;
}

interface AreaTotals {
  buenas: number;
  malas: number;
  excedente: number;
  cqm: number;
  muestras: number;
}

export default function CloseWorkOrderAuxPage({ params }: Props) {
  const { id } = use(params);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const data = await fetchWorkOrderById(id);
      setWorkOrder(data);
    }
    fetchData();
  }, [id]);

  const getAreaData = (areaId: number, areaResponse: any) => {
    switch (areaId) {
      case 6: return { ...areaResponse?.corte, usuario: areaResponse?.user?.username || '', auditor: areaResponse?.corte?.formAuditory?.user?.username || '' };
      case 7: return { ...areaResponse?.colorEdge, usuario: areaResponse?.user?.username || '', auditor: areaResponse?.colorEdge?.formAuditory?.user?.username || '' };
      case 8: return { ...areaResponse?.hotStamping, usuario: areaResponse?.user?.username || '', auditor: areaResponse?.hotStamping?.formAuditory?.user?.username || '' };
      case 9: return { ...areaResponse?.millingChip, usuario: areaResponse?.user?.username || '', auditor: areaResponse?.millingChip?.formAuditory?.user?.username || '' };
      case 10: return { ...areaResponse?.personalizacion, usuario: areaResponse?.user?.username || '', auditor: areaResponse?.personalizacion?.formAuditory?.user?.username || '' };
      default: return { buenas: 0, malas: 0, excedente: 0, cqm: 0, muestras: 0, usuario: '', auditor: '' };
    }
  };

  const areas = workOrder?.flow?.map((item: any) => {
    const areaData = getAreaData(item.area_id, item.areaResponse);
    return {
      id: item.area_id,
      name: item.area?.name || 'Sin nombre',
      ...areaData,
      buenas: areaData?.good_quantity || 0,
      malas: areaData?.bad_quantity || 0,
      excedente: areaData?.excess_quantity || 0,
      cqm: areaData?.form_answer?.sample_quantity || 0,
      muestras: areaData?.formAuditory?.sample_auditory || 0,
    };
  }) || [];

  const totals = areas.reduce(
    (acc: AreaTotals, area: any): AreaTotals => {
      acc.buenas += Number(area.buenas || 0);
      acc.malas += Number(area.malas || 0);
      acc.excedente += Number(area.excedente || 0);
      acc.cqm += Number(area.cqm || 0);
      acc.muestras += Number(area.muestras || 0);
      return acc;
    },
    { buenas: 0, malas: 0, excedente: 0, cqm: 0, muestras: 0 }
  );

  const handleCloseOrder = async () => {
    try {
      const currentFlow = workOrder.flow.find((f: any) => f.status === 'En auditoria');
      await liberarWorkOrderAuditory({
        workOrderFlowId: currentFlow.id,
        workOrderId: workOrder.id,
      });
      alert('La orden de trabajo ha sido cerrada.');
      window.history.back();
    } catch (error) {
      console.error(error);
      alert('No se pudo cerrar la orden.');
    }
  };

  if (!workOrder) return <div>Cargando...</div>;

  return (
    <PageContainer>
      <h1>Información de la Orden #{id}</h1>
      <Card>
        <p><strong>OT:</strong> {workOrder.ot_id}</p>
        <p><strong>Presupuesto:</strong> {workOrder.mycard_id}</p>
        <p><strong>Cantidad:</strong> {workOrder.quantity}</p>
        <p><strong>Comentarios:</strong> {workOrder.comments}</p>
      </Card>

      <h2>Datos de Producción por Área</h2>
      <TableWrapper>
        <table>
          <thead>
            <tr>
              <th>Área</th>
              <th>Buenas</th>
              <th>Malas</th>
              <th>Excedente</th>
              <th>CQM</th>
              <th>Muestras</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {areas.filter((a: any) => a.id >= 6).map((area: any, index: any) => (
              <tr key={index}>
                <td>{area.name}</td>
                <td>{area.buenas}</td>
                <td>{area.malas}</td>
                <td>{area.excedente}</td>
                <td>{area.cqm}</td>
                <td>{area.muestras}</td>
                <td>{area.usuario}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <td><strong>Totales</strong></td>
              <td>{totals.buenas}</td>
              <td>{totals.malas}</td>
              <td>{totals.excedente}</td>
              <td>{totals.cqm}</td>
              <td>{totals.muestras}</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </TableWrapper>

      {workOrder?.status !== 'Cerrado' && (
        <>
          <Button onClick={() => setShowConfirm(true)}>Cerrar Orden de Trabajo</Button>
          {showConfirm && (
            <ModalOverlay>
              <ModalBox>
                <p>¿Deseas cerrar esta Orden de Trabajo?</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <button onClick={() => setShowConfirm(false)}>Cancelar</button>
                  <button onClick={handleCloseOrder}>Confirmar</button>
                </div>
              </ModalBox>
            </ModalOverlay>
          )}
        </>
      )}
    </PageContainer>
  );
}

// =================== Styled Components ===================
const PageContainer = styled.div`
  padding: 1rem 2rem;
  background-color: #fdfaf6;
`;

const Card = styled.div`
  background: white;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-radius: 18px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  margin-top: 1rem;
  table {
    border-collapse: collapse;
    width: 100%;
    th, td {
      padding: 0.75rem 1rem;
      border: 1px solid #ccc;
      text-align: center;
    }
  }
`;

const Button = styled.button`
  background-color: #0038A8;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 18px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 2rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 18px;
  width: 90%;
  max-width: 400px;
  text-align: center;
`;