'use client'


import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

interface Props {
  workOrder: any;
}

export default function PersonalizacionComponent({ workOrder }: Props) {
  const router = useRouter();
  const [otherValue, setOtherValue] = useState('');
  const [selectedOption, setSelectedOption] = useState('etiquetadora');
  
  // Para bloquear liberacion hasta que sea aprobado por CQM
  const isDisabled = workOrder.status === 'En proceso';

  // Para mostrar formulario de CQM y enviarlo
  const [showModal, setShowModal] = useState(false);

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  //Para guardar las respuestas 
  const [responses, setResponses] = useState<{ questionId: number, answer: boolean }[]>([]);
  const [sampleQuantity, setSampleQuantity] = useState<number | string>('');
  const [verificarEtiqueta, setVerificarEtiqueta] = useState('');
  const [colorPersonalizacion, setColorPersonalizacion] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [goodQuantity, setGoodQuantity] = useState<number | string>('');
  const [badQuantity, setBadQuantity] = useState<number | string>('');
  const [excessQuantity, setExcessQuantity] = useState<number | string>('');

  // Para controlar qué preguntas están marcadas
  const [checkedQuestions, setCheckedQuestions] = useState<number[]>([]);

  // Función para manejar el cambio en el campo de muestras y color edge
  const handleSampleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSampleQuantity(e.target.value);
  };

  const handleCheckboxChange = (questionId: number, isChecked: boolean) => {
    setResponses((prevResponses) => {
      const updateResponses = prevResponses.filter(response => response.questionId !== questionId);
      if(isChecked) { 
        updateResponses.push({ questionId, answer: isChecked}); 
      }
      return updateResponses;
    });

    // Actualizar visualmente el checkbox
    setCheckedQuestions((prev) =>
      isChecked ? [...prev, questionId] : prev.filter((id) => id !== questionId)
    );
  };
  // Para ver las preguntas de calidad
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const toggleQuestions = () => {
    setQuestionsOpen(!questionsOpen);
  };
  const [qualitySectionOpen, setQualitySectionOpen] = useState(false);
  const toggleQualitySection = () => {
    setQualitySectionOpen(!qualitySectionOpen);
  };

  const handleSelectAll = (isChecked: boolean) => {
    const questionIds = workOrder.area.formQuestions.slice(1, 10).map((q: { id: number }) => q.id);
  
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

  // Para mandar la OT a evaluacion por CQM
  const handleSubmit = async () => {
    const basePayload = {
      question_id: responses.map(response => response.questionId),
      work_order_flow_id: workOrder.id,
      work_order_id: workOrder.workOrder.id,
      area_id: workOrder.area.id,
      response: responses.map(response => response.answer),
      reviewed: false,
      user_id: workOrder.assigned_user,
      sample_quantity: Number(sampleQuantity),
      tipo_personalizacion: selectedOption,
    }
    let aditionalFields = {};
    if(selectedOption === 'etiquetadora'){
      aditionalFields = {
        verificar_etiqueta: verificarEtiqueta,
      };
    } else if (selectedOption === 'persos'){
      aditionalFields = {
        color_personalizacion: colorPersonalizacion,
        codigo_barras: codigoBarras,
      };
    } else if (selectedOption === 'laser'){
      aditionalFields= {
      }
    }
    const payload = {
      ...basePayload,
      ...aditionalFields,
    };

    try {
      const token = localStorage.getItem('token');
      if(!token) {
        alert('No hay token de autenticación');
        return;
      }
      console.log('Datos a enviar', payload);
      const res = await fetch('http://localhost:3000/free-order-flow/cqm-personalizacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Error en el servidor:", data);
        return;
      }
      router.push('/liberarProducto');
  } catch (error) {
    console.log('Error al guardar la respuesta: ', error);
  }
  }
  
  // Para Liberar el producto cuando ya ha pasado por CQM
  const [showConfirm, setShowConfirm] = useState(false); 
  const handleImpressSubmit = async () => {
    const payload = {
      workOrderId: workOrder.workOrder.id,
      workOrderFlowId: workOrder.id,
      areaId: workOrder.area.id,
      assignedUser: workOrder.assigned_user,
      releaseQuantity: Number(sampleQuantity),
      goodQuantity: Number(goodQuantity),
      badQuantity: Number(badQuantity),
      excessQuantity: Number(excessQuantity),
      comments: document.querySelector('textarea')?.value || '',
      formAnswerId: workOrder.answers[0].id,
    };

    console.log('datos a enviar',payload);
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No hay token de autenticación');
        return;
      }
  
      const res = await fetch('http://localhost:3000/free-order-flow/personalizacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
      if (!res.ok) {
        console.error('Error en el servidor:', data);
        return;
      }
  
      router.push('/liberarProducto');
    } catch (error) {
      console.log('Error al enviar datos:', error);
    }
  };
  
  ;

  return (
    <>
    <Container>
      <Title>Área: Personalización</Title>

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
      </DataWrapper>
      <NewData>
        <SectionTitle>Datos de Producción</SectionTitle>
        <NewDataWrapper>
          <InputGroup>
            <Label>Buenas:</Label>
            <Input type="number" placeholder="Ej: 2" value={goodQuantity} onChange={(e) => setGoodQuantity(e.target.value)} disabled={isDisabled} />
            <Label>Malas:</Label>
            <Input type="number" placeholder="Ej: 2" value={badQuantity} onChange={(e) => setBadQuantity(e.target.value)} disabled={isDisabled} />
            <Label>Excedente:</Label>
            <Input type="number" placeholder="Ej: 2" value={excessQuantity} onChange={(e) => setExcessQuantity(e.target.value)} disabled={isDisabled} />
          </InputGroup>
          <CqmButton style={{ alignSelf: 'center' }} onClick={openModal} disabled={workOrder.status === 'Listo'}>Enviar a CQM</CqmButton>
        </NewDataWrapper>
        <InputGroup>
          <SectionTitle>Comentarios</SectionTitle>
          <Textarea placeholder="Agrega un comentario adicional..." disabled={isDisabled}/>
        </InputGroup>
      </NewData>
      <LiberarButton disabled={isDisabled} onClick={() => setShowConfirm(true)}>Liberar Producto</LiberarButton>
    </Container>

    {/* Modal para enviar a liberacion */}
    {showConfirm && (
        <ModalOverlay>
          <ModalBox>
            <h4>¿Estás segura/o que deseas liberar este producto?</h4>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <CancelButton onClick={() => setShowConfirm(false)}>Cancelar</CancelButton>
              <ConfirmButton onClick={handleImpressSubmit}>Confirmar</ConfirmButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}

    {/* Modal para enviar a CQM */}
    {showModal && (
      <ModalOverlay>
        <ModalContent>
          <ModalTitle>Preguntas del Área: {workOrder.area.name}</ModalTitle>
          <RadioGroup>
            <RadioButton $checked={selectedOption === 'etiquetadora'}>
              <input
                type="radio"
                value="etiquetadora"
                checked={selectedOption === 'etiquetadora'}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              Etiquetadora
            </RadioButton>
            <RadioButton $checked={selectedOption === 'persos'}>
              <input
                type="radio"
                value="persos"
                checked={selectedOption === 'persos'}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              Persos's
            </RadioButton>
            <RadioButton $checked={selectedOption === 'laser'}>
              <input
                type="radio"
                value="laser"
                checked={selectedOption === 'laser'}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              Láser
            </RadioButton>
          </RadioGroup>

          {selectedOption === 'etiquetadora' && (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>Respuesta</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{workOrder.area.formQuestions[0]?.title}</td>
                    <td><input type="checkbox" checked={checkedQuestions.includes(workOrder.area.formQuestions[0]?.id)} onChange={(e) => handleCheckboxChange(workOrder.area.formQuestions[0]?.id, e.target.checked)}/></td>
                  </tr>
                </tbody>
              </Table>
              <InputGroup style={{ paddingTop: '30px', width: '70%'}}>
                <Label>Verificar Tipo De Etiqueta Vs Ot Y Pegar Utilizada:</Label>
                <Input type="text" placeholder="Ej: " value={verificarEtiqueta} onChange={(e) => setVerificarEtiqueta(e.target.value)}/>
              </InputGroup>
            </>
          )}
          
          {selectedOption === 'persos' && (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>
                      Respuesta
                      <button 
                        onClick={toggleQuestions} 
                        style={{ marginLeft: "3px", cursor: "pointer", border: "none", background: "transparent" }}
                      >
                        {questionsOpen ? '▼' : '▶'}
                      </button>
                      {questionsOpen && (
                        <input
                          type="checkbox"
                          checked={
                            workOrder.area.formQuestions.slice(1, 10).every((q: { id: number }) =>
                              checkedQuestions.includes(q.id)
                            )
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          style={{ marginLeft: "8px" }}
                        />
                      )}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {questionsOpen &&
                    workOrder.area.formQuestions
                    .slice(1, 10)
                    .map((question: { id: number; title: string }) => (
                      <tr key={question.id}>
                        <td>{question.title}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={checkedQuestions.includes(question.id)}
                            onChange={(e) => handleCheckboxChange(question.id, e.target.checked)}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
              <InputGroup style={{ paddingTop: '30px', width: '70%'}}>
                <Label>Color De Personalización:</Label>
                <Input type="text" placeholder="Ej: " value={colorPersonalizacion} onChange={(e) => setColorPersonalizacion(e.target.value)}/>
              </InputGroup>
              <InputGroup style={{ paddingTop: '30px', width: '70%'}}>
                <Label>Tipo de Código de Barras Que Se Personaliza:</Label>
                <Input type="text" placeholder="Ej: " value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)}/>
              </InputGroup>
            </>
          )}
          
          {selectedOption === 'laser' && (
            <>
            </>
          )}
          <InputGroup style={{ paddingTop: '20px'}}>
            <Label style={{ paddingTop: '30px'}}>Muestras:</Label>
            <Input type="number" placeholder="Ej: 2" value={sampleQuantity} onChange={handleSampleQuantityChange}/>
          </InputGroup>
          {selectedOption === 'etiquetadora' && (
            <>
              <ModalTitle style={{ marginTop: '1.5rem', marginBottom: '0.3rem'}}>
                Preguntas de Calidad
                <button onClick={toggleQualitySection} style={{ marginLeft: '10px',cursor: "pointer", border: "none", background: "transparent", fontSize: "1.2rem" }}>{qualitySectionOpen ? '▼' : '▶'}</button>
              </ModalTitle>
              {qualitySectionOpen && (
              <>
              <InputGroup style={{ paddingTop: '10px', width: '70%'}}>
                <Label>No hay preguntas</Label>
              </InputGroup>
              </>
              )}
            </>
          )}
          {selectedOption === 'persos' && (
            <>
              <ModalTitle style={{ marginTop: '1.5rem', marginBottom: '0.3rem'}}>
                Preguntas de Calidad
                <button onClick={toggleQualitySection} style={{ marginLeft: '10px',cursor: "pointer", border: "none", background: "transparent", fontSize: "1.2rem" }}>{qualitySectionOpen ? '▼' : '▶'}</button>
              </ModalTitle>
              {qualitySectionOpen && (
              <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>
                      Respuesta
                      <button onClick={toggleQuestions} style={{ marginLeft: "8px", cursor: "pointer", border: "none", background: "transparent" }}>{questionsOpen ? '▼' : '▶'}</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questionsOpen && workOrder.area.formQuestions
                  .slice(13, 16)
                  .filter((question: { role_id: number | null }) => question.role_id === 3)
                  .map((question: { id: number; title: string }) => {
                    // Buscar la respuesta correspondiente a esta pregunta
                    const answer = workOrder.answers[0]?.FormAnswerResponse?.find(
                      (resp: any) => resp.question_id === question.id
                    );
                    return (
                      <tr key={question.id}>
                        <td>{question.title}</td>
                        <td></td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <InputGroup style={{ paddingTop: '10px', width: '70%'}}>
                <Label>Validar Carga De Aplicación (PersoMaster)</Label>
                <Input type="text" placeholder="Ej: " disabled/>
              </InputGroup>
              </>
              )}
            </>
          )}
          {selectedOption === 'laser' && (
            <>
              <ModalTitle style={{ marginTop: '1.5rem', marginBottom: '0.3rem'}}>
                Preguntas de Calidad
                <button onClick={toggleQualitySection} style={{ marginLeft: '10px',cursor: "pointer", border: "none", background: "transparent", fontSize: "1.2rem" }}>{qualitySectionOpen ? '▼' : '▶'}</button>
              </ModalTitle>
              {qualitySectionOpen && (
              <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>
                      Respuesta
                      <button onClick={toggleQuestions} style={{ marginLeft: "8px", cursor: "pointer", border: "none", background: "transparent" }}>{questionsOpen ? '▼' : '▶'}</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questionsOpen && workOrder.area.formQuestions
                  .slice(9, 13)
                  .filter((question: { role_id: number | null }) => question.role_id === 3)
                  .map((question: { id: number; title: string }) => {
                    // Buscar la respuesta correspondiente a esta pregunta
                    const answer = workOrder.answers[0]?.FormAnswerResponse?.find(
                      (resp: any) => resp.question_id === question.id
                    );
                    return (
                      <tr key={question.id}>
                        <td>{question.title}</td>
                        <td></td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <InputGroup style={{ paddingTop: '10px', width: '70%'}}>
              <Label>Verificar Script / Layout Vs Ot / Autorizacion:</Label>
              <Input type="text" placeholder="Ej: " disabled/>
              <Label>Validar, Anotar KVC (Llaves), Carga de Aplicación o Prehabilitación:</Label>
              <Input type="text" placeholder="Ej: " disabled/>
              <Label>Describir Apariencia Del Quemado Del Laser (Color):</Label>
              <Input type="text" placeholder="Ej: " disabled/>
            </InputGroup>
              </>
              )}
            </>
          )}
          <div style={{ display: 'flex', gap: '1rem'}}>
            <CloseButton onClick={closeModal}>Cerrar</CloseButton>
            <SubmitButton onClick={handleSubmit}>Enviar Respuestas</SubmitButton>
          </div>
        </ModalContent>
      </ModalOverlay>
    )}
  </>
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
`;

const InfoItem = styled.div`
  flex: 1;
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

const RadioGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
`;

interface RadioButtonProps {
  $checked: boolean;
}

const RadioButton = styled.label<RadioButtonProps>`
  padding: 0.5rem 1.5rem;
  border-radius: 9999px;
  border: 2px solid ${({ $checked }) => ($checked ? '#2563eb' : '#d1d5db')};
  background-color: ${({ $checked }) => ($checked ? '#2563eb' : 'white')};
  color: ${({ $checked }) => ($checked ? 'white' : '#374151')};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;

  input {
    display: none;
  }

  &:hover {
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

const LiberarButton = styled.button<{ disabled?: boolean }>`
  margin-top: 2rem;
  background-color: ${({ disabled }) => disabled ? '#9CA3AF' : '#2563EB'};
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.7 : 1};

  &:hover {
    background-color: ${({ disabled }) => disabled ? '#9CA3AF' : '#1D4ED8'};
  }

  &:disabled {
    background-color: #9CA3AF;
    cursor: not-allowed;
  }
`;

const CqmButton = styled.button`
  margin-top: 2rem;
  background-color: ${({ disabled }) => (disabled ? 'green' : '#2563eb')};
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

  &:hover {
    ${({ disabled }) =>
      !disabled &&
      `
        background-color: #1d4ed8;
      `}
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  color: black;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  justify-content: center;
  max-width: 700px;
  max-height: 80%;
  overflow-y: auto;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1f2937;
  text-align: center;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

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

const CloseButton = styled.button`
  margin-top: 1.5rem;
  background-color: #BBBBBB;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: block;
  margin-left: auto;

  border: none;
  cursor: pointer;

  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #a0a0a0;
    outline: none
  }
`;

const SubmitButton = styled.button`
  margin-top: 1.5rem;
  background-color: #2563eb;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;
  
  &:hover {
    background-color: #1D4ED8;
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