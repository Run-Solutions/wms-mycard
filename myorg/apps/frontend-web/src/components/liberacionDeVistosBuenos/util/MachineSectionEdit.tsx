// myorg/apps/frontend-web/src/components/liberacionDeVistosBuenos/util/MachineSectionEdit.tsx
import React from 'react';
import styled from 'styled-components';

export interface CheckedState {
  ok: number[];
  ng: number[];
}

interface MachineSectionEditProps {
  visible: boolean;
  questions: any[];
  roleId: number | null;
  columns?: string[];
  questionSlice?: [number, number];
  checkedQuestions: CheckedState[];
  onCheckToggle: (
    id: number,
    colIndex: number,
    type: 'ok' | 'ng',
    checked: boolean
  ) => void;
  title?: string;
  extras?: React.ReactNode;
}

export function MachineSectionEdit({
  visible,
  questions,
  roleId,
  questionSlice,
  columns = ['Respuesta'],
  checkedQuestions,
  onCheckToggle,
  title,
  extras,
}: MachineSectionEditProps) {
  if (!visible) return null;

  const filteredQuestions = (
    questionSlice
      ? questions.slice(questionSlice[0], questionSlice[1])
      : questions
  ).filter((q) => q.role_id === roleId);

  return (
    <>
      {title && (
        <h4
          style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.1rem' }}
        >
          {title}
        </h4>
      )}
      <Table>
        <thead>
          <tr>
            <th rowSpan={2}>Pregunta</th>
            {columns.map((col, i) => [
              <th key={`hdr-${i}`} colSpan={2}>
                {col}
              </th>,
            ])}
          </tr>
          <tr>
            {columns.flatMap((_, i) => [
              <th key={`ok-${i}`}>OK</th>,
              <th key={`ng-${i}`}>NG</th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {filteredQuestions.map((q) => (
            <tr key={q.id}>
              <td>{q.title}</td>
              {columns.map((_, colIndex) => (
                <React.Fragment key={`col-${q.id}-${colIndex}`}>
                  <td>
                    <CheckboxOk
                      checked={
                        checkedQuestions[colIndex]?.ok.includes(q.id) || false
                      }
                      onChange={(e) =>
                        onCheckToggle(q.id, colIndex, 'ok', e.target.checked)
                      }
                    />
                  </td>
                  <td>
                    <CheckboxNg
                      checked={
                        checkedQuestions[colIndex]?.ng.includes(q.id) || false
                      }
                      onChange={(e) =>
                        onCheckToggle(q.id, colIndex, 'ng', e.target.checked)
                      }
                    />
                  </td>
                </React.Fragment>
              ))}
            </tr>
          ))}
        </tbody>
        </Table>
        {extras}
    </>
  );
}
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

// Checkbox con chulo (OK)
const CheckboxOk = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #0038a8;
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Checkbox con equis (NG)
const CheckboxNg = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #dc2626;
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;