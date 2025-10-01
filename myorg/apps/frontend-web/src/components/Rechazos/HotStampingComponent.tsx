'use client';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { acceptHotStampingInconformityAuditory } from '@/api/rechazos';
import { InconformityData } from './CorteComponent';
import BadQuantityModal from '../AceptarAuditoria/util/BadQuantityModal';
import { AreaData } from '../LiberarProducto/PersonalizacionComponent';
import {
  blockSupportsMaterial,
  resolveBlockKey,
} from '../LiberarProducto/util/areaMappings';

interface Props {
  workOrder: any;
  currentFlow: any;
}
interface PartialRelease {
  quantity: string;
  observations: string;
  validated: boolean;
  work_order_flow_id: number;
  inconformities: any[];
}

export default function HotStampingComponent({
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
      noprocess: '',
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
      await acceptHotStampingInconformityAuditory(areaResponseFlowId);
      router.push('/aceptarAuditoria');
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  };

  useEffect(() => {
    if (!currentFlow) return;

    const hotStamping = currentFlow.areaResponse?.hotStamping;
    const partials = currentFlow.partialReleases || [];
    console.log('hotStamping:', hotStamping);
    const lastPartialRelease = currentFlow.partialReleases
      .filter((r: PartialRelease) => r.validated)
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

    console.log('Ultima parcialidad validar:', lastPartialRelease);

    const allValidated =
      partials.length > 0 && partials.every((p: any) => p.validated);

    if (hotStamping && partials.length === 0) {
      // Caso sin parciales
      setInconformityValues({
        quantity: hotStamping.good_quantity || '',
        excess: hotStamping.excess_quantity || '',
        noprocess: hotStamping.noprocess_quantity || '',
        sample: hotStamping.formAuditory?.sample_auditory || '',
        comments: hotStamping.comments || '',
        user:
          hotStamping.formAuditory?.inconformities.at(-1)?.user.username || '',
        inconformity:
          hotStamping.formAuditory?.inconformities.at(-1)?.comments || '',
      });
    } else if (hotStamping && allValidated) {
      // Caso con todos parciales validados
      const totalGood = partials.reduce(
        (acc: any, p: any) => acc + (p.quantity || 0),
        0
      );
      const totalExcess = partials.reduce(
        (acc: any, p: any) => acc + (p.excess_quantity || 0),
        0
      );
      const totalNoProcess = partials.reduce(
        (acc: any, p: any) => acc + (p.noprocess_quantity || 0),
        0
      );

      setInconformityValues({
        quantity: Math.max((hotStamping.good_quantity || 0) - totalGood, 0),
        excess: Math.max((hotStamping.excess_quantity || 0) - totalExcess, 0),
        noprocess: Math.max(
          (hotStamping.noprocess_quantity || 0) - totalNoProcess,
          0
        ),
        sample: hotStamping.formAuditory?.sample_auditory || '',
        comments: hotStamping.comments || '',
        user:
          lastPartialRelease.formAuditory.inconformities.at(-1)?.user
            .username || '',
        inconformity:
          lastPartialRelease.formAuditory.inconformities.at(-1)?.comments || '',
      });
    } else {
      // Primer parcial no validado
      const firstUnvalidated = partials
        .filter((r: PartialRelease) => r.validated)
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

      setInconformityValues({
        quantity: firstUnvalidated?.quantity || '',
        excess: firstUnvalidated?.excess_quantity || '',
        noprocess: firstUnvalidated?.noprocess_quantity || '',
        sample: firstUnvalidated?.formAuditory?.sample_auditory || '',
        comments: firstUnvalidated?.observation || '',
        user:
          firstUnvalidated.formAuditory.inconformities.at(-1)?.user.username ||
          '',
        inconformity:
          firstUnvalidated.formAuditory.inconformities.at(-1)?.comments || '',
      });
    }
  }, [currentFlow]);

  // 1) No recrees flowList en cada render
  const flowList = useMemo(() => workOrder?.flow ?? [], [workOrder?.flow]);

  // 2) Memoiza previousFlows basado en refs estables
  const currentIndex = useMemo(
    () => flowList.findIndex((item: any) => item.id === currentFlow?.id),
    [flowList, currentFlow?.id]
  );

  const previousFlows = useMemo(
    () =>
      flowList
        .slice(0, currentIndex + 1)
        .filter((flow: any) => flow.area_id !== 1),
    [flowList, currentIndex]
  );

  // 3) Arregla las deps y evita setState si no cambió
  const computeInitialBadQuantities = useCallback(() => {
    const initialValues: Record<string, string> = {};
    const makeAreaKey = (name?: string) =>
      (name ?? '').toLowerCase().replace(/\s/g, '');

    previousFlows.forEach((flow: any) => {
      (flow?.badQuantityDetails ?? []).forEach((detail: any) => {
        const currentAreaId = currentFlow?.area_id ?? currentFlow?.area?.id;
        if (detail?.source_area_id === currentAreaId) {
          const areaName = makeAreaKey(detail?.targetArea?.name);
          initialValues[`${areaName}_bad`] = detail?.bad_quantity
            ? String(detail.bad_quantity)
            : '0';
          initialValues[`${areaName}_material`] = detail?.material_quantity
            ? String(detail.material_quantity)
            : '0';
        }
      });
    });

    return initialValues;
  }, [previousFlows, currentFlow?.area_id, currentFlow?.area?.id]);

  // 4) Solo setear si realmente cambió (comparación simple por string)
  useEffect(() => {
    const initial = computeInitialBadQuantities();
    if (Object.keys(initial).length > 0) {
      setAreaBadQuantities((prev) => {
        const same = JSON.stringify(prev) === JSON.stringify(initial); // barato y suficiente aquí
        return same ? prev : initial;
      });
    }
  }, [computeInitialBadQuantities]);

  // 5) Y lo mismo al abrir el modal
  const handleOpenBadQuantityModal = () => {
    const initial = computeInitialBadQuantities();
    if (Object.keys(initial).length > 0) {
      setAreaBadQuantities((prev) => {
        const same = JSON.stringify(prev) === JSON.stringify(initial);
        return same ? prev : initial;
      });
    }
    setShowBadQuantity(true);
  };

  const normalizedAreas: AreaData[] = useMemo(
    () =>
      previousFlows.map((item: any) => ({
        supportsMaterial: blockSupportsMaterial(
          resolveBlockKey(item.area?.name ?? '')
        ),
        id: item.area?.id ?? item.id,
        name: item.area?.name ?? item.name ?? '',
        malas: item.malas ?? 0,
        defectuoso: item.defectuoso ?? 0,
        status: item.status ?? '',
        response: item.areaResponse ?? {},
        answers: item.answers ?? [],
        usuario: item.user?.username ?? '',
        auditor: '',
        buenas: 0,
        cqm: 0,
        excedente: 0,
        muestras: 0,
      })),
    [previousFlows]
  );

  const sumaBadQuantity = previousFlows.reduce((sum: any, flow: any) => {
    let bad = 0;

    if (flow.areaResponse?.hotStamping) {
      const hotStamping = flow.areaResponse.hotStamping;
      const hotStampingBad = hotStamping.bad_quantity || 0;
      const hotStampingMaterial = hotStamping.material_quantity || 0; // ← suma también este
      bad = hotStampingBad + hotStampingMaterial;
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
                <Label>Sin procesar:</Label>
                <Input
                  type="number"
                  name="excess_quantity"
                  value={inconformityValues.noprocess}
                  disabled
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
        <BadQuantityModal
          areas={normalizedAreas}
          areaBadQuantities={areaBadQuantities}
          setAreaBadQuantities={setAreaBadQuantities}
          onClose={() => setShowBadQuantity(false)}
        />
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
