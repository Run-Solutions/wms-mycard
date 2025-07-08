// myorg/apps/frontend-web/src/app/(protected)/cerrarOrdenDeTrabajo/[id]/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  fetchWorkOrderById,
  liberarWorkOrderAuditory,
} from '@/api/cerrarOrdenDeTrabajo';

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
    };
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

export default function CloseWorkOrderAuxPage({ params }: Props) {
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
    const payload = {
      workOrderFlowId: workOrder.id,
      workOrderId: workOrder.workOrder.id,
    };
    console.log('Payload to send:', payload);
    try {
      await liberarWorkOrderAuditory(payload);
      router.push('/cerrarOrdenDeTrabajo');
    } catch (error) {
      console.log('Error al enviar datos:', error);
    }
  };

  console.log('Work Order Data:', workOrder);

  const getAreaData = (
    areaId: number,
    areaResponse: any,
    partialReleases: any[] = [],
    flowUser: any = null,
    index: number = -1
  ) => {
    const sumFromPartials = () => {
      return partialReleases.reduce(
        (acc: any, curr: any) => {
          acc.buenas += curr.quantity || 0;
          acc.malas += curr.bad_quantity || 0;
          acc.excedente += curr.excess_quantity || 0;
          return acc;
        },
        { buenas: 0, malas: 0, excedente: 0 }
      );
    };

    const getCommonData = (areaKey: string) => {
      const hasResponse = !!areaResponse?.[areaKey];
      const usuario = areaResponse?.user?.username || flowUser?.username || '';
      const auditor =
        areaResponse?.[areaKey]?.formAuditory?.user?.username || '';

      if (!hasResponse && partialReleases.length > 0) {
        const resumen = sumFromPartials();
        console.log('[PARCIAL DETECTADO]', areaKey, resumen);
        return { ...resumen, cqm: 0, muestras: 0, usuario, auditor: '' };
      }

      return {
        buenas:
          areaResponse?.[areaKey]?.good_quantity ||
          areaResponse?.[areaKey]?.release_quantity ||
          areaResponse?.[areaKey]?.plates ||
          0,
        malas: areaResponse?.[areaKey]?.bad_quantity || 0,
        excedente: areaResponse?.[areaKey]?.excess_quantity || 0,
        cqm: areaResponse?.[areaKey]?.form_answer?.sample_quantity ?? 0,
        muestras: areaResponse?.[areaKey]?.formAuditory?.sample_auditory ?? 0,
        usuario,
        auditor,
      };
    };

    switch (areaId) {
      case 6:
        return getCommonData('corte');
      case 7:
        return getCommonData('colorEdge');
      case 8:
        return getCommonData('hotStamping');
      case 9:
        return getCommonData('millingChip');
      case 10:
        return getCommonData('personalizacion');
      default:
        return {
          buenas: 0,
          malas: 0,
          excedente: 0,
          cqm: 0,
          muestras: 0,
          usuario: '',
          auditor: '',
        };
    }
  };

  const areas: AreaData[] =
    workOrder?.workOrder.flow
      ?.filter((item: any, index: any) => item.area_id >= 6)
      .map((item: any, index: any) => ({
        id: item.area_id,
        name: item.area?.name || 'Sin nombre',
        status: item.status || 'Desconocido',
        response: item.areaResponse || {},
        answers: item.answers?.[0] || {},
        ...getAreaData(
          item.area_id,
          item.areaResponse,
          item.partialReleases,
          item.user,
          index
        ),
      })) || [];
  const cantidadHojasRaw = Number(workOrder?.workOrder.quantity) / 24;
  const cantidadHojas = cantidadHojasRaw > 0 ? Math.ceil(cantidadHojasRaw) : 0;
  const ultimaArea = areas[areas.length - 1];
  const totalMalas = areas.reduce((acc, area) => acc + (area.malas || 0), 0);
  const totalCqm = areas
    .filter((area) => area.id >= 6)
    .reduce((acc, area) => acc + (area.cqm || 0), 0);
  const totalMuestras = areas.reduce(
    (acc, area) => acc + (area.muestras || 0),
    0
  );
  const totalUltimaBuenas = ultimaArea?.buenas || 0;
  const totalUltimaExcedente = ultimaArea?.excedente || 0;

  const totalGeneral =
    totalUltimaBuenas +
    totalUltimaExcedente +
    totalMalas +
    totalCqm +
    totalMuestras;
  return (
    <>
      <Container>
        <Title>Información Complementaria Orden de Trabajo</Title>

        <DataWrapper>
          <InfoItem>
            <Label>Número de Orden:</Label>
            <Value>{workOrder?.workOrder.ot_id}</Value>
          </InfoItem>
          <InfoItem>
            <Label>ID del Presupuesto:</Label>
            <Value>{workOrder?.workOrder.mycard_id}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Cantidad (TARJETAS): </Label>
            <Value>{workOrder?.workOrder.quantity}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Cantidad (KITS): </Label>
            <Value>{cantidadHojas}</Value>
          </InfoItem>
        </DataWrapper>

        <InfoItem>
          <Label>Comentarios:</Label>
          <Value>{workOrder?.workOrder.comments}</Value>
        </InfoItem>

        <Section>
          <SectionTitle>Datos de Producción</SectionTitle>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th />
                  {areas.map((area, index) => (
                    <th
                      key={`${area.id}-${index}`}
                      title={`Estado: ${area.status}`}
                    >
                      <span>{area.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Usuario</td>
                  {areas.map((area, index) => (
                    <td key={`${area.id}-${index}`}>{area.usuario}</td>
                  ))}
                </tr>
                <tr>
                  <td>Auditor</td>
                  {areas.map((area, index) => (
                    <td key={`${area.id}-${index}`}>{area.auditor}</td>
                  ))}
                </tr>
                <tr>
                  <td>Estado</td>
                  {areas.map((area, index) => (
                    <td key={`${area.id}-${index}`}>{area.status}</td>
                  ))}
                </tr>
                <tr>
                  <td>Buenas</td>
                  {areas.map((area, index) => (
                    <td key={`${area.id}-${index}`}>{area.buenas}</td>
                  ))}
                </tr>
                <tr>
                  <td>Malas</td>
                  {areas.map((area, index) => (
                    <td key={`${area.id}-${index}`}>{area.malas}</td>
                  ))}
                </tr>
                <tr>
                  <td>Excedente</td>
                  {areas.map((area, index) => (
                    <td key={`${area.id}-${index}`}>{area.excedente}</td>
                  ))}
                </tr>
                <tr>
                  <td>CQM</td>
                  {areas.map((area, index) => (
                    <td key={`${area.id}-${index}`}>{area.cqm}</td>
                  ))}
                </tr>
                <tr>
                  <td>Muestras</td>
                  {areas.map((area, index) => (
                    <td key={`${area.id}-${index}`}>{area.muestras}</td>
                  ))}
                </tr>
                <tr>
                  <td>SUMA TOTAL</td>
                  {areas.map((area, index) => (
                    <td key={`${area.id}-${index}`}>
                      {area.buenas +
                        area.malas +
                        area.excedente +
                        area.cqm +
                        area.muestras}
                    </td>
                  ))}
                </tr>
                <tr style={{ backgroundColor: '#d7e6d1' }}>
                  <td>BUENAS + EXCEDENTE</td>
                  {areas.map((area, idx) => (
                    <td key={`${area.id}-${idx}`}>
                      {area.id >= 6 ? area.buenas + area.excedente : ''}
                    </td>
                  ))}
                </tr>
              </tbody>
            </Table>
          </TableWrapper>
          {workOrder?.status !== 'En proceso' && (
            <>
              <SectionTitle>Cuadres</SectionTitle>
              <TableWrapper>
                <TableCuadres>
                  <thead>
                    <tr>
                      <th />
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Buenas Última Operación</td>
                      {ultimaArea && (
                        <td key={`${ultimaArea.id}-last`}>
                          {ultimaArea.buenas}
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td>Excedente Última Operación</td>
                      {ultimaArea && (
                        <td key={`${ultimaArea.id}-last`}>
                          {ultimaArea.excedente}
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td>Total Malas</td>
                      <td>{totalMalas}</td>
                    </tr>
                    <tr>
                      <td>Total CQM</td>
                      <td>{totalCqm}</td>
                    </tr>
                    <tr>
                      <td>Total Muestras</td>
                      <td>{totalMuestras}</td>
                    </tr>
                    <tr>
                      <td>TOTAL</td>
                      <td>{totalGeneral}</td>
                    </tr>
                  </tbody>
                </TableCuadres>
              </TableWrapper>
            </>
          )}
          {workOrder?.status !== 'Cerrado' && (
            <CloseButton onClick={() => setShowConfirm(true)}>
              Cerrar Orden de Trabajo
            </CloseButton>
          )}
        </Section>
      </Container>

      {showConfirm && (
        <ModalOverlay>
          <ModalBox>
            <h4>¿Estás segura/o que deseas cerrar esta Orden de Trabajo?</h4>
            <Actions>
              <CancelButton onClick={() => setShowConfirm(false)}>
                Cancelar
              </CancelButton>
              <ConfirmButton onClick={handleCloseOrder}>
                Confirmar
              </ConfirmButton>
            </Actions>
          </ModalBox>
        </ModalOverlay>
      )}
    </>
  );
}

// =================== Styled Components ===================

const Container = styled.div`
  padding: 20px 50px;
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
  font-size: 2rem;
  color: ${({ theme }) => theme.palette.text.primary};
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
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
  flex: 1;
`;

const Label = styled.span`
  font-weight: 600;
  display: block;
  color: black;
  margin-bottom: 0.25rem;
`;

const Value = styled.span`
  font-size: 1.125rem;
  color: black;
`;

const Section = styled.div`
  margin-top: 30px;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.palette.text.primary};
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
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);

  th,
  td {
    padding: 0.75rem;
    text-align: center;
    color: black;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background: #f3f4f6;
    font-weight: 600;
    color: #374151;
    position: relative;
  }

  tr:nth-child(even) {
    background: #fafafa;
  }
`;

const TableCuadres = styled.table`
  width: 40%;
  border-collapse: collapse;
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);

  th,
  td {
    padding: 0.75rem;
    text-align: left;
    color: rgb(4, 4, 4);
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
  background: #2563eb;
  color: white;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: #1d4ed8;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const ConfirmButton = styled.button`
  background-color: #2563eb;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #1e40af;
  }
`;

const CancelButton = styled.button`
  background-color: #bbbbbb;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #a0a0a0;
  }
`;
