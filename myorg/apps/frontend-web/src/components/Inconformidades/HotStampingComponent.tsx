'use client';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { acceptHotStampingInconformity } from '@/api/inconformidades';
import {
  blockSupportsMaterial,
  resolveBlockKey,
} from '../LiberarProducto/util/areaMappings';
import type { AreaForBadQty } from '../LiberarProducto/util/BadQuantityModal';
import { normalizeAreaKey } from '../LiberarProducto/util/areaMappings';
import { AfterCorteData } from '../AceptarAuditoria/CorteComponent';
import {
  buildDefaultValuesByArea,
  DefaultValues,
  AreaBlock,
  toNum,
} from '../AceptarAuditoria/util/quantityWorkOrder';
import BadQuantityModal from '../AceptarAuditoria/util/BadQuantityModal';

interface Props {
  workOrder: any;
}
interface PartialRelease {
  quantity: string;
  observations: string;
  validated: boolean;
  work_order_flow_id: number;
  inconformities: any[];
}

export default function HotStampingComponent({ workOrder }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<
    Record<string, string>
  >({});
  const [defaultValues, setDefaultValues] = useState<AfterCorteData>({
    good_quantity: '',
    bad_quantity: '',
    excess_quantity: '',
    noprocess_quantity: '',
    cqm_quantity: '',
    comments: '',
    total_quantity: 0,
    total_execbuen: 0,
  });

  const asStrNum = (v: unknown): string | number => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 1 : 0;
    return v as string | number; // ya restringimos los otros casos
  };
  const toAfterCorteData = (
    d: DefaultValues,
    prev?: AfterCorteData
  ): AfterCorteData => {
    return {
      ...(prev ?? ({} as AfterCorteData)),

      good_quantity: asStrNum(d.good_quantity),
      bad_quantity: asStrNum(d.bad_quantity),
      excess_quantity: asStrNum(d.excess_quantity),
      noprocess_quantity: asStrNum(d.noprocess_quantity),
      cqm_quantity: asStrNum(d.cqm_quantity),

      comments: (d.comments ?? '') as string,
      total_quantity: d.total_quantity ?? 0,

      // Si quieres otro criterio, cámbialo aquí
      total_execbuen: toNum(d.good_quantity),
    };
  };

  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    // Si hay parcialidad sin validar, usar esa
    const partialRelease = workOrder.partialReleases.find(
      (release: PartialRelease) => !release.validated
    );

    // Si no hay parcialidad sin validar, usar areaResponse
    const areaResponseFlowId = workOrder.areaResponse
      ? workOrder.areaResponse.work_order_flow_id
      : partialRelease?.work_order_flow_id;

    console.log(areaResponseFlowId);
    try {
      await acceptHotStampingInconformity(areaResponseFlowId);
      router.push('/liberarProducto');
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  };

  // Obtener la última parcialidad sin validar
  const lastPartialRelease = workOrder.partialReleases.find(
    (release: PartialRelease) => !release.validated
  );

  const flowList = useMemo(
    () => [...(workOrder?.workOrder?.flow ?? [])],
    [workOrder]
  );

  const currentIndex = useMemo(
    () => flowList.findIndex((item) => item?.id === workOrder?.id),
    [flowList, workOrder?.id]
  );
  console.log('flow', currentIndex);

  const previousFlows = useMemo(
    () =>
      flowList.slice(0, currentIndex + 1).filter((flow) => flow.area_id !== 1),
    [flowList, currentIndex]
  );

  const normalizedAreas: AreaForBadQty[] = useMemo(
    () =>
      previousFlows.map((item) => ({
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
  console.log(defaultValues.total_quantity);

  const areaKey: AreaBlock = 'hotStamping';

  const sumaBadQuantity = useMemo(() => {
    if (!Array.isArray(normalizedAreas) || normalizedAreas.length === 0)
      return 0;

    return normalizedAreas.reduce((acc, area) => {
      const key = normalizeAreaKey(area.name);
      const bad = Number(areaBadQuantities[`${key}_bad`] ?? 0);
      const mat = area.supportsMaterial
        ? Number(areaBadQuantities[`${key}_material`] ?? 0)
        : 0;
      return acc + bad + mat;
    }, 0);
  }, [normalizedAreas, areaBadQuantities]);

  useEffect(() => {
    const result = buildDefaultValuesByArea(
      areaKey,
      workOrder,
      sumaBadQuantity,
      {
        // filterPartialsByArea: (p) => p.area === areaKey
      }
    );

    if (result) {
      setDefaultValues((prev) => toAfterCorteData(result, prev)); //
    }
  }, [workOrder, sumaBadQuantity]);

  const inconformityList = lastPartialRelease
    ? lastPartialRelease.inconformities
    : workOrder.areaResponse?.inconformities || [];

  const lastUnreviewedInconformity = [...inconformityList]
    .reverse()
    .find((i) => i.reviewed === false);

  const inconformityUser = lastUnreviewedInconformity?.user.username;
  const inconformityComments = lastUnreviewedInconformity?.comments;

  const computeInitialBadQuantities = useCallback(() => {
    const initialValues: Record<string, string> = {};
    const makeAreaKey = (name?: string) =>
      (name ?? '').toLowerCase().replace(/\s/g, '');

    previousFlows.forEach((flow) => {
      (flow?.badQuantityDetails ?? []).forEach((detail: any) => {
        // OJO: usa siempre el mismo campo para el área actual (consistencia)
        // Si tu objeto tiene area_id, úsalo; si no, usa workOrder?.area?.id
        const currentAreaId = workOrder?.area_id ?? workOrder?.area?.id;
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
  }, [previousFlows, workOrder?.area_id, workOrder?.area?.id]);

  useEffect(() => {
    const initial = computeInitialBadQuantities();
    if (Object.keys(initial).length > 0) {
      setAreaBadQuantities(initial);
    }
  }, [computeInitialBadQuantities]);

  const handleOpenBadQuantityModal = () => {
    const initial = computeInitialBadQuantities();
    if (Object.keys(initial).length > 0) {
      setAreaBadQuantities(initial);
    }
    setShowBadQuantity(true);
  };

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

                <Label>Sin procesar:</Label>
                <Input
                  type="number"
                  name="noprocess_quantity"
                  value={defaultValues.noprocess_quantity}
                  disabled
                />
              </InputGroup>
            </NewDataWrapper>
            <InputGroup>
              <Label>Comentarios</Label>
              <Textarea value={defaultValues.comments} disabled />
            </InputGroup>
          </NewData>
        </Container>
        <Container>
          <NewData>
            <SectionTitle>Inconformidad:</SectionTitle>
            <InputGroup>
              <Label>Respuesta de Usuario</Label>
              <Input type="text" value={inconformityUser} disabled />
            </InputGroup>
            <InputGroup>
              <Label>Comentarios</Label>
              <Textarea value={inconformityComments} disabled />
            </InputGroup>
          </NewData>
        </Container>
      </FlexContainer>
      <CloseButton onClick={openModal}>Aceptar Inconformidad</CloseButton>
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
  min-width: 300px;
  max-width: 600px;
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
