'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import styled from 'styled-components';
import {
  submitExtraPersonalizacion,
  sendInconformidadCQM,
} from '@/api/recepcionCQM';
import { CheckedState } from './util/MachineSectionEdit';
import { OperatorAdvanceMachineTable } from './util/MachineSection';
import { MachineSectionEdit } from './util/MachineSectionEdit';
import WorkOrderInfo from './util/WorkOrderInfo';

interface Props {
  workOrder: any;
}
type Answer = {
  reviewed: boolean;
  sample_quantity: number;
  id?: number;
  tipo_personalizacion?: string;
  FormAnswerResponse?: [];
  color_personalizacion?: string;
  codigo_barras?: string;
};

export default function PersonalizacionComponent({ workOrder }: Props) {
  const router = useRouter();

  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState<string>('');

  // Para obtener el último FormAnswer NO revisado
  const index = workOrder?.answers
    ?.map((a: Answer, i: number) => ({ ...a, index: i }))
    .reverse()
    .find((a: Answer) => a.reviewed === false)?.index;

  // Para mostrar formulario de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Resumen seguro del answer actual
  const currentAnswer: Answer | undefined =
    typeof index === 'number' ? workOrder?.answers?.[index] : undefined;

  // Derivados seguros
  const tipoPersonalizacion = currentAnswer?.tipo_personalizacion;
  const formQuestions = workOrder?.area?.formQuestions ?? [];

  // Selección de preguntas por tipo (con guard de formQuestions)
  let selectedQuestions: { id: number; role_id: number | null }[] = [];
  if (tipoPersonalizacion === 'laser') {
    selectedQuestions = formQuestions.slice(9, 13);
  } else if (tipoPersonalizacion === 'persos') {
    selectedQuestions = formQuestions.slice(13, 17);
  }
  const qualityQuestionIds = useMemo(
    () =>
      selectedQuestions
        .filter((q) => q.role_id === 3)
        .map((q) => q.id as number),
    [selectedQuestions]
  );

  // Para guardar las respuestas (solo role_id === 3)
  const [responses, setResponses] = useState<
    { questionId: number; answer: boolean }[]
  >([]);

  const [cargaAplicacion, setCargaAplicacion] = useState('');
  const [verificarScript, setVerificarScript] = useState('');
  const [validarKVC, setValidarKVC] = useState('');
  const [aparienciaQuemado, setAparienciaQuemado] = useState('');

  // Para controlar qué preguntas están marcadas
  const [checkedQuestions, setCheckedQuestions] = useState<CheckedState[]>([
    { ok: [], ng: [] },
  ]);

  const handleCheckToggle = (
    id: number,
    colIndex: number,
    type: 'ok' | 'ng',
    checked: boolean
  ) => {
    setCheckedQuestions((prev) => {
      const next = [...prev];
      if (!next[colIndex]) next[colIndex] = { ok: [], ng: [] };

      const current = next[colIndex];

      // Conjuntos para manipular sin duplicados
      const setOk = new Set<number>(current.ok);
      const setNg = new Set<number>(current.ng);

      if (type === 'ok') {
        if (checked) {
          setOk.add(id);
          setNg.delete(id); // exclusión mutua
        } else {
          setOk.delete(id);
        }
      } else {
        if (checked) {
          setNg.add(id);
          setOk.delete(id); // exclusión mutua
        } else {
          setNg.delete(id);
        }
      }

      next[colIndex] = { ok: Array.from(setOk), ng: Array.from(setNg) };
      return next;
    });

    // Mantener responses consistente con los checks
    setResponses((prev) =>
      prev.map((r) => {
        if (r.questionId !== id) return r;
        // Si se marca OK => answer=true; si se marca NG => answer=false
        // Si se desmarca cualquiera => answer=false
        if (!checked) return { ...r, answer: false };
        return { ...r, answer: type === 'ok' };
      })
    );
  };
  const answeredIdsSet = useMemo(() => {
    const ok = new Set<number>(checkedQuestions?.[0]?.ok ?? []);
    const ng = new Set<number>(checkedQuestions?.[0]?.ng ?? []);
    return new Set<number>([...ok, ...ng]); // respondida si está en OK o NG
  }, [checkedQuestions]);
  const handleSubmit = async () => {
    const formAnswerId = currentAnswer?.id; // id de FormAnswer
    if (!formAnswerId) {
      alert('No se encontró el ID del formulario.');
      return;
    }
    // Si no hay preguntas de calidad para este tipo, permitimos aprobar
    if (qualityQuestionIds.length === 0) {
      try {
        await submitExtraPersonalizacion({ form_answer_id: formAnswerId });
        router.push('/liberacionDeVistosBuenos');
      } catch (error) {
        console.log('Error al guardar la respuesta: ', error);
      }
      return;
    }

    // Validar que TODAS las preguntas de Calidad estén respondidas
    const unanswered = qualityQuestionIds.filter(
      (id) => !answeredIdsSet.has(id)
    );
    if (unanswered.length > 0) {
      alert(
        `Debes responder todas las preguntas de Calidad (${
          unanswered.length
        } pendiente${unanswered.length > 1 ? 's' : ''}).`
      );
      return;
    }

    // Construir checkboxes en el MISMO orden que qualityQuestionIds
    const okSet = new Set<number>(checkedQuestions?.[0]?.ok ?? []);
    const ngSet = new Set<number>(checkedQuestions?.[0]?.ng ?? []);

    const checkboxPayload = qualityQuestionIds.map((qid) => ({
      question_id: qid,
      answer: okSet.has(qid) ? true : ngSet.has(qid) ? false : false, // el 'false' final no se usará porque ya validamos
    }));

    const basePayload = {
      form_answer_id: formAnswerId,
    };

    let aditionalFields: Record<string, any> = {};

    if (tipoPersonalizacion === 'laser') {
      const checkboxPayload = responses.map(({ questionId, answer }) => ({
        question_id: questionId,
        answer,
      }));
      aditionalFields = {
        verificar_script: verificarScript,
        validar_kvc_perso: validarKVC,
        apariencia_quemado: aparienciaQuemado,
        checkboxes: checkboxPayload,
      };
    } else if (tipoPersonalizacion === 'persos') {
      const checkboxPayload = responses.map(({ questionId, answer }) => ({
        question_id: questionId,
        answer,
      }));
      aditionalFields = {
        carga_aplicacion: cargaAplicacion,
        checkboxes: checkboxPayload,
      };
    } else if (tipoPersonalizacion === 'etiquetadora') {
      aditionalFields = {};
    }

    const payload = {
      ...basePayload,
      ...aditionalFields,
    };

    try {
      await submitExtraPersonalizacion(payload);
      router.push('/liberacionDeVistosBuenos');
    } catch (error) {
      console.log('Error al guardar la respuesta: ', error);
    }
  };

  const handleSubmitInconformidad = async () => {
    if (!inconformidad.trim()) {
      alert('Debes ingresar una inconformidad antes de continuar.');
      return;
    }
    try {
      await sendInconformidadCQM(workOrder?.id, inconformidad);
      router.push('/liberacionDeVistosBuenos');
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  };

  // Si no hay answer pendiente por revisar, mostramos mensaje y salimos.
  if (!currentAnswer) {
    return (
      <Container>
        <Title>Área a evaluar: Personalizacion</Title>
        <WorkOrderInfo workOrder={workOrder} />
        <NewData>
          <SectionTitle>No hay respuestas pendientes por revisar</SectionTitle>
          <p style={{ color: '#6b7280' }}>
            Todas las respuestas parecen estar revisadas. Vuelve a esta pantalla
            cuando exista una nueva respuesta del operador.
          </p>
        </NewData>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Área a evaluar: Personalizacion</Title>

      <WorkOrderInfo workOrder={workOrder} />

      <NewData>
        <SectionTitle>Respuestas del operador</SectionTitle>
        <NewDataWrapper>
          <InputGroup style={{ paddingTop: '5px', width: '70%' }}>
            <Label>Tipo de Personalizacion:</Label>
            <Input
              type="text"
              value={
                currentAnswer.tipo_personalizacion ??
                'No se reconoce la muestra enviada'
              }
              readOnly
            />
          </InputGroup>

          {tipoPersonalizacion === 'laser' && (
            <>
              <InputGroup style={{ width: '70%' }}>
                <Label>Muestras entregadas:</Label>
                <Input
                  type="number"
                  value={
                    currentAnswer.sample_quantity ??
                    'No se reconoce la muestra enviada'
                  }
                  readOnly
                />
              </InputGroup>
            </>
          )}

          {tipoPersonalizacion === 'persos' && (
            <>
              <OperatorAdvanceMachineTable
                visible
                machine="Personalización"
                title=""
                questions={formQuestions}
                areaId={10}
                questionSlice={[1, 10]}
                answers={currentAnswer?.FormAnswerResponse ?? []}
                extras={
                  <InputGroup style={{ width: '70%' }}>
                    <Label>Color De Personalización:</Label>
                    <Input
                      type="text"
                      value={
                        currentAnswer?.color_personalizacion ??
                        'No se reconoce la muestra enviada'
                      }
                      readOnly
                    />
                    <Label>Tipo de Código de Barras Que Se Personaliza:</Label>
                    <Input
                      type="text"
                      value={
                        currentAnswer?.codigo_barras ??
                        'No se reconoce la muestra enviada'
                      }
                      readOnly
                    />
                    <Label>Muestras entregadas:</Label>
                    <Input
                      type="number"
                      value={
                        currentAnswer?.sample_quantity ??
                        'No se reconoce la muestra enviada'
                      }
                      readOnly
                    />
                  </InputGroup>
                }
              />
            </>
          )}

          {tipoPersonalizacion === 'etiquetadora' && (
            <>
              <OperatorAdvanceMachineTable
                visible
                machine="etiquetadora"
                title=""
                questions={formQuestions}
                areaId={10}
                questionSlice={[0, 1]}
                answers={currentAnswer?.FormAnswerResponse ?? []}
                extras={
                  <InputGroup style={{ width: '70%' }}>
                    <Label>
                      Verificar Tipo De Etiqueta Vs Ot Y Pegar Utilizada:
                    </Label>
                    <Input
                      type="text"
                      value={
                        (currentAnswer as any)?.verificar_etiqueta ??
                        'No se reconoce la muestra enviada'
                      }
                      readOnly
                    />
                    <Label>Muestras entregadas:</Label>
                    <Input
                      type="number"
                      value={
                        currentAnswer?.sample_quantity ??
                        'No se reconoce la muestra enviada'
                      }
                      readOnly
                    />
                  </InputGroup>
                }
              />
            </>
          )}

          {tipoPersonalizacion === 'packsmart' && (
            <>
              <OperatorAdvanceMachineTable
                visible
                machine="packsmart"
                title=""
                questions={formQuestions}
                areaId={10}
                questionSlice={[14, 20]}
                answers={currentAnswer?.FormAnswerResponse ?? []}
                extras={
                  <InputGroup style={{ width: '70%' }}>
                    <Label>Muestras entregadas:</Label>
                    <Input
                      type="number"
                      value={
                        currentAnswer?.sample_quantity ??
                        'No se reconoce la muestra enviada'
                      }
                      readOnly
                    />
                  </InputGroup>
                }
              />
            </>
          )}

          {tipoPersonalizacion === 'otto' && (
            <>
              <OperatorAdvanceMachineTable
                visible
                machine="otto"
                title=""
                questions={formQuestions}
                areaId={10}
                questionSlice={[20, 28]}
                answers={currentAnswer?.FormAnswerResponse ?? []}
                extras={
                  <InputGroup style={{ width: '70%' }}>
                    <Label>Muestras entregadas:</Label>
                    <Input
                      type="number"
                      value={
                        currentAnswer?.sample_quantity ??
                        'No se reconoce la muestra enviada'
                      }
                      readOnly
                    />
                  </InputGroup>
                }
              />
            </>
          )}

          {tipoPersonalizacion === 'embolsadora' && (
            <>
              <OperatorAdvanceMachineTable
                visible
                machine="embolsadora"
                title=""
                questions={formQuestions}
                areaId={10}
                questionSlice={[28, 30]}
                answers={currentAnswer?.FormAnswerResponse ?? []}
                extras={
                  <InputGroup style={{ width: '70%' }}>
                    <Label>Muestras entregadas:</Label>
                    <Input
                      type="number"
                      value={
                        currentAnswer?.sample_quantity ??
                        'No se reconoce la muestra enviada'
                      }
                      readOnly
                    />
                  </InputGroup>
                }
              />
            </>
          )}
        </NewDataWrapper>

        <SectionTitle>Mis respuestas</SectionTitle>
        <NewDataWrapper>
          {tipoPersonalizacion === 'laser' && (
            <>
              <MachineSectionEdit
                visible={true}
                title=""
                questions={formQuestions}
                roleId={3}
                questionSlice={[9, 13]}
                checkedQuestions={checkedQuestions}
                onCheckToggle={handleCheckToggle}
                extras={
                  <InputGroup style={{ width: '70%' }}>
                    <Label>
                      Verificar Script / Layout Vs Ot / Autorizacion:
                    </Label>
                    <Input
                      type="text"
                      placeholder="Ej: "
                      value={verificarScript}
                      onChange={(e) => setVerificarScript(e.target.value)}
                    />
                    <Label>
                      Validar, Anotar KVC (Llaves), Carga de Aplicación o
                      Prehabilitación:
                    </Label>
                    <Input
                      type="text"
                      placeholder="Ej: "
                      value={validarKVC}
                      onChange={(e) => setValidarKVC(e.target.value)}
                    />
                    <Label>
                      Describir Apariencia Del Quemado Del Laser (Color):
                    </Label>
                    <Input
                      type="text"
                      placeholder="Ej: "
                      value={aparienciaQuemado}
                      onChange={(e) => setAparienciaQuemado(e.target.value)}
                    />
                  </InputGroup>
                }
              />
            </>
          )}

          {tipoPersonalizacion === 'persos' && (
            <>
              <MachineSectionEdit
                visible={true}
                title=""
                questions={formQuestions}
                roleId={3}
                questionSlice={[13, 15]}
                checkedQuestions={checkedQuestions}
                onCheckToggle={handleCheckToggle}
                extras={
                  <InputGroup style={{ width: '70%' }}>
                    <Label>Validar Carga De Aplicación (PersoMaster)</Label>
                    <Input
                      type="text"
                      placeholder="Ej: "
                      value={cargaAplicacion}
                      onChange={(e) => setCargaAplicacion(e.target.value)}
                    />
                  </InputGroup>
                }
              />
            </>
          )}

          {(tipoPersonalizacion === 'etiquetadora' ||
            tipoPersonalizacion === 'otto' ||
            tipoPersonalizacion === 'packsmart' ||
            tipoPersonalizacion === 'embolsadora') && (
            <>
              <InputGroup style={{ paddingTop: '10px', width: '70%' }}>
                <Label>No tienes preguntas</Label>
              </InputGroup>
            </>
          )}
        </NewDataWrapper>
      </NewData>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <RechazarButton onClick={() => setShowInconformidad(true)}>
          Rechazar
        </RechazarButton>
        <AceptarButton onClick={() => setShowConfirmModal(true)}>
          Aprobado
        </AceptarButton>
      </div>

      {showConfirmModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>¿Estás seguro/a de aprobar?</ModalTitle>
            <ModalActions>
              <Button
                style={{ backgroundColor: '#BBBBBB' }}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit();
                }}
              >
                Sí, aprobar
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {showInconformidad && (
        <ModalOverlay>
          <ModalBox>
            <h4>Registrar Inconformidad</h4>
            <h3>
              Por favor, describe la inconformidad detectada con las respuestas
              entregadas.
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
  color: #1f2937;
`;

const NewData = styled.div``;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: #374151;
`;

const Label = styled.label`
  font-weight: 600;
  color: #6b7280;
  width: 50%;
`;

const NewDataWrapper = styled.div`
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  width: 100%;
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
    border-color: #0038a8;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
  font-size: 1rem;
  resize: vertical;

  &:focus {
    border-color: #0038a8;
    outline: none;
  }
`;

const AceptarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 1.5rem;
  background-color: #0038a8;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: flex;
  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #1d4ed8;
    outline: none;
  }
`;

const RechazarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 1.5rem;
  background-color: #bbbbbb;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: block;
  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #a0a0a0;
    outline: none;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  color: black;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 400px;
  text-align: center;
`;

const ModalTitle = styled.h3`
  margin-bottom: 1rem;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: #005bb5;
  }
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
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
