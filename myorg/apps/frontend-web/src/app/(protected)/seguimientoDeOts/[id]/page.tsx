// myorg/apps/frontend-web/src/app/(protected)/seguimientoDeOts/[id]/page.tsx
'use client'

import { use, useState, useEffect } from "react";
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
    excedente: number;
    muestras: number;
};

export default function SeguimientoDeOtsAuxPage({ params }: Props) {
    const { id } = use(params);
    const [workOrder, setWorkOrder] = useState<any>(null)

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
    }, [id])

    // Función para obtener los datos específicos de cada área
    const getAreaData = (areaId: number, areaResponse: any) => {
        switch(areaId) {
            case 1: // preprensa
                return {
                    buenas: areaResponse?.prepress?.plates || 0,
                    malas: areaResponse?.prepress?.bad_quantity || '',
                    excedente: areaResponse?.prepress?.excess_quantity || '',
                    muestras: areaResponse?.prepress?.sample_quantity || ''
                };
            case 2: // impresión
                return {
                    buenas: areaResponse?.impression?.release_quantity || 0,
                    malas: areaResponse?.impression?.bad_quantity || '',
                    excedente: areaResponse?.impression?.excess_quantity || '',
                    muestras: areaResponse?.impression?.form_answer?.sample_quantity ?? ''
                };
            case 3: // serigrafía
                return {
                    buenas: areaResponse?.impression?.release_quantity || 0,
                    malas: areaResponse?.impression?.bad_quantity || '',
                    excedente: areaResponse?.impression?.excess_quantity || '',
                    muestras: areaResponse?.impression?.form_answer?.sample_quantity ?? ''
                };
            case 4: // empalme
                return {
                    buenas: areaResponse?.empalme?.release_quantity || '',
                    malas: areaResponse?.empalme?.bad_quantity || '',
                    excedente: areaResponse?.empalme?.excess_quantity || '',
                    muestras: areaResponse?.empalme?.form_answer?.sample_quantity ?? ''
                };
            case 5: // empalme
                return {
                    buenas: areaResponse?.laminacion?.release_quantity || 0,
                    malas: areaResponse?.laminacion?.bad_quantity || '',
                    excedente: areaResponse?.laminacion?.excess_quantity || '',
                    muestras: areaResponse?.laminacion?.form_answer?.sample_quantity ?? ''
                };
            case 6: // empalme
                return {
                    buenas: areaResponse?.corte?.good_quantity || 0,
                    malas: areaResponse?.corte?.bad_quantity || 0,
                    excedente: areaResponse?.corte?.excess_quantity || 0,
                    muestras: areaResponse?.corte?.form_answer?.sample_quantity ?? ''
                };
            case 7: // empalme
                return {
                    buenas: areaResponse?.colorEdge?.good_quantity || 0,
                    malas: areaResponse?.colorEdge?.bad_quantity || 0,
                    excedente: areaResponse?.colorEdge?.excess_quantity || 0,
                    muestras: areaResponse?.colorEdge?.form_answer?.sample_quantity ?? ''
                };
            case 8: // empalme
                return {
                    buenas: areaResponse?.hotStamping?.good_quantity || 0,
                    malas: areaResponse?.hotStamping?.bad_quantity || 0,
                    excedente: areaResponse?.hotStamping?.excess_quantity || 0,
                    muestras: areaResponse?.hotStamping?.form_answer?.sample_quantity ?? ''
                };
            case 9: // empalme
                return {
                    buenas: areaResponse?.millingChip?.good_quantity || 0,
                    malas: areaResponse?.millingChip?.bad_quantity || 0,
                    excedente: areaResponse?.millingChip?.excess_quantity || 0,
                    muestras: areaResponse?.millingChip?.form_answer?.sample_quantity ?? ''
                };
            case 10: // empalme
                return {
                    buenas: areaResponse?.personalizacion?.good_quantity || 0,
                    malas: areaResponse?.personalizacion?.bad_quantity || 0,
                    excedente: areaResponse?.personalizacion?.excess_quantity || 0,
                    muestras: areaResponse?.personalizacion?.form_answer?.sample_quantity ?? ''
                };
            // Añade más casos según tus áreas
            default:
                return {
                    buenas: 0,
                    malas: 0,
                    excedente: 0,
                    muestras: 0
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
            <Label>Número de Orden:</Label>
            <Value>{workOrder?.ot_id}</Value>
          </InfoItem>
          <InfoItem>
            <Label>ID del Presupuesto:</Label>
            <Value>{workOrder?.mycard_id}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Cantidad:</Label>
            <Value>{workOrder?.quantity}</Value>
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
                      {area.answers.reviewed 
                        ? area.answers.accepted ? 'Aprobado' : 'No aceptado' 
                        : 'No aplica'}
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
          </NewDataWrapper>
        </NewData>
      </Container>
    </>
    );

};

// =================== Styled Components ===================

const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h2`
  margin-bottom: 20px;
`;

const DataWrapper = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.span`
  font-weight: bold;
`;

const Value = styled.span`
  margin-top: 5px;
`;

const NewData = styled.div`
  margin-top: 30px;
`;

const SectionTitle = styled.h3`
  margin-bottom: 15px;
`;

const NewDataWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }
  
  th {
    background-color: #f2f2f2;
  }
  
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

const LiberarButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
`;

const CancelButton = styled.button`
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const ConfirmButton = styled.button`
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;