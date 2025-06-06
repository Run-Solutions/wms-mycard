'use client'

import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

interface Props {
  workOrder: any;
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

export default function CorteComponent({ workOrder }: Props) {
  const router = useRouter();
  
  // Para bloquear liberacion hasta que sea aprobado por CQM
  const isDisabled = workOrder.status === 'En proceso';

  //Para guardar las respuestas 
  const getAreaData = (areaId: number, areaResponse: any) => {
    switch(areaId) {
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
  const areas: AreaData[] = workOrder.workOrder?.flow?.filter((item: any) => item.area_id >= 6).map((item: any) => {
    const areaData = getAreaData(item.area_id, item.areaResponse);
    return {
      id: item.area_id,
      name: item.area?.name || 'Sin nombre',
      status: item.status || 'Desconocido',
      response: item.areaResponse || {},
      answers: item.answers?.[0] || {},
      ...areaData
    }
  }) || [];

  // Para Liberar el producto 
  const [showConfirm, setShowConfirm] = useState(false); 

  const handleImpressSubmit = async () => {
    const payload = {
      workOrderFlowId: workOrder.id,
      workOrderId: workOrder.work_order_id,
    };

    console.log('datos a enviar',payload);
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay token de autenticación');
        return;
      }
  
      const res = await fetch('http://localhost:3000/free-work-order-auditory/cerrar-auditoria', {
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
  
      router.push('/cerrarOrdenDeTrabajo');
    } catch (error) {
      console.log('Error al enviar datos:', error);
    }
  };

  return (
    <>
    <Container>
      <Title>Liberar Orden de Trabajo</Title>

      <DataWrapper>
      <InfoItem>
          <Label>Número de Orden:</Label>
          <Value>{workOrder.workOrder.ot_id}</Value>
        </InfoItem>
        <InfoItem>
          <Label>ID del Presupuesto:</Label>
          <Value>{workOrder.workOrder.mycard_id}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Cantidad:</Label>
          <Value>{workOrder.workOrder.quantity}</Value>
        </InfoItem>
      </DataWrapper>
      <NewData>
        <SectionTitle>Datos de Producción</SectionTitle>
        <NewDataWrapper>
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
              <td style={{ textAlign: 'left'}}>Buenas</td>
              {areas.map((area, index) => (
                <td key={index}>{area.buenas || ''}</td>
              ))}
            </tr>
            <tr>
              <td style={{ textAlign: 'left'}}>Malas</td>
              {areas.map((area, index) => (
                <td key={index}>{area.malas || ''}</td>
              ))}
            </tr>
            <tr>
              <td style={{ textAlign: 'left'}}>Excedente</td>
              {areas.map((area, index) => (
                <td key={index}>{area.excedente || ''}</td>
              ))}
            </tr>
            <tr>
              <td style={{ textAlign: 'left'}}>CQM</td>
              {areas.map((area, index) => (
                <td key={index}>{area.cqm ?? ''}</td>
              ))}
            </tr>
            <tr>
              <td style={{ textAlign: 'left'}}>Muestras</td>
              {areas.map((area, index) => (
                <td key={index}>{area.muestras || ''}</td>
              ))}
            </tr>
            <tr>
              <td style={{ textAlign: 'left'}}>SUMA TOTAL</td>
              {areas.map((area, index) => {
                const buenas = Number(area.buenas) ?? 0;
                const malas = Number(area.malas) ?? 0;
                const excedente = Number(area.excedente) ?? 0;
                const cqm = Number(area.cqm) || 0;
                const muestras = Number(area.muestras) ?? 0;
                const total = buenas + malas + excedente + muestras + cqm;
                return <td key={index}>{total}</td>;
              })}
            </tr>
          </tbody>
          </Table>
        </NewDataWrapper>
      </NewData>
      <LiberarButton disabled={isDisabled} onClick={() => setShowConfirm(true)}>Liberar Producto</LiberarButton>
    </Container>
    {/* Modal para enviar a liberacion */}
    {showConfirm && (
        <ModalOverlay>
          <ModalBox>
            <h4>¿Estás segura/o que deseas liberar este producto?</h4>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <CancelButton onClick={() => setShowConfirm(false)}>Cancelar</CancelButton>
              <ConfirmButton onClick={handleImpressSubmit}>Confirmar</ConfirmButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
  </>
  );
}

// =================== Styled Components ===================

const Container = styled.div`
  background: white;
  padding: 2rem;
  margin-top: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1f2937;
`;

const NewData = styled.div`
  
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: #374151;
`;

const DataWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
`;

const InfoItem = styled.div`
  flex: 1;
  min-width: 200px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #6b7280;
`;

const Value = styled.div`
  margin-top: 0.25rem;
  font-weight: 500;
  color: #111827;
`;

const NewDataWrapper = styled.div`
  display: flex;
  gap: 8rem;
  flex-wrap: wrap;
`;

const LiberarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 2rem;
  background-color: ${({ disabled }) => disabled ? '#9CA3AF' : '#2563EB'};
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.7 : 1};

  &:hover {
    background-color: ${({ disabled }) => disabled ? '#9CA3AF' : '#1D4ED8'};
  }

  &:disabled {
    background-color: #9CA3AF;
    cursor: not-allowed;
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 0.75rem;
    text-align: center;
    color: black;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background-color: #f3f4f6;
    color: #374151;
  }
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