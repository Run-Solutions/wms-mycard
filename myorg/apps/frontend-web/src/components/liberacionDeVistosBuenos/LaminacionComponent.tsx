'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import styled from 'styled-components';
import {
  submitExtraLaminacion,
  sendInconformidadCQM,
} from '@/api/recepcionCQM';
import { OperatorAdvancedTable } from './util/QuestionTable';
import SelectionQuestionTable from './util/FormQuestionTable';
import { WorkOrderHojasInfo } from './util/WorkOrderInfo';

interface Props {
  workOrder: any;
}
type Answer = {
  reviewed: boolean;
  sample_quantity: number;
  id?: number;
  FormAnswerResponse?: any[];
  finish_validation: string;
};

export default function LaminacionComponent({ workOrder }: Props) {
  const router = useRouter();

  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState<string>('');

  const [pruebaOver, setPruebaOver] = useState<string>('');
  const [pruebaCintaMagnetica, setPruebaCintaMagnetica] = useState<string>('');
  const [pruebaCentro, setPruebaCentro] = useState<string>('');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCodigoModal, setShowCodigoModal] = useState(false);
  const [codigoIngresado, setCodigoIngresado] = useState('');

  // ⚠️ Esto debería validarse en el backend. Evita hardcodear secretos en el cliente.
  const CODIGO_VALIDO = 'a7F9K3n1#';

  const parseNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Último FormAnswer NO revisado
  const index = workOrder?.answers
    ?.map((a: Answer, i: number) => ({ ...a, index: i }))
    .reverse()
    .find((a: Answer) => a.reviewed === false)?.index;

  const currentAnswer: Answer | undefined =
    typeof index === 'number' ? workOrder?.answers?.[index] : undefined;

  const formQuestions = workOrder?.area?.formQuestions ?? [];
  const visibleQuestions = formQuestions.filter((q: any) => q.role_id === 3);

  // Estado OK/NG por pregunta
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<number, boolean | undefined>
  >({});

  const checkedRespuestaOK = useMemo(
    () =>
      Object.entries(answersByQuestion)
        .filter(([, v]) => v === true)
        .map(([k]) => Number(k)),
    [answersByQuestion]
  );
  const checkedRespuestaNG = useMemo(
    () =>
      Object.entries(answersByQuestion)
        .filter(([, v]) => v === false)
        .map(([k]) => Number(k)),
    [answersByQuestion]
  );

  const handleToggleRespuesta = (
    questionId: number,
    _columnIndex: number,
    type: 'ok' | 'ng',
    checked: boolean
  ) => {
    setAnswersByQuestion((prev) => {
      const next = { ...prev };
      if (checked) {
        next[questionId] = type === 'ok'; // OK => true, NG => false
      } else {
        if (
          (type === 'ok' && next[questionId] === true) ||
          (type === 'ng' && next[questionId] === false)
        ) {
          delete next[questionId];
        }
      }
      return next;
    });
  };

  // Prevalidación: decide si pedir código o enviar
  // 👉 Nuevo helper: parsea num opcional (vacío/null -> null)
  const parseOptionalNum = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (s === '') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  // 👉 Ajusta esta utilidad si la tienes; maneja nulls
  const anyExtraBelow5 = (values: Array<number | null>): boolean =>
    values.some((v) => v !== null && v < 5);

  // Prevalidación: decide si pedir código o enviar
  const precheckAndSubmit = async () => {
    if (!currentAnswer) {
      alert('No hay respuestas pendientes por revisar.');
      return;
    }

    // Completar todas las preguntas visibles (checkboxes, etc.)
    const respondidas = visibleQuestions.filter(
      (q: any) => answersByQuestion[q.id] !== undefined
    ).length;
    if (respondidas !== visibleQuestions.length) {
      alert('Completa todas las preguntas y cantidad de muestra.');
      return;
    }

    // over y cinta siguen siendo requeridos (usan parseNum “duro”)
    const over = parseNum(pruebaOver);
    const cinta = parseNum(pruebaCintaMagnetica);

    // ✅ centro es opcional: vacío -> null (no participa a menos que tenga valor)
    const centro: any = parseOptionalNum(pruebaCentro);

    // Necesita código si alguno < 5; centro sólo cuenta si está presente
    const necesitaCodigo = anyExtraBelow5([over, cinta, centro]);

    // Si alguno < 5 y el código no es válido → pedir código
    if (necesitaCodigo && codigoIngresado !== CODIGO_VALIDO) {
      setShowCodigoModal(true);
      return;
    }

    await handleSubmit({ over, cinta, centro });
  };

  const qualityQuestionIds = useMemo(
    () =>
      (workOrder?.area?.formQuestions ?? [])
        .filter((q: any) => q.role_id === 3)
        .map((q: any) => q.id as number),
    [workOrder?.area?.formQuestions]
  );
  const handleSubmit = async (nums?: {
    over: number;
    cinta: number;
    centro: number;
  }) => {
    const formAnswerId = currentAnswer?.id; // id de FormAnswer
    if (!formAnswerId) {
      alert('No se encontró el ID del formulario.');
      return;
    }
    // 1) Validar que TODAS las preguntas de Calidad tengan respuesta booleana
    //    (evita null/undefined)
    const unansweredIds = qualityQuestionIds.filter(
      (qid: any) =>
        !(answersByQuestion[qid] === true || answersByQuestion[qid] === false)
    );

    if (unansweredIds.length > 0) {
      alert('Completa todas las preguntas.');
      return;
    }

    // 2) Construir el payload SOLO en el orden de las preguntas de Calidad
    //    (opcional: si quieres incluir también otras preguntas, mézclalas aquí)
    const checkboxPayload = qualityQuestionIds.map((qid: any) => ({
      question_id: qid,
      answer: answersByQuestion[qid] === true ? true : false, // ya está validado que es boolean
    }));

    const over = nums?.over ?? parseNum(pruebaOver);
    const cinta = nums?.cinta ?? parseNum(pruebaCintaMagnetica);
    const centro = nums?.centro ?? parseNum(pruebaCentro);

    const payload = {
      form_answer_id: formAnswerId,
      checkboxes: checkboxPayload,
      extra_data: {
        prueba_over: String(over),
        prueba_cinta_magnetica: String(cinta),
        prueba_centro: String(centro),
      },
      // Sugerido: incluir aquí un campo "exception_code" para que el backend lo valide
      // exception_code: codigoIngresado || undefined,
    };

    try {
      await submitExtraLaminacion(payload);
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

  // Si no hay respuesta pendiente, mensaje amigable
  if (!currentAnswer) {
    return (
      <Container>
        <Title>Área a evaluar: Laminación</Title>
        <WorkOrderHojasInfo workOrder={workOrder} />
        <NewData>
          <SectionTitle>No hay respuestas pendientes por revisar</SectionTitle>
          <p style={{ color: '#6b7280' }}>
            Todas las respuestas parecen estar revisadas.
          </p>
        </NewData>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Área a evaluar: Laminación</Title>

      <WorkOrderHojasInfo workOrder={workOrder} />

      <NewData>
        <SectionTitle>Respuestas del operador</SectionTitle>
        <NewDataWrapper>
          <OperatorAdvancedTable
            questions={formQuestions}
            answers={currentAnswer?.FormAnswerResponse ?? []}
            mode="doble"
            readOnly
            columns={['Respuesta']}
          />
          <InputGroup style={{ width: '50%' }}>
            <Label>Validar Acabado Vs Orden De Trabajo:</Label>
            <Input
              type="text"
              value={
                currentAnswer?.finish_validation ??
                ('No se reconoce la muestra enviada' as any)
              }
              readOnly
            />
          </InputGroup>
          <InputGroup style={{ width: '50%' }}>
            <Label>Muestras entregadas:</Label>
            <Input
              type="number"
              value={
                currentAnswer?.sample_quantity ??
                ('No se reconoce la muestra enviada' as any)
              }
              readOnly
            />
          </InputGroup>
        </NewDataWrapper>

        <SectionTitle>Mis respuestas</SectionTitle>
        <NewDataWrapper>
          <SelectionQuestionTable
            formQuestions={formQuestions}
            roleId={3}
            columns={['Respuesta']}
            checkedQuestions={[
              { ok: checkedRespuestaOK, ng: checkedRespuestaNG },
            ]}
            onToggle={handleToggleRespuesta}
          />
          <InputGroup style={{ width: '50%' }}>
            <Label>Prueba Over:</Label>
            <Input
              type="number"
              value={pruebaOver}
              onChange={(e) => setPruebaOver(e.target.value)}
            />
            <Label>Prueba Cinta Magnética:</Label>
            <Input
              type="number"
              value={pruebaCintaMagnetica}
              onChange={(e) => setPruebaCintaMagnetica(e.target.value)}
            />
            <Label>Prueba Centro (entre capas):</Label>
            <Input
              type="number"
              value={pruebaCentro}
              onChange={(e) => setPruebaCentro(e.target.value)}
            />
          </InputGroup>
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

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>¿Estás segura de aprobar?</ModalTitle>
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
                  precheckAndSubmit();
                }}
              >
                Sí, aprobar
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal de Inconformidad */}
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

      {/* Modal para código de excepción */}
      {showCodigoModal && (
        <ModalOverlay>
          <ModalBox>
            <h4>Ingresar código de excepción</h4>
            <h3>
              Alguno de los valores de pruebas es menor a 5. Ingresa el código
              para continuar.
            </h3>
            <Input
              type="text"
              value={codigoIngresado}
              onChange={(e) => setCodigoIngresado(e.target.value)}
              placeholder="Ingresa el código…"
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              <CancelButton
                onClick={() => {
                  setShowCodigoModal(false);
                  setCodigoIngresado('');
                }}
              >
                Cancelar
              </CancelButton>
              <ConfirmButton
                onClick={async () => {
                  if (codigoIngresado !== CODIGO_VALIDO) {
                    alert('Código inválido. Verifica e intenta nuevamente.');
                    return;
                  }
                  setShowCodigoModal(false);
                  await precheckAndSubmit();
                }}
              >
                Validar y aprobar
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
  display: flex; /* <- bug fix: era una coma */
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
