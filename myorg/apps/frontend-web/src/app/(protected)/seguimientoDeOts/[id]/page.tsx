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

export default function SeguimientoDeOtsAuxPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false); 

  useEffect(() => {
    async function fetchWorkOrder() {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/work-orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json()
      console.log('Orden:', data)
      setWorkOrder(data)
    }
    fetchWorkOrder()
  }, [id]);

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
      router.push('/seguimientoDeOts');
    } catch (error) {
      console.log('Error al enviar datos:', error);
    }
  }

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
          <SectionTitle>Datos de Producción</SectionTitle>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th></th>
                  {areas.map((area, index) => (
                    <th key={index}>{area.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Estado</td>
                  {areas.map((area, index) => (
                    <td key={index}>{area.status}</td>
                  ))}
                </tr>
                <tr>
                  <td>Buenas</td>
                  {areas.map((area, index) => (
                    <td key={index}>{area.buenas || ''}</td>
                  ))}
                </tr>
                <tr>
                  <td>Malas</td>
                  {areas.map((area, index) => (
                    <td key={index}>{area.malas}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Excedente</td>
                  {areas.map((area, index) => (
                    <td key={index}>{area.excedente}</td>
                  ))}
                </tr>
                <tr>
                  <td>CQM</td>
                  {areas.map((area, index) => (
                    <td key={index}>
                      {area.cqm}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Muestras</td>
                  {areas.map((area, index) => (
                    <td key={index}>{area.muestras}</td>
                  ))}
                </tr>
                <tr>
                <td>SUMA TOTAL</td>
                {areas.map((area, index) => {
                    const buenas = Number(area.buenas) || 0;
                    const malas = Number(area.malas) || 0;
                    const excedente = Number(area.excedente) || 0;
                    const muestras = Number(area.muestras) || 0;
                    const total = buenas + malas + excedente + muestras;
                    return <td key={index}>{total}</td>;
                })}
                </tr>
              </tbody>
            </Table>
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
  flex: 1;
`;

const Label = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary}
  margin-bottom: 0.25rem;
`;

const Value = styled.span`
  font-size: 1.125rem;  
  margin-top: 5px;
`;

const Section = styled.div`
  margin-top: 30px;
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

const Table = styled.table`
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
  background: #2563EB;
  color: white;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
  transition: background 0.3s;

  &:hover {
    background: #1D4ED8;
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