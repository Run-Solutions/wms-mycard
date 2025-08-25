// myorg/apps/frontend-web/src/components/ConfiguracionVistosBuenos/FormQuestionTable.tsx
import { FaEdit, FaTrash } from 'react-icons/fa';
import styled from 'styled-components';
import React from 'react';

interface Area {
  id: number;
  name: string;
}

interface FormQuestion {
  id: number;
  title: string;
  role_id: number | null;
  areas: Area[];
}

interface Props {
  formQuestions: FormQuestion[];
  areaId: number;
  roleId: number | null;             // null => no filtrar por rol
  columns?: string[];                // p.ej. ['Frente','Vuelta'] o ['Respuesta']
  onEdit: (id: number, currentTitle: string) => void;
  onDelete: (id: number) => void;
}

export const FormQuestionTable = ({
  formQuestions,
  areaId,
  roleId,
  columns = ['Respuesta'],
  onEdit,
  onDelete,
}: Props) => {
  // Si roleId es null => no filtramos por role_id
  const filtered = formQuestions.filter(
    (q) => (roleId == null || q.role_id === roleId) && q.areas?.some((a) => a.id === areaId)
  );

  return (
    <Table>
      <thead>
        <tr>
          <th rowSpan={2} className="p-2 text-left">Pregunta</th>
          {columns.map((col, i) => (
            <th key={`group-${i}`} colSpan={2} className="p-2 text-center">
              {col}
            </th>
          ))}
          <th rowSpan={2}>Acciones</th>
        </tr>
        <tr>
          {columns.flatMap((_, i) => [
            <th key={`ok-${i}`} className="p-2 text-center">OK</th>,
            <th key={`ng-${i}`} className="p-2 text-center">NG</th>,
          ])}
        </tr>
      </thead>

      <tbody>
        {filtered.map((question) => (
          <tr key={question.id}>
            <td>{question.title}</td>

            {columns.map((_, i) => (
              <React.Fragment key={`col-${question.id}-${i}`}>
                <td className="text-center p-2">
                  <CheckboxOk type="checkbox" disabled /* value estático en modo config */ />
                </td>
                <td className="text-center p-2">
                  <CheckboxNg type="checkbox" disabled />
                </td>
              </React.Fragment>
            ))}

            <td>
              <button
                onClick={() => onEdit(question.id, question.title)}
                aria-label={`Editar pregunta ${question.title}`}
              >
                <FaEdit />
              </button>
              <button
                onClick={() => onDelete(question.id)}
                aria-label={`Eliminar pregunta ${question.title}`}
                style={{ marginLeft: 8 }}
              >
                <FaTrash />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

const Table = styled.table`
  width: 100%;
  margin-top: 1rem;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 1rem;
  overflow: hidden;
  font-size: 0.95rem;
  background-color: #ffffff;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #9a9da1;
  }

  th {
    background-color: #9a9da1;
    color: #374151;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.03em;
  }

  tr:nth-child(even) td { background-color: #fdfdfd; }
  tr:hover td { background-color: #f3f4f6; transition: background-color 0.15s ease-in-out; }
`;

const CheckboxOk = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  -webkit-appearance: none;
  width: 18px; height: 18px;
  border: 2px solid #0038a8;
  border-radius: 4px;
  cursor: pointer;
  background: white;
  position: relative;
  transition: all 0.2s;
  &:checked { background-color: #0038a8; border-color: #0038a8; }
  &:checked::after {
    content: '✓'; position: absolute; top: -3px; left: 1px;
    font-size: 14px; color: white; font-weight: bold;
  }
`;

const CheckboxNg = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  -webkit-appearance: none;
  width: 20px; height: 20px;
  border: 2px solid #dc2626;
  border-radius: 4px;
  cursor: pointer;
  background: white;
  position: relative;
  transition: all 0.2s;
  &:checked { background-color: #dc2626; border-color: #dc2626; }
  &:checked::after {
    content: '✗'; position: absolute; top: -3px; left: 4px;
    font-size: 14px; color: white; font-weight: bold;
  }
`;