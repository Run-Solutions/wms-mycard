'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';

import {
  acceptWorkOrderFlowPersonalizacionAuditory,
  registrarInconformidadAuditory,
} from '@/api/aceptarAuditoria';

import WorkOrderInfo from './util/WorkOrderInfo';
import { AfterCorteData } from './CorteComponent';
import {
  buildDefaultValuesByArea,
  AreaBlock,
  DefaultValues,
  toNum,
} from './util/quantityWorkOrder';
import { getPrevAreaGoodPlusExcess } from './util/lastWorkOrder';
import BadQuantityModal from './util/BadQuantityModal';
import {
  blockSupportsMaterial,
  resolveBlockKey,
} from '../LiberarProducto/util/areaMappings';
import { calcularCantidadPorLiberarYParcial } from './util/calcularCantidadPorLiberar';
import type { AreaForBadQty } from '../LiberarProducto/util/BadQuantityModal';
import { normalizeAreaKey } from '../LiberarProducto/util/areaMappings';

interface Props {
  workOrder: any;
}

export default function PersonalizacionComponentAcceptAuditory({
  workOrder,
}: Props) {
  const router = useRouter();

  const isValidArea = (workOrder?.area_id ?? 0) >= 2;

  // -------- UI State --------
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState<string>('');

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

  // Solo lectura en esta pantalla
  const isDisabled = true;

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

  // Muestras del auditor
  const [sampleAuditory, setSampleQuantity] = useState<string>('');

  // Malas por área (modal)
  const [showBadQuantity, setShowBadQuantity] = useState(false);
  const [areaBadQuantities, setAreaBadQuantities] = useState<
    Record<string, string>
  >({});

  // ======= Derivados del flujo =======
  const flowList = useMemo(
    () => [...(workOrder?.workOrder?.flow ?? [])],
    [workOrder]
  );

  const currentIndex = useMemo(
    () => flowList.findIndex((item) => item?.id === workOrder?.id),
    [flowList, workOrder?.id]
  );

  const previousFlows = useMemo(
    () =>
      flowList.slice(0, currentIndex + 1).filter((flow) => flow.area_id !== 1),
    [flowList, currentIndex]
  );

  const areaKeyActual = useMemo(() => {
    const n = workOrder?.area?.name ?? '';
    return n.toLowerCase().replace(/\s/g, '');
  }, [workOrder?.area?.name]);

  const areaKey: AreaBlock = 'personalizacion';

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

  // 2) Precarga al montar / cambiar workOrder
  useEffect(() => {
    const initial = computeInitialBadQuantities();
    if (Object.keys(initial).length > 0) {
      setAreaBadQuantities(initial);
    }
  }, [computeInitialBadQuantities]);

  // 3) Al abrir el modal, sólo asegúrate que el estado esté al día y abre
  const handleOpenBadQuantityModal = () => {
    const initial = computeInitialBadQuantities();
    if (Object.keys(initial).length > 0) {
      setAreaBadQuantities(initial);
    }
    setShowBadQuantity(true);
  };

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

  const lastCompletedOrPartial = useMemo(
    () => (currentIndex > 0 ? flowList[currentIndex - 1] : null),
    [flowList, currentIndex]
  );

  const prevAreaSum = useMemo(
    () => getPrevAreaGoodPlusExcess(workOrder),
    [workOrder]
  );
  console.log('prevAreaSum', prevAreaSum);

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
  
  const { cantidadPorLiberar, lastValidatedPartial } = useMemo(
    () => calcularCantidadPorLiberarYParcial(workOrder, lastCompletedOrPartial),
    [workOrder, lastCompletedOrPartial]
  );

  console.log('Cantidad por liberar', cantidadPorLiberar)
  console.log('Cantidad total', defaultValues.total_quantity);

  const handleOpenModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const partialsActual = workOrder?.partialReleases ?? [];

    if (!sampleAuditory) {
      alert('Por favor, asegurate de ingresar muestras.');
      return;
    } else if (
      ((defaultValues.total_quantity ?? 0) + Number(sampleAuditory) >
        prevAreaSum &&
        workOrder?.areaResponse?.personalizacion) ||
      (defaultValues.total_quantity ?? 0) + Number(sampleAuditory) > prevAreaSum
    ) {
      alert(
        `La cantidad total a liberar ${
          (defaultValues.total_quantity ?? 0) + Number(sampleAuditory)
        } es mayor a la entregada por parte del área previa ${
          defaultValues.total_quantity
        }.`
      );
      return;
    } else if (
      partialsActual.length > 0 &&
      lastValidatedPartial !== null &&
      (Number(defaultValues.total_quantity ?? 0) +
        Number(sampleAuditory) +
        Number(defaultValues.noprocess_quantity ?? 0)) !== cantidadPorLiberar // <- ahora viene del useMemo
    ) {
      alert(
        `La cantidad total a liberar ${
          (defaultValues.total_quantity ?? 0) + Number(sampleAuditory)
        } es diferente a la entregada por parte del la parcialidad previa ${
          cantidadPorLiberar
        }.`
      );
      return;
    }

    setShowConfirm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const personalizacionId =
      workOrder?.areaResponse?.personalizacion?.id ?? workOrder?.id;
    try {
      await acceptWorkOrderFlowPersonalizacionAuditory(
        personalizacionId,
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
      await registrarInconformidadAuditory(workOrder?.id, inconformidad.trim());
      router.push('/aceptarAuditoria');
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  };

  // ======= Render =======
  if (!isValidArea) {
    return (
      <Container>
        <Title>Área no reconocida</Title>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Área: {workOrder?.area?.name || 'No definida'}</Title>
      <WorkOrderInfo workOrder={workOrder} />

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

            <Label>Sin procesar:</Label>
            <Input
              type="number"
              name="noprocess_quantity"
              value={defaultValues.noprocess_quantity}
              disabled
            />

            <Label>Muestras en CQM:</Label>
            <Input
              type="number"
              name="cqm_quantity"
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

      <AceptarButton onClick={handleOpenModal}>
        Aceptar recepción del producto
      </AceptarButton>

      {/* Modal para marcar malas por áreas previas */}
      {showBadQuantity && (
        <BadQuantityModal
          areas={normalizedAreas}
          areaBadQuantities={areaBadQuantities}
          setAreaBadQuantities={setAreaBadQuantities}
          onClose={() => setShowBadQuantity(false)}
        />
      )}

      {/* Modal confirmación */}
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

      {/* Modal inconformidad */}
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

// =================== Styled Components ===================

const Container = styled.div`
  padding: 2rem;
  margin-top: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const NewData = styled.div``;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const Label = styled.label`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.primary};
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
