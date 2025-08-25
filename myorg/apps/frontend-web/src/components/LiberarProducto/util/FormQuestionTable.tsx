import React from 'react';
import styled from 'styled-components';

interface Area {
  id: number;
  name: string;
}

interface Props {
  formQuestions: any[];
  roleId: number | null;
  columns?: string[];
  checkedQuestions: { ok: number[]; ng: number[] }[];
  onToggle: (
    id: number,
    columnIndex: number,
    type: 'ok' | 'ng',
    checked: boolean
  ) => void;
  readOnly?: boolean;
}

export const SelectionQuestionTable = ({
  formQuestions,
  roleId,
  columns = ['Respuesta'],
  checkedQuestions,
  onToggle,
}: Props) => {
  const filtered = formQuestions.filter((q) => q.role_id === roleId);

  return (
    <Table>
      <thead>
        <tr>
          <th rowSpan={2}>Pregunta</th>
          {columns.map((col, i) => (
            <th key={i} colSpan={2}>
              {col}
            </th>
          ))}
        </tr>
        <tr>
          {columns.flatMap((_, i) => [
            <th key={`ok-${i}`}>OK</th>,
            <th key={`ng-${i}`}>NG</th>,
          ])}
        </tr>
      </thead>
      <tbody>
        {filtered.map((question) => (
          <tr key={question.id}>
            <td>{question.title}</td>
            {columns.map((_, colIndex) => (
              <React.Fragment key={`col-${colIndex}`}>
                <td>
                  <CheckboxOk
                    checked={
                      checkedQuestions[colIndex]?.ok.includes(question.id) ||
                      false
                    }
                    onChange={(e) =>
                      onToggle(question.id, colIndex, 'ok', e.target.checked)
                    }
                  />
                </td>
                <td>
                  <CheckboxNg
                    checked={
                      checkedQuestions[colIndex]?.ng.includes(question.id) ||
                      false
                    }
                    onChange={(e) =>
                      onToggle(question.id, colIndex, 'ng', e.target.checked)
                    }
                  />
                </td>
              </React.Fragment>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 1rem;
  overflow: hidden; /* para que el border-radius afecte al contenido */
  font-size: 0.95rem;
  background-color: #ffffff;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  th,
  td {
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

  tr:nth-child(even) td {
    background-color: #fdfdfd;
  }

  tr:hover td {
    background-color: #f3f4f6;
    transition: background-color 0.15s ease-in-out;
  }
`;

// Checkbox con chulo
const CheckboxOk = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #0038a8; /* verde */
  border-radius: 4px;
  cursor: pointer;
  background: white;
  position: relative;
  transition: all 0.2s;

  &:checked {
    background-color: #0038a8;
    border-color: #0038a8;
  }

  &:checked::after {
    content: '✓';
    position: absolute;
    top: -3px;
    left: 1px;
    font-size: 14px;
    color: white;
    font-weight: bold;
  }
`;

// Checkbox con equis
const CheckboxNg = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #dc2626; /* rojo */
  border-radius: 4px;
  cursor: pointer;
  background: white;
  position: relative;
  transition: all 0.2s;

  &:checked {
    background-color: #dc2626;
    border-color: #dc2626;
  }

  &:checked::after {
    content: '✗';
    position: absolute;
    top: -3px;
    left: 4px;
    font-size: 14px;
    color: white;
    font-weight: bold;
  }
`;
export default SelectionQuestionTable;
