'use client'


import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

interface Props {
  workOrder: any;
}

export default function ColorEdgeComponent({ workOrder }: Props) {
  const router = useRouter();
  const [otherValue, setOtherValue] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  
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
  const [colorEdge, setColorEdge] = useState<string | string>('');
  const [goodQuantity, setGoodQuantity] = useState<number | string>('');
  const [badQuantity, setBadQuantity] = useState<number | string>('');
  const [excessQuantity, setExcessQuantity] = useState<number | string>('');

  // Para controlar qué preguntas están marcadas
  const [checkedQuestions, setCheckedQuestions] = useState<number[]>([]);

  // Función para manejar el cambio en el campo de muestras y color edge
  const handleSampleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSampleQuantity(e.target.value);
  };
  const handleColorEdgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColorEdge(e.target.value);
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

  // Para mandar la OT a evaluacion por CQM
  const handleSubmit = async () => {
    const payload = {
      question_id: responses.map(response => response.questionId),
      work_order_flow_id: workOrder.id,
      work_order_id: workOrder.workOrder.id,
      area_id: workOrder.area.id,
      response: responses.map(response => response.answer),
      reviewed: false,
      user_id: workOrder.assigned_user,
      sample_quantity: Number(sampleQuantity),
      color_edge: Number(colorEdge),
      finish_validation: selectedOption === 'otro' ? otherValue : selectedOption,
    };
    try {
      const token = localStorage.getItem('token');
      if(!token) {
        alert('No hay token de autenticación');
        return;
      }
      console.log('Datos a enviar', payload);
      const res = await fetch('http://localhost:3000/free-order-flow/cqm-color-edge', {
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
  
      const res = await fetch('http://localhost:3000/free-order-flow/color-edge', {
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
      <Title>Área: Color Edge</Title>

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
          <CqmButton onClick={openModal} disabled={workOrder.status === 'Listo'}>Enviar a CQM</CqmButton>
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
              .map((question: { id: number; title: string }) => (
                <tr key={question.id}>
                  <td>{question.title}</td>
                  <td><input type="checkbox" checked={checkedQuestions.includes(question.id)} onChange={(e) => handleCheckboxChange(question.id, e.target.checked)}/></td>
                </tr>
              ))}
            </tbody>
          </Table>
          <InputGroup style={{ paddingTop: '30px'}}>
            <Label>Color Edge:</Label>
            <Input type="text" placeholder="Ej: 2" value={colorEdge} onChange={handleColorEdgeChange}/>
            <Label style={{ paddingTop: '30px'}}>Muestras:</Label>
            <Input type="number" placeholder="Ej: 2" value={sampleQuantity} onChange={handleSampleQuantityChange}/>
          </InputGroup>
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
  accent-color: #2563eb;
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
  padding: 0.1rem 1rem;
  height: 50px;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: background 0.3s;

  &:hover {
    background-color: #1d4ed8;
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
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  max-width: 600px;
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
    background-color: #45a049;
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