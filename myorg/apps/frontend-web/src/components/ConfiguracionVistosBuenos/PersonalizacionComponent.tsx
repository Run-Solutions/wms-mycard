'use client'

import { useRouter } from "next/navigation";
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useState } from "react";
import styled from "styled-components";
import { deleteFormQuestion, updateFormQuestion } from "@/api/configVistosBuenos";

interface Props {
  formQuestion: any;
}

interface Question {
  id: number;
  title: string;
}

export default function PersonalizacionComponent({ formQuestion }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formQuestions, setFormQuestions] = useState<any[]>(formQuestion);
  const [selectedOption, setSelectedOption] = useState('etiquetadora');

  const handleUpdateTitle = async (id: number, updatedTitle: string) => {
    // Verificamos si el título ha cambiado
    const currentTitle = formQuestions.find((q: Question) => q.id === id)?.title;
    // Si el título es el mismo, no hacemos nada
    if (currentTitle === updatedTitle) {
      alert("El título no ha cambiado. No se envía la solicitud.");
      return;
    }
    try {
      // Primero actualizamos el estado local
      const updatedQuestions = formQuestions.map((q: Question) =>
        q.id === id ? { ...q, title: updatedTitle } : q
      );
      setFormQuestions(updatedQuestions);
      setEditingId(null);

      console.log("Datos enviados:", {
        id,
        title: updatedTitle,
      });
      await updateFormQuestion(id, updatedTitle);
    } catch (error) {
      console.error("Error actualizando la pregunta:", error);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      const res = await deleteFormQuestion(id);
      if (res.ok) {
        // Quitamos del estado local
        const updatedQuestions = formQuestions.filter((q: Question) => q.id !== id);
        setFormQuestions(updatedQuestions);
        setDeletingId(null);
      } else {
        alert("Error al eliminar la pregunta.");
      }
    } catch (error) {
      console.error("Error eliminando la pregunta:", error);
    }
  };


  return (
    <Container>
      <Title>Área a evaluar: Personalización</Title>

      <NewData>
        <SectionTitle>Respuestas del operador</SectionTitle>
        <NewDataWrapper>
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
            <RadioButton $checked={selectedOption === 'packsmart'}>
              <input
                type="radio"
                value="packsmart"
                checked={selectedOption === 'packsmart'}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              Packsmart
            </RadioButton>
            <RadioButton $checked={selectedOption === 'otto'}>
              <input
                type="radio"
                value="otto"
                checked={selectedOption === 'otto'}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              Otto
            </RadioButton>
            <RadioButton $checked={selectedOption === 'embolsadora'}>
              <input
                type="radio"
                value="embolsadora"
                checked={selectedOption === 'embolsadora'}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              Embolsadora
            </RadioButton>
          </RadioGroup>
          {selectedOption === 'etiquetadora' && (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>Respuesta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formQuestions.slice(0, 1).filter((question: any) => question.role_id === null && question.areas.some((area: any) => area.id === 10))
                    .map((question: any) => {
                      // Como no mostraste la estructura de las respuestas aquí, lo dejo vacío
                      const frontAnswer = null;
                      const vueltaAnswer = null;
                      return (
                        <tr key={question.id}>
                          <td>{question.title}</td>
                          <td><input type="checkbox" checked={false} disabled /></td>
                          <td>
                            <button style={{ marginRight: '8px' }} onClick={() => {
                              setEditingId(question.id);
                              setNewTitle(question.title);
                            }}><FaEdit /></button>
                            <button onClick={() => setDeletingId(question.id)}><FaTrash /></button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <InputGroup style={{ width: '50%' }}>
                <Label>Verificar Tipo De Etiqueta Vs Ot Y Pegar Utilizada:</Label>
                <Input type="number" readOnly />
              </InputGroup>
            </>
          )}
          {selectedOption === 'persos' && (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>Respuesta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formQuestions.slice(1, 10).filter((question: any) => question.role_id === null && question.areas.some((area: any) => area.id === 10))
                    .map((question: any) => {
                      // Como no mostraste la estructura de las respuestas aquí, lo dejo vacío
                      const frontAnswer = null;
                      const vueltaAnswer = null;
                      return (
                        <tr key={question.id}>
                          <td>{question.title}</td>
                          <td><input type="checkbox" checked={false} disabled /></td>
                          <td>
                            <button style={{ marginRight: '8px' }} onClick={() => {
                              setEditingId(question.id);
                              setNewTitle(question.title);
                            }}><FaEdit /></button>
                            <button onClick={() => setDeletingId(question.id)}><FaTrash /></button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <InputGroup style={{ width: '50%', marginTop: '-10px' }}>
                <Label>Color de Personalizacion:</Label>
                <Input type="number" readOnly />
              </InputGroup>
              <InputGroup style={{ width: '50%', marginTop: '-10px' }}>
                <Label>Tipo de Codigo de Barras Que Se Personaliza:</Label>
                <Input type="number" readOnly />
              </InputGroup>
            </>
          )}
          {selectedOption === 'laser' && (
            <>
              <InputGroup style={{ width: '50%' }}>
                <Label>No hay preguntas por parte del operador.</Label>
              </InputGroup>
            </>
          )}
          {selectedOption === 'packsmart' && (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>Respuesta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formQuestions.slice(14, 20).filter((question: any) => question.role_id === null && question.areas.some((area: any) => area.id === 10))
                    .map((question: any) => {
                      // Como no mostraste la estructura de las respuestas aquí, lo dejo vacío
                      const frontAnswer = null;
                      const vueltaAnswer = null;
                      return (
                        <tr key={question.id}>
                          <td>{question.title}</td>
                          <td><input type="checkbox" checked={false} disabled /></td>
                          <td>
                            <button style={{ marginRight: '8px' }} onClick={() => {
                              setEditingId(question.id);
                              setNewTitle(question.title);
                            }}><FaEdit /></button>
                            <button onClick={() => setDeletingId(question.id)}><FaTrash /></button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </>
          )}
          {selectedOption === 'otto' && (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>Respuesta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formQuestions.slice(21, 28).filter((question: any) => question.role_id === null && question.areas.some((area: any) => area.id === 10))
                    .map((question: any) => {
                      // Como no mostraste la estructura de las respuestas aquí, lo dejo vacío
                      const frontAnswer = null;
                      const vueltaAnswer = null;
                      return (
                        <tr key={question.id}>
                          <td>{question.title}</td>
                          <td><input type="checkbox" checked={false} disabled /></td>
                          <td>
                            <button style={{ marginRight: '8px' }} onClick={() => {
                              setEditingId(question.id);
                              setNewTitle(question.title);
                            }}><FaEdit /></button>
                            <button onClick={() => setDeletingId(question.id)}><FaTrash /></button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </>
          )}
          {selectedOption === 'embolsadora' && (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>Respuesta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formQuestions.slice(28, 30).filter((question: any) => question.role_id === null && question.areas.some((area: any) => area.id === 10))
                    .map((question: any) => {
                      // Como no mostraste la estructura de las respuestas aquí, lo dejo vacío
                      const frontAnswer = null;
                      const vueltaAnswer = null;
                      return (
                        <tr key={question.id}>
                          <td>{question.title}</td>
                          <td><input type="checkbox" checked={false} disabled /></td>
                          <td>
                            <button style={{ marginRight: '8px' }} onClick={() => {
                              setEditingId(question.id);
                              setNewTitle(question.title);
                            }}><FaEdit /></button>
                            <button onClick={() => setDeletingId(question.id)}><FaTrash /></button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </>
          )}
          <InputGroup style={{ width: '50%', marginTop: '-10px' }}>
            <Label>Muestras entregadas:</Label>
            <Input type="number" readOnly />
          </InputGroup>
        </NewDataWrapper>

        <NewData>
          <SectionTitle>Mis respuestas</SectionTitle>
          {['embolsadora', 'packsmart', 'otto', 'etiquetadora'].includes(selectedOption) && (
            <>
              <InputGroup style={{ width: '50%' }}>
                <Label>No hay preguntas por parte de calidad.</Label>
              </InputGroup>
            </>
          )}
          {selectedOption === 'persos' && (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>Respuesta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formQuestions.slice(13, 15).filter((question: any) => question.role_id === 3 && question.areas.some((area: any) => area.id === 10))
                    .map((question: any) => {
                      // Como no mostraste la estructura de las respuestas aquí, lo dejo vacío
                      const frontAnswer = null;
                      const vueltaAnswer = null;
                      return (
                        <tr key={question.id}>
                          <td>{question.title}</td>
                          <td><input type="checkbox" checked={false} disabled /></td>
                          <td>
                            <button style={{ marginRight: '8px' }} onClick={() => {
                              setEditingId(question.id);
                              setNewTitle(question.title);
                            }}><FaEdit /></button>
                            <button onClick={() => setDeletingId(question.id)}><FaTrash /></button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <InputGroup style={{ width: '50%', marginTop: '20px' }}>
                <Label>Validar Carga De Aplicación (PersoMaster) Anotar:</Label>
                <Input type="number" readOnly />
              </InputGroup>
            </>
          )}
          {selectedOption === 'laser' && (
            <>
              <Table>
                <thead>
                  <tr>
                    <th>Pregunta</th>
                    <th>Respuesta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formQuestions.slice(10, 13).filter((question: any) => question.role_id === 3 && question.areas.some((area: any) => area.id === 10))
                    .map((question: any) => {
                      // Como no mostraste la estructura de las respuestas aquí, lo dejo vacío
                      const frontAnswer = null;
                      const vueltaAnswer = null;
                      return (
                        <tr key={question.id}>
                          <td>{question.title}</td>
                          <td><input type="checkbox" checked={false} disabled /></td>
                          <td>
                            <button style={{ marginRight: '8px' }} onClick={() => {
                              setEditingId(question.id);
                              setNewTitle(question.title);
                            }}><FaEdit /></button>
                            <button onClick={() => setDeletingId(question.id)}><FaTrash /></button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <InputGroup style={{ width: '50%', marginTop: '20px' }}>
                <Label>Verificar Script / Layout Vs Ot /Autorización, Favor De Anotar:</Label>
                <Input type="number" readOnly />
              </InputGroup>
              <InputGroup style={{ width: '50%', marginTop: '20px' }}>
                <Label>Validar, Anotar Kcv (Llaves), Carga De Aplicación O Prehabilitación (Si Aplica):</Label>
                <Input type="number" readOnly />
              </InputGroup>
              <InputGroup style={{ width: '50%', marginTop: '20px' }}>
                <Label>Describir Apariencia Del Quemado Del Láser (Color):</Label>
                <Input type="number" readOnly />
              </InputGroup>
            </>
          )}


        </NewData>
      </NewData>
      {editingId !== null && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Editar Pregunta</ModalTitle>
            <CustomInput
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <ModalActions>
              <Button
                style={{ backgroundColor: '#BBBBBB' }}
                onClick={() => setEditingId(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleUpdateTitle(editingId, newTitle)}
              >
                Guardar
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
      {deletingId !== null && (
        <ModalOverlay>
          <ModalContent style={{ width: '400px' }}>
            <ModalTitle>Eliminar esta pregunta</ModalTitle>
            <p>¿Estás segura/o de que deseas eliminar esta pregunta? Esta acción no se puede deshacer.</p>
            <ModalActions>
              <Button
                style={{ backgroundColor: '#BBBBBB' }}
                onClick={() => setDeletingId(null)}
              >
                Cancelar
              </Button>
              <Button
                style={{ backgroundColor: '#D9534F' }}
                onClick={() => handleDeleteQuestion(deletingId)}
              >
                Eliminar
              </Button>
            </ModalActions>
          </ModalContent>
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
  max-width: 880px;
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

const CustomInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 12px;
  border: 1px solid gray;
  border-radius: 4px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  font-size: 16px;
  white-space: nowrap;
  overflow-x: auto;

  &:focus {
    border-color: black;
  }
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
    border-color: #2563eb;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1rem;
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
  width: 600px;
  text-align: center;
`;

const ModalTitle = styled.h3`
  margin-bottom: 1rem;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 1rem;
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