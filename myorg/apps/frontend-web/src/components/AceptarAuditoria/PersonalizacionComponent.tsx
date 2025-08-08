'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  acceptWorkOrderFlowPersonalizacionAuditory,
  registrarInconformidadAuditory,
} from '@/api/aceptarAuditoria';
import BadQuantityModal from './util/BadQuantityModal';
import { AreaData } from '../LiberarProducto/PersonalizacionComponent';

// Define un tipo para los valores del formulario
type PersonalizacionData = {
  good_quantity: number | string;
  bad_quantity: number | string;
  excess_quantity: number | string;
  cqm_quantity: string;
  comments: string;
};

interface Props {
  workOrder: any;
}
type PartialRelease = {
  area: string;
  quantity: string;
  bad_quantity: string;
  excess_quantity: string;
  observation: string;
  validated: boolean;
};

export default function PersonalizacionComponentAcceptAuditory({
  workOrder,
}: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState<string>('');

  // Estado para saber si los valores han sido modificados y para habilitar o deshabilitar el botón
  const [isDisabled, setIsDisabled] = useState(true);

  const [sampleAuditory, setSampleQuantity] = useState('');
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<{
    [areaName: string]: string;
  }>({});
  const [materialBadQuantity, setMaterialBadQuantity] = useState<string>('0');

  if (workOrder.area_id >= 2) {
    // Estados tipados para los valores predeterminados y actuales
    const [defaultValues, setDefaultValues] = useState<PersonalizacionData>({
      good_quantity: 0,
      bad_quantity: 0,
      excess_quantity: 0,
      cqm_quantity: '',
      comments: '',
    });
    const cqm_quantity = workOrder.answers.reduce(
      (total: number, answer: { sample_quantity?: number | string }) => {
        return total + (Number(answer.sample_quantity) || 0);
      },
      0
    );

    useEffect(() => {
      if (!workOrder) return;

      const personalizacion = workOrder.areaResponse?.personalizacion;
      const partials = workOrder.partialReleases;

      const allValidated =
        partials.length > 0 && partials.every((p: any) => p.validated);

      if (personalizacion && partials.length === 0) {
        // Caso original: hay empalme pero no hay parciales
        const vals: PersonalizacionData = {
          good_quantity: personalizacion.good_quantity || '',
          bad_quantity: personalizacion.bad_quantity || '',
          excess_quantity: personalizacion.excess_quantity || '',
          cqm_quantity: cqm_quantity || '',
          comments: personalizacion.comments || '',
        };
        setDefaultValues(vals);
      } else if (personalizacion && allValidated) {
        // Nuevo caso: todos los parciales están validados y hay empalme
        const totalParciales = partials.reduce(
          (acc: any, curr: any) => acc + (curr.quantity || 0),
          0
        );
        const totalParcialesbad = partials.reduce(
          (acc: any, curr: any) => acc + (curr.bad_quantity || 0),
          0
        );
        const totalParcialesexec = partials.reduce(
          (acc: any, curr: any) => acc + (curr.excess_quantity || 0),
          0
        );
        const restante = (personalizacion.good_quantity || 0) - totalParciales;
        const restantebad =
          (personalizacion.bad_quantity || 0) - totalParcialesbad;
        const restanteexc =
          (personalizacion.excess_quantity || 0) - totalParcialesexec;

        const vals: PersonalizacionData = {
          good_quantity: restante > 0 ? restante : 0,
          bad_quantity: restantebad > 0 ? restantebad : 0,
          excess_quantity: restanteexc > 0 ? restanteexc : 0,
          cqm_quantity: cqm_quantity || '',
          comments: personalizacion.comments || '',
        };
        setDefaultValues(vals);
      } else {
        // Caso original: se busca el primer parcial sin validar
        const firstUnvalidatedPartial = partials.find((p: any) => !p.validated);

        const vals: PersonalizacionData = {
          good_quantity: firstUnvalidatedPartial.quantity || '',
          bad_quantity: firstUnvalidatedPartial.bad_quantity || '',
          excess_quantity: firstUnvalidatedPartial.excess_quantity || '',
          cqm_quantity: cqm_quantity || '',
          comments: firstUnvalidatedPartial.observation || '',
        };
        setDefaultValues(vals);
      }
    }, [workOrder]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!sampleAuditory) {
        alert(
          'Por favor, asegurate de que no haya inconformidades con las cantidades entregadas.'
        );
        return;
      }
      const PersonalizacionId =
        workOrder?.areaResponse?.personalizacion?.id ?? workOrder.id;
      try {
        await acceptWorkOrderFlowPersonalizacionAuditory(
          PersonalizacionId,
          sampleAuditory
        );
        router.push('/aceptarAuditoria');
      } catch (error) {
        console.error(error);
        alert('Error al conectar con el servidor');
      }
    };

    const handleSubmitInconformidad = async () => {
      if (!inconformidad.trim()) {
        alert('Debes ingresar una inconformidad antes de continuar.');
        return;
      }
      try {
        await registrarInconformidadAuditory(workOrder?.id, inconformidad);
        router.push('/aceptarAuditoria');
      } catch (error) {
        console.error(error);
        alert('Error al conectar con el servidor');
      }
    };
    const currentFlow = workOrder;
    const flowList = [...workOrder.workOrder.flow];
    const currentIndex = flowList.findIndex(
      (item) => item.id === currentFlow?.id
    );
    const previousFlows = flowList
      .slice(0, currentIndex + 1)
      .filter((flow) => flow.area_id !== 1);

    console.log('Áreas anteriores sin Preprensa:', previousFlows);
    const handleOpenBadQuantityModal = () => {
      const initialValues: { [areaName: string]: string } = {};

      previousFlows.forEach((flow) => {
        const areaName = flow.area.name;

        let badQuantity: number | null | undefined = null;
        let materialBadQuantity: number | null | undefined = null;

        // Primero, busca en areaResponse
        if (flow.areaResponse?.impression) {
          badQuantity = flow.areaResponse.impression.bad_quantity;
        } else if (flow.areaResponse?.serigrafia) {
          badQuantity = flow.areaResponse.serigrafia.bad_quantity;
        } else if (flow.areaResponse?.empalme) {
          badQuantity = flow.areaResponse.empalme.bad_quantity;
        } else if (flow.areaResponse?.laminacion) {
          badQuantity = flow.areaResponse.laminacion.bad_quantity;
        } else if (flow.areaResponse?.corte) {
          badQuantity = flow.areaResponse.corte.bad_quantity;
          materialBadQuantity = flow.areaResponse.corte.material_quantity;
        } else if (flow.areaResponse?.colorEdge) {
          badQuantity = flow.areaResponse.colorEdge.bad_quantity;
          materialBadQuantity = flow.areaResponse.colorEdge.material_quantity;
        } else if (flow.areaResponse?.hotStamping) {
          badQuantity = flow.areaResponse.hotStamping.bad_quantity;
          materialBadQuantity = flow.areaResponse.hotStamping.material_quantity;
        } else if (flow.areaResponse?.millingChip) {
          badQuantity = flow.areaResponse.millingChip.bad_quantity;
          materialBadQuantity = flow.areaResponse.millingChip.material_quantity;
        } else if (flow.areaResponse?.personalizacion) {
          badQuantity = flow.areaResponse.personalizacion.bad_quantity;
          materialBadQuantity =
            flow.areaResponse.personalizacion.material_quantity;
        }

        // Si sigue sin valor, busca en partialReleases
        if (
          (badQuantity === null || badQuantity === undefined) &&
          flow.partialReleases?.length > 0
        ) {
          badQuantity = flow.partialReleases.reduce(
            (sum: number, release: any) => {
              return sum + (release.bad_quantity ?? 0);
            },
            0
          );
          materialBadQuantity = flow.partialReleases.reduce(
            (sum: number, release: any) => {
              return sum + (release.material_quantity ?? 0);
            },
            0
          );
        }

        // Guardar valores por separado
        initialValues[`${areaName}_bad`] =
          badQuantity !== null && badQuantity !== undefined
            ? String(badQuantity)
            : '';

        initialValues[`${areaName}_material`] =
          materialBadQuantity !== null && materialBadQuantity !== undefined
            ? String(materialBadQuantity)
            : '';
      });

      setAreaBadQuantities(initialValues);
      setShowBadQuantity(true);
      console.log('Valores iniciales para malas por área:', initialValues);
    };

    const sumaBadQuantity = previousFlows.reduce((sum, flow) => {
      let bad = 0;

      if (flow.areaResponse?.impression) {
        bad = flow.areaResponse.impression.bad_quantity || 0;
      } else if (flow.areaResponse?.serigrafia) {
        bad = flow.areaResponse.serigrafia.bad_quantity || 0;
      } else if (flow.areaResponse?.empalme) {
        bad = flow.areaResponse.empalme.bad_quantity || 0;
      } else if (flow.areaResponse?.laminacion) {
        bad = flow.areaResponse.laminacion.bad_quantity || 0;
      } else if (flow.areaResponse?.corte) {
        const corte = flow.areaResponse.corte;
        const corteBad = corte.bad_quantity || 0;
        const corteMaterial = corte.material_quantity || 0; // ← suma también este
        bad = corteBad + corteMaterial;
      } else if (flow.areaResponse?.colorEdge) {
        const colorEdge = flow.areaResponse.colorEdge;
        const colorEdgeBad = colorEdge.bad_quantity || 0;
        const colorEdgeMaterial = colorEdge.material_quantity || 0; // ← suma también este
        bad = colorEdgeBad + colorEdgeMaterial;
      } else if (flow.areaResponse?.hotStamping) {
        const hotStamping = flow.areaResponse.hotStamping;
        const hotStampingBad = hotStamping.bad_quantity || 0;
        const hotStampingMaterial = hotStamping.material_quantity || 0; // ← suma también este
        bad = hotStampingBad + hotStampingMaterial;
      } else if (flow.areaResponse?.millingChip) {
        const millingChip = flow.areaResponse.millingChip;
        const millingChipBad = millingChip.bad_quantity || 0;
        const millingChipMaterial = millingChip.material_quantity || 0; // ← suma también este
        bad = millingChipBad + millingChipMaterial;
      } else if (flow.areaResponse?.personalizacion) {
        const personalizacion = flow.areaResponse.personalizacion;
        const personalizacionBad = personalizacion.bad_quantity || 0;
        const personalizacionMaterial = personalizacion.material_quantity || 0; // ← suma también este
        bad = personalizacionBad + personalizacionMaterial;
      }

      // Si no hay respuesta y sí hay parciales
      if (bad === 0 && flow.partialReleases?.length > 0) {
        bad = flow.partialReleases.reduce(
          (partialSum: number, release: any) => {
            const badQty = release.bad_quantity ?? 0;
            const materialQty = release.material_quantity ?? 0;
            return partialSum + badQty + materialQty; // ← también suma material aquí
          },
          0
        );
      }

      return sum + bad;
    }, 0);

    const normalizedAreas: AreaData[] = previousFlows.map((item) => ({
      id: item.area?.id ?? item.id,
      name: item.area?.name ?? item.name ?? '',
      malas: item.malas ?? 0,
      defectuoso: item.defectuoso ?? 0,

      // Valores ficticios para completar el tipo requerido
      status: item.status ?? '',
      response: item.areaResponse ?? {},
      answers: item.answers ?? [],
      usuario: item.user?.username ?? '',
      auditor: '',
      buenas: 0,
      cqm: 0,
      excedente: 0,
      muestras: 0,
    }));

    return (
      <Container>
        <Title>Área: {workOrder?.area.name || 'No definida'}</Title>
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
            <Value>{workOrder?.workOrder.quantity || 'No definida'}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Área que lo envía:</Label>
            <Value>{workOrder?.area.name || 'No definida'}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Usuario que lo envía:</Label>
            <Value>{workOrder?.user.username || 'No definida'}</Value>
          </InfoItem>
        </DataWrapper>
        <DataWrapper>
          <InfoItem>
            <Label>Comentarios:</Label>
            <Value>{workOrder?.workOrder.comments || 'No definida'}</Value>
          </InfoItem>
        </DataWrapper>
        <NewData>
          <SectionTitle>Datos de Producción</SectionTitle>
          <NewDataWrapper>
            <InputGroup>
              <Label>Buenas:</Label>
              <Input
                type="number"
                name="good_quantity"
                value={defaultValues.good_quantity}
                disabled
              />
              <Label>Malas:</Label>
              <Input
                type="number"
                name="bad_quantity"
                value={sumaBadQuantity}
                onClick={handleOpenBadQuantityModal}
                readOnly
              />
              <Label>Excedente:</Label>
              <Input
                type="number"
                name="excess_quantity"
                value={defaultValues.excess_quantity}
                disabled
              />
              <Label>Muestras en CQM:</Label>
              <Input
                type="number"
                name="excess_quantity"
                value={defaultValues.cqm_quantity}
                disabled
              />
              <Label>Muestras:</Label>
              <Input
                type="number"
                value={sampleAuditory}
                onChange={(e) => setSampleQuantity(e.target.value)}
              />
            </InputGroup>
            <InconformidadButton onClick={() => setShowInconformidad(true)}>
              Inconformidad
            </InconformidadButton>
          </NewDataWrapper>
          <InputGroup>
            <SectionTitle>Comentarios</SectionTitle>
            <Textarea value={defaultValues.comments} disabled={isDisabled} />
          </InputGroup>
        </NewData>
        <AceptarButton onClick={() => setShowConfirm(true)}>
          Aceptar recepción del producto
        </AceptarButton>
        {/* Modal para marcar malas por areas previas al liberar */}
        {showBadQuantity && (
          <BadQuantityModal
            areas={normalizedAreas}
            areaBadQuantities={areaBadQuantities}
            setAreaBadQuantities={setAreaBadQuantities}
            onConfirm={({
              updatedAreas,
              totalBad,
              totalMaterial,
              lastAreaBad,
              lastAreaMaterial,
            }) => {
              setShowBadQuantity(false);
            }}
            onClose={() => setShowBadQuantity(false)}
          />
        )}
        {showConfirm && (
          <ModalOverlay>
            <ModalBox>
              <h4>¿Estás segura/o que deseas liberar este producto?</h4>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '1rem',
                }}
              >
                <CancelButton onClick={() => setShowConfirm(false)}>
                  Cancelar
                </CancelButton>
                <ConfirmButton onClick={handleSubmit}>Confirmar</ConfirmButton>
              </div>
            </ModalBox>
          </ModalOverlay>
        )}
        {showInconformidad && (
          <ModalOverlay>
            <ModalBox>
              <h4>Registrar Inconformidad</h4>
              <h3>
                Por favor, describe la inconformidad detectada con la cantidad
                entregada.
              </h3>
              <Textarea
                value={inconformidad}
                onChange={(e) => setInconformidad(e.target.value)}
                placeholder="Escribe aquí la inconformidad..."
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '1rem',
                }}
              >
                <CancelButton onClick={() => setShowInconformidad(false)}>
                  Cancelar
                </CancelButton>
                <ConfirmButton
                  onClick={() => {
                    console.log('Hpli');
                    if (!inconformidad.trim()) {
                      alert(
                        'Debes ingresar una inconformidad antes de continuar.'
                      );
                      return;
                    }
                    handleSubmitInconformidad();
                    setShowInconformidad(false);
                  }}
                >
                  Guardar
                </ConfirmButton>
              </div>
            </ModalBox>
          </ModalOverlay>
        )}
      </Container>
    );
  }

  return (
    <Container>
      <Title>Área no reconocida</Title>
    </Container>
  );
}

// =================== Styled Components ===================

const Container = styled.div`
  background: white;
  padding: 2rem;
  margin-top: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

const NewData = styled.div``;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: #374151;
`;

const DataWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const InfoItem = styled.div`
  flex: 1;
  padding: 5px;
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
  align-items: center;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  width: 50%;
  padding-top: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  color: black;
  margin-top: 0.25rem;
  outline: none;
  font-size: 1rem;
  transition: border 0.3s;

  &:focus {
    border-color: #0038a8;
  }
`;

const InputBad = styled.input`
  width: 100%;
  color: black;
  padding: 0.75rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  outline: none;
  font-size: 1rem;
  transition: border 0.3s;

  &:focus {
    border-color: #0038a8;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  color: black;
  margin-top: 0.5rem;
  font-size: 1rem;
  resize: vertical;

  &:focus {
    border-color: #0038a8;
    outline: none;
  }
`;

const AceptarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 2rem;
  background-color: ${({ disabled }) => (disabled ? '#9CA3AF' : '#0038A8')};
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${({ disabled }) => (disabled ? '#9CA3AF' : '#1D4ED8')};
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  color: black;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
`;

const ConfirmButton = styled.button`
  background-color: #0038a8;
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
  background-color: #bbbbbb;
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

const InconformidadButton = styled.button<{ disabled?: boolean }>`
  height: 50px;
  background-color: ${({ disabled }) => (disabled ? '#D1D5DB' : '#A9A9A9')};
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  align-self: flex-end;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${({ disabled }) => (disabled ? '#D1D5DB' : '#8d8d92')};
  }
`;
