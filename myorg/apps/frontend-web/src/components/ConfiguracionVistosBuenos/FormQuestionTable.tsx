// myorg/apps/frontend-web/src/components/ConfiguracionVistosBuenos/FormQuestionTable.tsx
import { FaEdit, FaTrash } from 'react-icons/fa';
import styled from 'styled-components';

interface Area {
  id: number;
  name: string;
}

interface Props {
  formQuestions: any[];
  areaId: number;
  roleId: number | null;
  columns?: string[];
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
  const filtered = formQuestions.filter(
    (q) => q.role_id === roleId && q.areas.some((a: Area) => a.id === areaId)
  );

  return (
    <Table>
      <thead>
        <tr>
          <th>Pregunta</th>
          {columns.map((col, i) => (
            <th key={i}>{col}</th>
          ))}
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((question) => (
          <tr key={question.id}>
            <td>{question.title}</td>
            {columns.map((_, i) => (
              <td key={i}><input type="checkbox" checked={false} disabled /></td>
            ))}
            <td>
              <button onClick={() => onEdit(question.id, question.title)}>
                <FaEdit />
              </button>
              <button onClick={() => onDelete(question.id)}>
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