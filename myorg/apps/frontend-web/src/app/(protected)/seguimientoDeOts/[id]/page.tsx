// myorg/apps/frontend-web/src/app/(protected)/seguimientoDeOts/[id]/page.tsx
'use client'

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { fetchWorkOrderById, closeWorkOrder } from "@/api/seguimientoDeOts";

interface Props {
  params: Promise<{ id: string }>;
}

type AreaData = {
  id: number;
  name: string;
  status: string;
  response: {
    user: {
      username: string;
    }
  };
  answers: any;
  usuario: string;
  auditor: string;
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
    const loadData = async () => {
      const data = await fetchWorkOrderById(id);
      setWorkOrder(data);
    };
    loadData();
  }, [id]);

  const handleCloseOrder = async () => {
    try {
      await closeWorkOrder(workOrder?.ot_id);
      router.push('/seguimientoDeOts');
    } catch (error) {
      console.log('Error al enviar datos:', error);
    }
  }

  // Función para obtener los datos específicos de cada área
  const getAreaData = (areaId: number, areaResponse: any) => {
    switch (areaId) {
      case 1:
        return { buenas: areaResponse?.prepress?.plates || 0, malas: areaResponse?.prepress?.bad_quantity || 0, excedente: areaResponse?.prepress?.excess_quantity || 0, cqm: 0, muestras: 0, usuario: areaResponse?.user?.username || '', auditor: '' };
      case 2:
        return { buenas: areaResponse?.impression?.release_quantity || 0, malas: areaResponse?.impression?.bad_quantity || 0, excedente: areaResponse?.impression?.excess_quantity || 0, cqm: areaResponse?.impression?.form_answer?.sample_quantity ?? 0, muestras: 0,usuario: areaResponse?.user?.username || '', auditor: '' };
      case 3:
        return { buenas: areaResponse?.serigrafia?.release_quantity || 0, malas: areaResponse?.serigrafia?.bad_quantity || 0, excedente: areaResponse?.serigrafia?.excess_quantity || 0, cqm: areaResponse?.serigrafia?.form_answer?.sample_quantity ?? 0, muestras: 0,usuario: areaResponse?.user?.username || '', auditor: '' };
      case 4:
        return { buenas: areaResponse?.empalme?.release_quantity || 0, malas: areaResponse?.empalme?.bad_quantity || 0, excedente: areaResponse?.empalme?.excess_quantity || 0, cqm: areaResponse?.empalme?.form_answer?.sample_quantity ?? 0, muestras: 0,usuario: areaResponse?.user?.username || '', auditor: '' };
      case 5:
        return { buenas: areaResponse?.laminacion?.release_quantity || 0, malas: areaResponse?.laminacion?.bad_quantity || 0, excedente: areaResponse?.laminacion?.excess_quantity || 0, cqm: areaResponse?.laminacion?.form_answer?.sample_quantity ?? 0, muestras: 0,usuario: areaResponse?.user?.username || '', auditor: '' };
      case 6:
        return { buenas: areaResponse?.corte?.good_quantity || 0, malas: areaResponse?.corte?.bad_quantity || 0, excedente: areaResponse?.corte?.excess_quantity || 0, cqm: areaResponse?.corte?.form_answer?.sample_quantity ?? 0, muestras: areaResponse?.corte?.formAuditory?.sample_auditory ?? 0,usuario: areaResponse?.user?.username || '', auditor: areaResponse?.corte?.formAuditory?.user?.username || '' };
      case 7:
        return { buenas: areaResponse?.colorEdge?.good_quantity || 0, malas: areaResponse?.colorEdge?.bad_quantity || 0, excedente: areaResponse?.colorEdge?.excess_quantity || 0, cqm: areaResponse?.colorEdge?.form_answer?.sample_quantity || 0, muestras: areaResponse?.colorEdge?.formAuditory?.sample_auditory ?? 0,usuario: areaResponse?.user?.username || '', auditor: areaResponse?.colorEdge?.formAuditory?.user?.username || '' };
      case 8:
        return { buenas: areaResponse?.hotStamping?.good_quantity || 0, malas: areaResponse?.hotStamping?.bad_quantity || 0, excedente: areaResponse?.hotStamping?.excess_quantity || 0, cqm: areaResponse?.hotStamping?.form_answer?.sample_quantity || 0, muestras: areaResponse?.hotStamping?.formAuditory?.sample_auditory ?? 0,usuario: areaResponse?.user?.username || '', auditor: areaResponse?.hotStamping?.formAuditory?.user?.username || '' };
      case 9:
        return { buenas: areaResponse?.millingChip?.good_quantity || 0, malas: areaResponse?.millingChip?.bad_quantity || 0, excedente: areaResponse?.millingChip?.excess_quantity || 0, cqm: areaResponse?.millingChip?.form_answer?.sample_quantity || 0, muestras: areaResponse?.millingChip?.formAuditory?.sample_auditory ?? 0,usuario: areaResponse?.user?.username || '', auditor: areaResponse?.millingChip?.formAuditory?.user?.username || '' };
      case 10:
        return { buenas: areaResponse?.personalizacion?.good_quantity || 0, malas: areaResponse?.personalizacion?.bad_quantity || 0, excedente: areaResponse?.personalizacion?.excess_quantity || 0, cqm: areaResponse?.personalizacion?.form_answer?.sample_quantity || 0, muestras: areaResponse?.personalizacion?.formAuditory?.sample_auditory ?? 0,usuario: areaResponse?.user?.username || '', auditor: areaResponse?.personalizacion?.formAuditory?.user?.username || '' };
      default:
        return { buenas: 0, malas: 0, excedente: 0, cqm: 0, muestras: 0 };
    }
  };

  const areas: AreaData[] = workOrder?.flow?.map((item: any) => ({
    id: item.area_id,
    name: item.area?.name || 'Sin nombre',
    status: item.status || 'Desconocido',
    response: item.areaResponse || {},
    answers: item.answers?.[0] || {},
    ...getAreaData(item.area_id, item.areaResponse)
  })) || [];


  const cantidadHojasRaw = Number(workOrder?.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;

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
            <Label>Cantidad (TARJETAS): </Label>
            <Value>{workOrder?.quantity}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Cantidad (HOJAS): </Label>
            <Value>{cantidadHojas}</Value>
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
                  <th />
                  {areas.map((area) => (
                    <th key={area.id} title={`Estado: ${area.status}`}>
                      <span>{area.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Usuario</td>
                  {areas.map((area) => (
                    <td key={area.id}>{area.usuario}</td>
                  ))}
                </tr>
                <tr>
                  <td>Auditor</td>
                  {areas.map((area) => (
                    <td key={area.id}>{area.auditor}</td>
                  ))}
                </tr>
                <tr>
                  <td>Estado</td>
                  {areas.map((area) => (
                    <td key={area.id}>{area.status}</td>
                  ))}
                </tr>
                <tr>
                  <td>Buenas</td>
                  {areas.map((area) => (
                    <td key={area.id}>{area.buenas}</td>
                  ))}
                </tr>
                <tr>
                  <td>Malas</td>
                  {areas.map((area) => (
                    <td key={area.id}>{area.malas}</td>
                  ))}
                </tr>
                <tr>
                  <td>Excedente</td>
                  {areas.map((area) => (
                    <td key={area.id}>{area.excedente}</td>
                  ))}
                </tr>
                <tr>
                  <td>CQM</td>
                  {areas.map((area) => (
                    <td key={area.id}>{area.cqm}</td>
                  ))}
                </tr>
                <tr>
                  <td>Muestras</td>
                  {areas.map((area) => (
                    <td key={area.id}>{area.muestras}</td>
                  ))}
                </tr>
                <tr>
                  <td>SUMA TOTAL</td>
                  {areas.map((area) => (
                    <td key={area.id}>
                      {area.buenas +
                        area.malas +
                        area.excedente +
                        area.cqm +
                        area.muestras}
                    </td>
                  ))}
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
  color: black;
  margin-bottom: 0.25rem;
`;

const Value = styled.span`
  font-size: 1.125rem;  
  margin-top: 5px;
  color: black;
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
    color:rgb(4, 4, 4);
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
  background-color: ${({ theme }) => theme.palette.primary.main};
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
  background-color: #0038A8;
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