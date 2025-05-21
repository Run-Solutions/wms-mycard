'use client'

import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

interface Props {
  workOrder: any;
}
type Answer = {
  reviewed: boolean;
  sample_quantity: number;
  // lo que más tenga...
};

export default function CorteComponent({ workOrder }: Props) {
  const router = useRouter();
  const [testTypes, SetTestTypes] = useState('');
  const [showInconformidad, setShowInconformidad] = useState(false);
  const [inconformidad, setInconformidad] = useState<string>('');

  // Para obtener el ultimo FormAnswer 
  const index = workOrder?.answers
  ?.map((a: Answer, i: number) => ({ ...a, index: i }))
  .reverse().find((a: Answer) => a.reviewed === false)?.index;
  console.log('el index', index);

  // Para mostrar formulario de CQM y enviarlo
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  //Para guardar las respuestas 
  const [responses, setResponses] = useState<{questionId: number, answer: boolean}[]>(
    workOrder.area.formQuestions
      .filter((question: {role_id: number | null}) => question.role_id === 3)
      .map((question: {id: number}) => ({
        questionId: question.id,
        answer: false
      }))
  );
  const [color, setColor] = useState('');
  const [holographicType, setHolographicType] = useState('');
  const [magneticBandType, setMagneticBandType] = useState('');
  const [trackType, setTrackType] = useState('');

  // Para controlar qué preguntas están marcadas
  const [checkedQuestions, setCheckedQuestions] = useState<number[]>([]);
  const handleCheckboxChange = (questionId: number, isChecked: boolean) => {
    setResponses(prevResponses => 
      prevResponses.map(response =>
        response.questionId === questionId 
          ? {...response, answer: isChecked}
          : response
      )
    );
  
    // Actualizar visualmente el checkbox
    setCheckedQuestions(prev =>
      isChecked ? [...prev, questionId] : prev.filter(id => id !== questionId)
    );
  };

  
  const handleSubmit = async () => {
    const formAnswerId = workOrder.answers[index]?.id; // id de FormAnswer
    if (!formAnswerId) {
      alert("No se encontró el ID del formulario.");
      return;
    }
    const checkboxPayload = responses.map(({ questionId, answer }) => ({
      question_id: questionId,
      answer: answer,     
    }));
    const payload = {
      form_answer_id: formAnswerId,
      checkboxes: checkboxPayload,
      radio: {
        magnetic_band: magneticBandType,
        track_type: trackType,
      },
      extra_data: {
        color: color,
        holographic_type: holographicType,
      }
    };
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No hay token de autenticación");
        return;
      }
      const res = await fetch("http://localhost:3000/free-order-cqm/form-extra-seri", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Error en el servidor:", data);
        return;
      }
      router.push("/recepcionCqm");
    } catch (error) {
      console.log("Error al guardar la respuesta: ", error);
    }
  };
  
  const handleSubmitInconformidad = async () => {
    const token = localStorage.getItem('token');
    console.log(inconformidad);
    const formAnswer = workOrder.id;
    console.log('el form answer', formAnswer);
    try {
      const res = await fetch(`http://localhost:3000/work-order-flow/${formAnswer}/inconformidad-cqm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({inconformidad}),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/recepcionCqm');
      }
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  }

  return (
    <Container>
      <Title>Área a evaluar: Corte</Title>

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
          <Value>{workOrder.workOrder.quantity}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Operador:</Label>
          <Value>{workOrder.user.username}</Value>
        </InfoItem>
        <InfoItem>
          <Label>Comentarios:</Label>
          <Value>{workOrder.workOrder.comments}</Value>
        </InfoItem>
      </DataWrapper>

      <NewData>
        <SectionTitle>Respuestas del operador</SectionTitle>
        <NewDataWrapper>
          <Table>
            <thead>
              <tr>
                <th>Pregunta</th>
                <th>Respuesta</th>
              </tr>
            </thead>
            <tbody>
              {workOrder.area.formQuestions
              .filter((question: { role_id: number | null }) => question.role_id === null)
              .map((question: { id: number; title: string }) => {
                // Buscar la respuesta correspondiente a esta pregunta
                const answer = workOrder.answers[index]?.FormAnswerResponse?.find(
                  (resp: any) => resp.question_id === question.id
                );
                
                // Obtener la respuesta del operador (response_operator)
                const operatorResponse = answer?.response_operator;

                return (
                  <tr key={question.id}>
                    <td>{question.title}</td>
                    <td>
                      {typeof operatorResponse === 'boolean' ? (
                        <input 
                          type="checkbox" 
                          checked={operatorResponse} 
                          disabled 
                        />
                      ) : (
                        <span>{operatorResponse !== undefined && operatorResponse !== null 
                          ? operatorResponse.toString() 
                          : ''}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <InputGroup style={{ width: '50%'}}>
              <Label>Muestras entregadas:</Label>
              <Input type="number" value={workOrder?.answers[index].sample_quantity ?? 'No se reconoce la muestra enviada' } readOnly />
          </InputGroup>
        </NewDataWrapper>
        
        <SectionTitle>Mis respuestas</SectionTitle>
        <NewDataWrapper>
          <Table>
            <thead>
              <tr>
                <th>Pregunta</th>
                <th>Respuesta</th>
              </tr>
            </thead>
            <tbody>
              {workOrder.area.formQuestions
              .filter((question: { role_id: number | null }) => question.role_id === 3)
              .map((question: { id: number; title: string }) => {
                // Buscar la respuesta correspondiente a esta pregunta
                const answer = workOrder.answers[index]?.FormAnswerResponse?.find(
                  (resp: any) => resp.question_id === question.id
                );
                return (
                  <tr key={question.id}>
                    <td>{question.title}</td>
                    <td>
                      <input type="checkbox" checked={checkedQuestions.includes(question.id)} onChange={(e) => handleCheckboxChange(question.id, e.target.checked)}/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </NewDataWrapper>
      </NewData>
      <div style={{ display: 'flex', gap: '1rem'}}>
      <RechazarButton onClick={() => setShowInconformidad(true)}>Rechazar</RechazarButton>
      <AceptarButton onClick={() => setShowConfirmModal(true)}>Aprobado</AceptarButton>
      </div>
      {showConfirmModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>¿Estás segura de aprobar?</ModalTitle>
            <ModalActions>
              <Button style={{   backgroundColor: '#BBBBBB'}} onClick={() => setShowConfirmModal(false)}>Cancelar</Button>
              <Button onClick={() => {
                setShowConfirmModal(false);
                handleSubmit();
              }}>Sí, aprobar</Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
      {showInconformidad && (
          <ModalOverlay>
            <ModalBox>
              <h4>Registrar Inconformidad</h4>
              <h3>Por favor, describe la inconformidad detectada con las respuestas entregadas.</h3>
              <Textarea
                value={inconformidad}
                onChange={(e) => setInconformidad(e.target.value)}
                placeholder="Escribe aquí la inconformidad..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <CancelButton onClick={() => setShowInconformidad(false)}>Cancelar</CancelButton>
                <ConfirmButton onClick={() => {
                  if (!inconformidad.trim()) {
                    alert('Debes ingresar una inconformidad antes de continuar.');
                    return;
                  }
                  handleSubmitInconformidad();
                  setShowInconformidad(false);
                }}>Guardar</ConfirmButton>
              </div>
            </ModalBox>
          </ModalOverlay>
        )}
    </Container>
  );
}

// =================== Styled Components ===================

const Container = styled.div`
  background: white;
  padding: 2rem;
  margin-top: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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

const NewData = styled.div`
  
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: #374151;
`;

const DataWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  flex-direction: row;
`;

const InfoItem = styled.div`
  flex: 1;
  min-width: 200px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #6b7280;
  width: 50%;
`;

const Value = styled.div`
  margin-top: 0.25rem;
  font-weight: 500;
  color: #111827;
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
    border-color: #2563eb;
  }
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  max-width: 400px;
  width: 90%;
`;

const ConfirmButton = styled.button`
  background-color: #2563eb;
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
  background-color: #BBBBBB;
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
    border-color: #2563eb;
    outline: none;
  }
`;

const AceptarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 1.5rem;
  background-color: #2563EB;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: flex;
  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;
  
  &:hover {
    background-color: #1D4ED8;
    outline: none
  }
`;

const RechazarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 1.5rem;
  background-color: #BBBBBB;
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
    outline: none
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: black;
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background-color: #f3f4f6;
    color: #374151;
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
