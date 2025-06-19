'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  acceptWorkOrderFlowColorEdgeAuditory,
  registrarInconformidadAuditory,
} from '@/api/aceptarAuditoria';

// Define un tipo para los valores del formulario
type ColorEdgeData = {
  good_quantity: number;
  bad_quantity: number;
  excess_quantity: number;
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

export default function ColorEdgeComponentAcceptAuditory({ workOrder }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState<string>('');

  // Estado para saber si los valores han sido modificados y para habilitar o deshabilitar el botón
  const [isDisabled, setIsDisabled] = useState(true);

  const [sampleAuditory, setSampleQuantity] = useState('');

  if (workOrder.area_id >= 2) {
    // Estados tipados para los valores predeterminados y actuales
    const [defaultValues, setDefaultValues] = useState<ColorEdgeData>({
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

      const colorEdge = workOrder.areaResponse?.colorEdge;
      const partials = workOrder.partialReleases;

      const allValidated =
        partials.length > 0 && partials.every((p: any) => p.validated);

      if (colorEdge && partials.length === 0) {
        // Caso original: hay empalme pero no hay parciales
        const vals: ColorEdgeData = {
          good_quantity: colorEdge.good_quantity || '',
          bad_quantity: colorEdge.bad_quantity || '',
          excess_quantity: colorEdge.excess_quantity || '',
          cqm_quantity: cqm_quantity || '',
          comments: colorEdge.comments || '',
        };
        setDefaultValues(vals);
      } else if (colorEdge && allValidated) {
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
        const restante = (colorEdge.good_quantity || 0) - totalParciales;
        const restantebad = (colorEdge.bad_quantity || 0) - totalParcialesbad;
        const restanteexc =
          (colorEdge.excess_quantity || 0) - totalParcialesexec;

        const vals: ColorEdgeData = {
          good_quantity: restante > 0 ? restante : 0,
          bad_quantity: restantebad > 0 ? restantebad : 0,
          excess_quantity: restanteexc > 0 ? restanteexc : 0,
          cqm_quantity: cqm_quantity || '',
          comments: '', // puedes ajustar si quieres comentarios por defecto
        };
        setDefaultValues(vals);
      } else {
        // Caso original: se busca el primer parcial sin validar
        const firstUnvalidatedPartial = partials.find((p: any) => !p.validated);

        const vals: ColorEdgeData = {
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
        alert('Por favor, asegurate de ingresar muestras.');
        return;
      }
      // Envío siempre colorEdge.id si existe; si no, workOrder.id
      const ColorEdgeId =
        workOrder?.areaResponse?.colorEdge?.id ?? workOrder.id;
      try {
        await acceptWorkOrderFlowColorEdgeAuditory(ColorEdgeId, sampleAuditory);
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
                value={defaultValues.bad_quantity}
                disabled
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
