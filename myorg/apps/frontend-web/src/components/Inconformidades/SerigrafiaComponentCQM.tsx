'use client'
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  workOrder: any;
}

export default function SerigrafiaComponentCQM({ workOrder }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const areaResponse = workOrder.answers[0].id;
    console.log(areaResponse);
    try {
      const res = await fetch(`http://localhost:3000/inconformities/${areaResponse}/cqm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/liberarProducto');
      }
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  }
  return (
    <>
    <FlexContainer>
    <Container>
      <NewData>
        <SectionTitle>Entregaste:</SectionTitle>
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
                const answer = workOrder.answers[0]?.FormAnswerResponse?.find(
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
          <InputGroup style={{ marginTop: '-7rem'}}>
              <Label>Muestras entregadas:</Label>
              <Input type="number" value={workOrder?.answers[0].sample_quantity ?? 'No se reconoce la muestra enviada' } readOnly />
          </InputGroup>
        </NewDataWrapper>
      </NewData>
    </Container>
    <Container>
      <NewData>
        <SectionTitle>Inconformidad:</SectionTitle>
        <InputGroup>
          <Label>Respuesta de Usuario</Label>
          <Input type="text" value={workOrder.answers[0].inconformities[0].user.username} disabled/>
        </InputGroup>
        <InputGroup>
          <Label>Comentarios</Label>
          <Textarea value={workOrder.answers[0].inconformities[0].comments} disabled/>
        </InputGroup>
      </NewData>
    </Container>
    </FlexContainer>
    <CloseButton onClick={openModal}>Aceptar Inconformidad</CloseButton>
    {showModal && (
      <ModalOverlay>
        <ModalBox>
          <h4>¿Estás segura/o que deseas aceptar la inconformidad? Deberás liberar nuevamente</h4>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  flex: 1;
  min-width: 300px;
  max-width: 600px;
`;
const NewData = styled.div`
`;

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
  background: #2563EB;
  color: white;
  margin-top: 20px;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
  transition: background 0.3s;

  &:hover {
    background: #1D4ED8;
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