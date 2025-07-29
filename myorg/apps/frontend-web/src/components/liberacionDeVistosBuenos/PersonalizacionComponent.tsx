'use client'

import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";
import { submitExtraPersonalizacion, sendInconformidadCQM } from "@/api/recepcionCQM";

interface Props {
  workOrder: any;
}
type Answer = {
  reviewed: boolean;
  sample_quantity: number;
  // lo que más tenga...
};

export default function PersonalizacionComponent({ workOrder }: Props) {
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
  const tipoPersonalizacion = workOrder?.answers[index].tipo_personalizacion;
  let selectedQuestions : { id: number, role_id: number | null }[] = [];

  if (tipoPersonalizacion === 'laser'){
    selectedQuestions = workOrder.area.formQuestions.slice(9, 13);
  } else if (tipoPersonalizacion === 'persos'){
    selectedQuestions = workOrder.area.formQuestions.slice(13, 17);
  }

  const [responses, setResponses] = useState<{questionId: number, answer: boolean}[]>(
    selectedQuestions
      .filter((question) => question.role_id === 3)
      .map((question: {id: number}) => ({
        questionId: question.id,
        answer: false
      }))
  );
  const [cargaAplicacion, setCargaAplicacion] = useState('');
  const [verificarScript, setVerificarScript] = useState('');
  const [validarKVC, setValidarKVC] = useState('');
  const [aparienciaQuemado, setAparienciaQuemado] = useState('');

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
  const handleSelectAllPersos = (isChecked: boolean) => {
    const questionIds = workOrder.area.formQuestions.slice(13,15).map((q: { id: number }) => q.id);
    if (isChecked) {
      // Marcar todas las preguntas
      setCheckedQuestions(questionIds);
      setResponses((prevResponses) => {
        // Filtrar respuestas viejas de esas preguntas
        const updatedResponses = prevResponses.filter(
          (response) => !questionIds.includes(response.questionId)
        );
        // Agregar todas como true
        const newResponses = questionIds.map((id: number) => ({
          questionId: id,
          answer: true,
        }));
        return [...updatedResponses, ...newResponses];
      });
    } else {
      // Desmarcar todas
      setCheckedQuestions([]);
      setResponses((prevResponses) =>
        prevResponses.filter((response) => !questionIds.includes(response.questionId))
      );
    }
  };

  
  const handleSubmit = async () => {
    const formAnswerId = workOrder.answers[index]?.id; // id de FormAnswer
    if (!formAnswerId) {
      alert("No se encontró el ID del formulario.");
      return;
    }
    const basePayload = {
      form_answer_id: formAnswerId,
    }
    let aditionalFields = {};
    if(workOrder?.answers[index].tipo_personalizacion === 'laser'){
      const checkboxPayload = responses.map(({ questionId, answer }) => ({
        question_id: questionId,
        answer: answer,     
      }));
      aditionalFields= {
        verificar_script: verificarScript,
        validar_kvc_perso: validarKVC,
        apariencia_quemado: aparienciaQuemado,
        checkboxes: checkboxPayload,
      };
    }else if(workOrder?.answers[index].tipo_personalizacion === 'persos'){
      const checkboxPayload = responses.map(({ questionId, answer }) => ({
        question_id: questionId,
        answer: answer,     
      }));
      aditionalFields={
        carga_aplicacion: cargaAplicacion,
        checkboxes: checkboxPayload,
      };
    }else if(workOrder?.answers[index].tipo_personalizacion === 'etiquetadora'){
      aditionalFields={
      };
    }
    const payload = {
      ...basePayload,
      ...aditionalFields,
    };
    try {
      const data = await submitExtraPersonalizacion(payload);
      router.push("/liberacionDeVistosBuenos");
    } catch (error) {
      console.log("Error al guardar la respuesta: ", error);
    }
  };

  const handleSubmitInconformidad = async () => {
    if (!inconformidad.trim()) {
      alert('Debes ingresar una inconformidad antes de continuar.');
      return;
    }
    try {
      const res = await sendInconformidadCQM(workOrder.id, inconformidad);
      router.push('/liberacionDeVistosBuenos');
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  }

  return (
    <Container>
      <Title>Área a evaluar: Personalizacion</Title>

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
          <InputGroup style={{ paddingTop: '5px', width: '70%'}}>
            <Label>Tipo de Personalizacion:</Label>
            <Input type="text" value={workOrder?.answers[index].tipo_personalizacion ?? 'No se reconoce la muestra enviada' } readOnly />
          </InputGroup>

        {workOrder?.answers[index].tipo_personalizacion === 'laser' && (
          <>
            <InputGroup style={{width: '70%'}}>
              <Label>Muestras entregadas:</Label>
              <Input type="number" value={workOrder?.answers[index].sample_quantity ?? 'No se reconoce la muestra enviada' } readOnly />
            </InputGroup>
          </>
        )}
        
        {workOrder?.answers[index].tipo_personalizacion === 'persos' && (
          <>
            <Table>
              <thead>
                <tr>
                  <th>Pregunta</th>
                  <th>Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.area.formQuestions.slice(1, 10)
                .map((question: { id: number; title: string }) => {
                  // Buscar la respuesta correspondiente a esta pregunta
                  const answer = workOrder.answers[index]?.FormAnswerResponse?.find(
                    (resp: any) => resp.question_id === question.id
                  );
                  
                  // Obtener la respuesta del operador (response_operator)
                  const operatorResponse = answer?.response_operator;
                  return(
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
            <InputGroup style={{ paddingTop: '10px', width: '70%'}}>
              <Label>Color De Personalización:</Label>
              <Input type="text" value={workOrder?.answers[index].color_personalizacion ?? 'No se reconoce la muestra enviada' } readOnly />
              <Label>Tipo de Código de Barras Que Se Personaliza:</Label>
              <Input type="text" value={workOrder?.answers[index].codigo_barras ?? 'No se reconoce la muestra enviada' } readOnly />
              <Label>Muestras entregadas:</Label>
              <Input type="number" value={workOrder?.answers[index].sample_quantity ?? 'No se reconoce la muestra enviada' } readOnly />
            </InputGroup>
          </>
        )}
        
        {workOrder?.answers[index].tipo_personalizacion === 'etiquetadora' && (
          <>
            <Table>
              <thead>
                <tr>
                  <th>Pregunta</th>
                  <th>Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.area.formQuestions.slice(0, 1)
                .map((question: { id: number; title: string }) => {
                  // Buscar la respuesta correspondiente a esta pregunta
                  const answer = workOrder.answers[index]?.FormAnswerResponse?.find(
                    (resp: any) => resp.question_id === question.id
                  );
                  
                  // Obtener la respuesta del operador (response_operator)
                  const operatorResponse = answer?.response_operator;
                  return(
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
            <InputGroup style={{ paddingTop: '10px', width: '70%'}}>
              <Label>Verificar Tipo De Etiqueta Vs Ot Y Pegar Utilizada:</Label>
              <Input type="text" value={workOrder?.answers[index].verificar_etiqueta ?? 'No se reconoce la muestra enviada' } readOnly />
              <Label>Muestras entregadas:</Label>
              <Input type="number" value={workOrder?.answers[index].sample_quantity ?? 'No se reconoce la muestra enviada' } readOnly />
            </InputGroup>
          </>
        )}
        {workOrder?.answers[index].tipo_personalizacion === 'packsmart' && (
          <>
            <Table>
              <thead>
                <tr>
                  <th>Pregunta</th>
                  <th>Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.area.formQuestions.slice(14, 20)
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
          </>
        )}
        {workOrder?.answers[index].tipo_personalizacion === 'otto' && (
          <>
            <Table>
              <thead>
                <tr>
                  <th>Pregunta</th>
                  <th>Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.area.formQuestions.slice(20, 28)
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
          </>
        )}
        {workOrder?.answers[index].tipo_personalizacion === 'embolsadora' && (
          <>
            <Table>
              <thead>
                <tr>
                  <th>Pregunta</th>
                  <th>Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.area.formQuestions.slice(28, 30)
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
          </>
        )}
        </NewDataWrapper>
        <SectionTitle>Mis respuestas</SectionTitle>
        <NewDataWrapper>
          
          {workOrder?.answers[index].tipo_personalizacion === 'laser' && (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>Respuesta</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.area.formQuestions
                  .slice(9, 13)
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
              <InputGroup style={{ paddingTop: '10px', width: '70%'}}>
              <Label>Verificar Script / Layout Vs Ot / Autorizacion:</Label>
              <Input type="text" placeholder="Ej: " value={verificarScript} onChange={(e) => setVerificarScript(e.target.value)}/>
              <Label>Validar, Anotar KVC (Llaves), Carga de Aplicación o Prehabilitación:</Label>
              <Input type="text" placeholder="Ej: " value={validarKVC} onChange={(e) => setValidarKVC(e.target.value)}/>
              <Label>Describir Apariencia Del Quemado Del Laser (Color):</Label>
              <Input type="text" placeholder="Ej: " value={aparienciaQuemado} onChange={(e) => setAparienciaQuemado(e.target.value)}/>
            </InputGroup>
            </>
          )}

          {workOrder?.answers[index].tipo_personalizacion === 'persos' && (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th style={{ display: 'flex'}}>
                      Respuesta
                      <input
                        type="checkbox"
                        checked={
                          workOrder.area.formQuestions.slice(13,15).every((q: { id: number }) =>
                            checkedQuestions.includes(q.id)
                          )
                        }
                        onChange={(e) => handleSelectAllPersos(e.target.checked)}
                        style={{ marginLeft: "10px" }}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.area.formQuestions
                  .slice(13,15)
                  .filter((question: { role_id: number | null }) => question.role_id === 3)
                  .map((question: { id: number; title: string }) => {
                    // Buscar la respuesta correspondiente a esta pregunta
                    const answer = workOrder.answers[index]?.FormAnswerResponse?.find(
                      (resp: any) => resp.question_id === question.id
                    );
                    return (
                      <tr key={question.id}>
                        <td>{question.title}</td>
                        <td style={{textAlign: 'center'}}>
                          <input type="checkbox" checked={checkedQuestions.includes(question.id)} onChange={(e) => handleCheckboxChange(question.id, e.target.checked)}/>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <InputGroup style={{ paddingTop: '10px', width: '70%'}}>
                <Label>Validar Carga De Aplicación (PersoMaster)</Label>
                <Input type="text" placeholder="Ej: " value={cargaAplicacion} onChange={(e) => setCargaAplicacion(e.target.value)}/>
              </InputGroup>
            </>
          )}
          
          {
            (
              workOrder?.answers[index].tipo_personalizacion === 'etiquetadora' ||
              workOrder?.answers[index].tipo_personalizacion === 'otto' ||
              workOrder?.answers[index].tipo_personalizacion === 'packsmart' ||
              workOrder?.answers[index].tipo_personalizacion === 'embolsadora'
            ) && (
              <>
                <InputGroup style={{ paddingTop: '10px', width: '70%' }}>
                  <Label>No tienes preguntas</Label>
                </InputGroup>
              </>
            )
          }
        </NewDataWrapper>
        
      </NewData>
      <div style={{ display: 'flex', gap: '1rem'}}>
      <RechazarButton onClick={() => setShowInconformidad(true)}>Rechazar</RechazarButton>
      <AceptarButton onClick={() => setShowConfirmModal(true)}>Aprobado</AceptarButton>
      </div>
      {showConfirmModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>¿Estás seguro/a de aprobar?</ModalTitle>
            <ModalActions>
            <Button style= {{ backgroundColor: '#BBBBBB'}}onClick={() => setShowConfirmModal(false)}>Cancelar</Button>
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
    border-color: #0038A8;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 0.5rem;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #374151;
`;

const Radio = styled.input`
  accent-color: #0038A8;
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
    border-color: #0038A8;
    outline: none;
  }
`;

const AceptarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 1.5rem;
  background-color: #0038A8;
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

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  max-width: 400px;
  width: 90%;
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

const ConfirmButton = styled.button`
  background-color: #0038A8;
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