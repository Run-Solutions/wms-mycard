// myorg/apps/frontend-web/src/app/(protected)/seguimientoDeOts/[id]/page.tsx
'use client'

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

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

export default function FinalizacionAuxPage({ params }: Props) {
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
          cqm: areaResponse?.impression?.form_answer?.sample_quantity ?? 0,
          muestras: '',
        };
      case 3: // serigrafía
        return {
          buenas: areaResponse?.serigrafia?.release_quantity || 0,
          malas: areaResponse?.serigrafia?.bad_quantity || '',
          excedente: areaResponse?.serigrafia?.excess_quantity || '',
          cqm: areaResponse?.serigrafia?.form_answer?.sample_quantity ?? 0,
          muestras: '',
        };
      case 4: // empalme
        return {
          buenas: areaResponse?.empalme?.release_quantity || '',
          malas: areaResponse?.empalme?.bad_quantity || '',
          excedente: areaResponse?.empalme?.excess_quantity || '',
          cqm: areaResponse?.empalme?.form_answer?.sample_quantity ?? 0,
          muestras: '',
        };
      case 5: // empalme
        return {
          buenas: areaResponse?.laminacion?.release_quantity || 0,
          malas: areaResponse?.laminacion?.bad_quantity || '',
          excedente: areaResponse?.laminacion?.excess_quantity || '',
          cqm: areaResponse?.laminacion?.form_answer?.sample_quantity ?? 0,
          muestras: '',
        };
      case 6: // corte
        return {
          buenas: areaResponse?.corte?.good_quantity || 0,
          malas: areaResponse?.corte?.bad_quantity || 0,
          excedente: areaResponse?.corte?.excess_quantity || 0,
          cqm: areaResponse?.corte?.form_answer?.sample_quantity ?? 0,
          muestras: areaResponse?.corte?.formAuditory?.sample_auditory ?? ''
        };
      case 7: // color-edge
        return {
          buenas: areaResponse?.colorEdge?.good_quantity || 0,
          malas: areaResponse?.colorEdge?.bad_quantity || 0,
          excedente: areaResponse?.colorEdge?.excess_quantity || 0,
          cqm: areaResponse?.colorEdge?.form_answer?.sample_quantity || 0,
          muestras: areaResponse?.colorEdge?.formAuditory?.sample_auditory ?? ''
        };
      case 8: // hot-stamping
        return {
          buenas: areaResponse?.hotStamping?.good_quantity || 0,
          malas: areaResponse?.hotStamping?.bad_quantity || 0,
          excedente: areaResponse?.hotStamping?.excess_quantity || 0,
          cqm: areaResponse?.hotStamping?.form_answer?.sample_quantity || 0,
          muestras: areaResponse?.hotStamping?.formAuditory?.sample_auditory ?? ''
        };
      case 9: // milling-chip
        return {
          buenas: areaResponse?.millingChip?.good_quantity || 0,
          malas: areaResponse?.millingChip?.bad_quantity || 0,
          excedente: areaResponse?.millingChip?.excess_quantity || 0,
          cqm: areaResponse?.millingChip?.form_answer?.sample_quantity || 0,
          muestras: areaResponse?.millingChip?.formAuditory?.sample_auditory ?? ''
        };
      case 10: // personalizacion
        return {
          buenas: areaResponse?.personalizacion?.good_quantity || 0,
          malas: areaResponse?.personalizacion?.bad_quantity || 0,
          excedente: areaResponse?.personalizacion?.excess_quantity || 0,
          cqm: areaResponse?.personalizacion?.form_answer?.sample_quantity || 0,
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
        <Title>Información Complementaria Orden de Trabajo</Title>

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

          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th></th>
                  {areas.map((area, i) => <th key={i}>{area.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {["Estado", "Buenas", "Malas", "Excedente", "CQM", "Muestras", "Total"].map((rowTitle, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{rowTitle}</td>
                    {areas.map((area, i) => {
                      const value = (() => {
                        if (rowTitle === "Estado") return area.status;
                        if (rowTitle === "Buenas") return area.buenas;
                        if (rowTitle === "Malas") return area.malas;
                        if (rowTitle === "Excedente") return area.excedente;
                        if (rowTitle === "CQM") return area.cqm;
                        if (rowTitle === "Muestras") return area.muestras;
                        if (rowTitle === "Total") { 
                          const keys = ["buenas", "malas", "excedente", "cqm", "muestras"];
                          return keys.reduce((sum, key) => sum + Number((area as any)[key]), 0);
                        }
                      })();
                      return <td key={i}>{String(value)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </TableWrapper>

          {workOrder?.status !== 'Cerrado' && (
            <CloseButton onClick={() => setShowConfirm(true)}>Cerrar Orden de Trabajo</CloseButton>
          )}
        </Section>
      </Container>

      {showConfirm && (
        <ModalOverlay>
          <ModalBox>
            <h4>¿Estás segura/o que deseas cerrar esta Orden de Trabajo?</h4>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <CancelButton onClick={() => setShowConfirm(false)}>Cancelar</CancelButton>
              <ConfirmButton onClick={handleCloseOrder}>Confirmar</ConfirmButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
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
  color: ${({ theme }) => theme.palette.text.primary};
  flex: 1;
`;

const Label = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary}
  margin-bottom: 0.25rem;
`;

const Value = styled.span`
  font-size: 1.125rem;
  color: #111827;
  color: ${({ theme }) => theme.palette.text.primary}
`;

const Section = styled.section`
  margin-top: 3rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.palette.text.primary}
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  margin-bottom: 2rem;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);

  th, td {
    padding: 0.75rem;
    text-align: center;
    border-bottom: 1px solid #e5e7eb;
    color: ${({ theme }) => theme.palette.text.primary}
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

const CloseButton = styled.button`
  background: #16a34a;
  color: white;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
  transition: background 0.3s;

  &:hover {
    background: #15803d;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  color: black;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  max-width: 400px;
  width: 90%;
`;

const ConfirmButton = styled.button`
  background-color: #2563eb;
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
  background-color: #BBBBBB;
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