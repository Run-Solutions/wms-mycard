'use client';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { acceptMillingChipInconformityAuditory } from '@/api/rechazos';

interface Props {
  workOrder: any; // toda la OT con .flow
  currentFlow: any; // flujo actual (ej: corte)
}
interface PartialRelease {
  quantity: string;
  observations: string;
  validated: boolean;
  work_order_flow_id: number;
  inconformities: any[];
}
type InconformityData = {
  quantity: number | string;
  excess: number | string;
  sample: number | string;
  comments: string;
  user: string;
  inconformity: string;
};

export default function MillingChipComponent({
  workOrder,
  currentFlow,
}: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<{
    [areaName: string]: string;
  }>({});
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };
  const [inconformityValues, setInconformityValues] =
    useState<InconformityData>({
      quantity: '',
      excess: '',
      sample: '',
      comments: '',
      user: '',
      inconformity: '',
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    // Si hay parcialidad sin validar, usar esa
    const partialRelease = currentFlow.partialReleases.find(
      (release: PartialRelease) => release.validated
    );

    // Si no hay parcialidad sin validar, usar areaResponse
    const areaResponseFlowId = currentFlow.areaResponse
      ? currentFlow.areaResponse.work_order_flow_id
      : partialRelease?.work_order_flow_id;

    console.log(areaResponseFlowId);
    try {
      await acceptMillingChipInconformityAuditory(areaResponseFlowId);
      router.push('/aceptarAuditoria');
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  };

  useEffect(() => {
    if (!currentFlow) return;

    const millingChip = currentFlow.areaResponse?.millingChip;
    const partials = currentFlow.partialReleases || [];
    console.log('millingChip:', millingChip);
    const lastPartialRelease = currentFlow.partialReleases.find(
      (release: PartialRelease) => release.validated
    );
    console.log('Ultima parcialidad validar:', lastPartialRelease);

    const allValidated =
      partials.length > 0 && partials.every((p: any) => p.validated);

    if (millingChip && partials.length === 0) {
      // Caso sin parciales
      setInconformityValues({
        quantity: millingChip.good_quantity || '',
        excess: millingChip.excess_quantity || '',
        sample: millingChip.formAuditory?.sample_auditory || '',
        comments: millingChip.comments || '',
        user:
          millingChip.formAuditory?.inconformities.at(-1)?.user.username || '',
        inconformity:
          millingChip.formAuditory?.inconformities.at(-1)?.comments || '',
      });
    } else if (millingChip && allValidated) {
      // Caso con todos parciales validados
      const totalGood = partials.reduce(
        (acc: any, p: any) => acc + (p.quantity || 0),
        0
      );
      const totalExcess = partials.reduce(
        (acc: any, p: any) => acc + (p.excess_quantity || 0),
        0
      );

      setInconformityValues({
        quantity: Math.max((millingChip.good_quantity || 0) - totalGood, 0),
        excess: Math.max((millingChip.excess_quantity || 0) - totalExcess, 0),
        sample: millingChip.formAuditory?.sample_auditory || '',
        comments: millingChip.comments || '',
        user:
          lastPartialRelease.formAuditory.inconformities.at(-1)?.user
            .username || '',
        inconformity:
          lastPartialRelease.formAuditory.inconformities.at(-1)?.comments || '',
      });
    } else {
      // Primer parcial no validado
      const firstUnvalidated = partials.find((p: any) => p.validated);

      setInconformityValues({
        quantity: firstUnvalidated?.quantity || '',
        excess: firstUnvalidated?.excess_quantity || '',
        sample: firstUnvalidated?.formAuditory?.sample_auditory || '',
        comments: firstUnvalidated?.observation || '',
        user:
          lastPartialRelease.formAuditory.inconformities.at(-1)?.user
            .username || '',
        inconformity:
          lastPartialRelease.formAuditory.inconformities.at(-1)?.comments || '',
      });
    }
  }, [currentFlow]);

  const flowList = [...workOrder.flow];
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
        badQuantity = flow.areaResponse.empalme.bad_quantity || 0;
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
    }

    // Si no hay respuesta y sí hay parciales
    if (bad === 0 && flow.partialReleases?.length > 0) {
      bad = flow.partialReleases.reduce((partialSum: number, release: any) => {
        const badQty = release.bad_quantity ?? 0;
        const materialQty = release.material_quantity ?? 0;
        return partialSum + badQty + materialQty; // ← también suma material aquí
      }, 0);
    }

    return sum + bad;
  }, 0);

  return (
    <>
      <FlexContainer>
        <Container>
          <NewData>
            <SectionTitle>Entregaste:</SectionTitle>
            <NewDataWrapper>
              <InputGroup>
                <Label>Buenas:</Label>
                <Input
                  type="number"
                  name="good_quantity"
                  value={inconformityValues.quantity}
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
                  value={inconformityValues.excess}
                  disabled
                />
                <Label>Muestras:</Label>
                <Input
                  type="number"
                  name="excess_quantity"
                  value={inconformityValues.sample}
                  disabled
                />
              </InputGroup>
            </NewDataWrapper>
            <InputGroup>
              <Label>Comentarios</Label>
              <Textarea value={inconformityValues.comments} disabled />
            </InputGroup>
          </NewData>
        </Container>
        <Container>
          <NewData>
            <SectionTitle>Inconformidad:</SectionTitle>
            <InputGroup>
              <Label>Respuesta de Usuario</Label>
              <Input type="text" value={inconformityValues.user} disabled />
            </InputGroup>
            <InputGroup>
              <Label>Comentarios</Label>
              <Textarea value={inconformityValues.inconformity} disabled />
            </InputGroup>
          </NewData>
        </Container>
      </FlexContainer>
      <CloseButton onClick={openModal}>Aceptar Inconformidad</CloseButton>
      {/* Modal para marcar malas por areas previas al liberar */}
      {showBadQuantity && (
        <ModalOverlay>
          <ModalBox>
            <h4>Registrar malas por área</h4>
            {previousFlows.map((flow, index) => {
              const areaKey = flow.area.name.toLowerCase(); // para coincidir con las claves
              return (
                <div
                  key={`${flow.id}-${index}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    marginTop: '1rem',
                  }}
                >
                  <Label style={{ fontWeight: 'bold' }}>
                    {flow.area.name.toUpperCase()}
                  </Label>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div>
                      <Label>Malas</Label>
                      <InputBad
                        type="number"
                        min="0"
                        readOnly
                        value={areaBadQuantities[`${areaKey}_bad`] || '0'}
                        onChange={(e) =>
                          setAreaBadQuantities({
                            ...areaBadQuantities,
                            [`${areaKey}_bad`]: e.target.value,
                          })
                        }
                      />
                    </div>
                    {flow.area_id >= 6 && (
                      <div>
                        <Label>Malo de fábrica</Label>
                        <InputBad
                          type="number"
                          min="0"
                          readOnly
                          value={
                            areaBadQuantities[`${areaKey}_material`] || '0'
                          }
                          onChange={(e) =>
                            setAreaBadQuantities({
                              ...areaBadQuantities,
                              [`${areaKey}_material`]: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              <CancelButton onClick={() => setShowBadQuantity(false)}>
                Cerrar
              </CancelButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
      {showModal && (
        <ModalOverlay>
          <ModalBox>
            <h4>
              ¿Estás segura/o que deseas aceptar la inconformidad? Deberás
              liberar nuevamente
            </h4>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              <CancelButton onClick={closeModal}>Cancelar</CancelButton>
              <ConfirmButton onClick={handleSubmit}>Confirmar</ConfirmButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </>
  );
}

// =================== Styled Components ===================

const FlexContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Container = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  flex: 1;
`;
const NewData = styled.div``;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
`;

const Label = styled.label`
  font-weight: 600;
  color: #6b7280;
`;

const NewDataWrapper = styled.div`
  display: flex;
  gap: 8rem;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  width: 50%;
`;

const Input = styled.input`
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
    border-color: #2563eb;
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
  color: black;
  height: 120px;
  padding: 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
  font-size: 1rem;
  resize: vertical;

  &:focus {
    border-color: #2563eb;
    outline: none;
  }
`;

const CloseButton = styled.button`
  background-color: ${({ disabled }) => (disabled ? '#9CA3AF' : '#0038A8')};
  color: white;
  margin-top: 20px;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
  transition: background 0.3s;

  &:hover {
    background: #1d4ed8;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  color: black;
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

const ConfirmButton = styled.button`
  background-color: ${({ disabled }) => (disabled ? '#9CA3AF' : '#0038A8')};
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
