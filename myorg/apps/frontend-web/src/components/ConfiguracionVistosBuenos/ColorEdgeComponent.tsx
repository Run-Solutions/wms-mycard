'use client'

import { useRouter } from "next/navigation";
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useState } from "react";
import styled from "styled-components";
import { deleteFormQuestion, updateFormQuestion } from "@/api/configVistosBuenos";
import { FormQuestionTable } from "./FormQuestionTable";

interface Props {
  formQuestion: any;
}

interface Question {
  id: number;
  title: string;
}

export default function ColorEdgeComponent({ formQuestion }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formQuestions, setFormQuestions] = useState<any[]>(formQuestion); 

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
      <Title>Área a evaluar: Color Edge</Title>

      <NewData>
        <SectionTitle>Respuestas del operador</SectionTitle>
        <NewDataWrapper>
          <FormQuestionTable
            formQuestions={formQuestions}
            areaId={7}
            roleId={null}
            columns={['Respuesta']}
            onEdit={(id, title) => {
              setEditingId(id);
              setNewTitle(title);
            }}
            onDelete={(id) => setDeletingId(id)}
          />
          <InputGroup style={{ width: '50%'}}>
              <Label>Muestras entregadas:</Label>
              <Input type="number" readOnly />
          </InputGroup>
        </NewDataWrapper>

        <InputGroup>
          <SectionTitle>Mis respuestas</SectionTitle>
          <InputGroup style={{ width: '50%'}}>
              <Label>No hay preguntas por parte de calidad.</Label>
          </InputGroup>
        </InputGroup>
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
          <ModalContent style={{ width: '400px'}}>
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