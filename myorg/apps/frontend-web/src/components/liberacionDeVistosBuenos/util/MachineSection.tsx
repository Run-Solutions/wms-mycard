// myorg/apps/frontend-web/src/components/liberacionDeVistosBuenos/util/MachineSection.tsx
import React from 'react';
import styled from 'styled-components';


type Role = 'operator' | 'cqm';
export interface FormAnswerResponse {
  question_id: number;
  response_operator: boolean | null;
  response_cqm: boolean | null;
}
interface MachineSectionProps {
  machine: string;
  visible: boolean;
  questions: any[];
  areaId: number;
  roleId: Role; // operador o cqm (elige el campo)
  filterRoleId: number | null;
  questionSlice?: [number, number];
  extras?: React.ReactNode;
  title?: string;
  answers: FormAnswerResponse[];
  readOnly?: boolean;
  onToggle?: (
    questionId: number,
    colIndex: number,
    value: true | false | null
  ) => void;
}

export function MachineSection({
  visible,
  questions,
  areaId,
  roleId,
  filterRoleId,
  questionSlice,
  extras,
  title,
  readOnly = true,
  answers,
  onToggle,
}: MachineSectionProps) {
  if (!visible) return null;
  const cols = ['Respuesta'];

  // 🔍 Filtrar preguntas por rol
  const filteredQuestions = (questionSlice
    ? questions.slice(questionSlice[0], questionSlice[1])
    : questions
  ).filter((q) => q.role_id === filterRoleId);
  const getValues = (qid: number): (boolean | null | undefined)[] => {
    const rows = answers.filter((r) => r.question_id === qid);
    // aseguramos 2 slots (frente/vuelta). Para 'simple' usamos sólo el [0]
    const v0 =
    roleId === 'operator'
        ? rows[0]?.response_operator ?? false
        : rows[0]?.response_cqm ?? false;
    const v1 =
    roleId === 'operator'
        ? rows[1]?.response_operator ?? false
        : rows[1]?.response_cqm ?? false;
    return [v0, v1];
  };
  const handleChange = (
    qid: number,
    colIndex: number,
    kind: 'ok' | 'ng',
    checked: boolean
  ) => {
    if (!onToggle) return;
    // Exclusividad: si marcas OK => true; si marcas NG => false; desmarcar => null
    const newVal: true | false | null = checked
      ? kind === 'ok'
        ? true
        : false
      : null;
    onToggle(qid, colIndex, newVal);
  };

  return (
    <>
      <Table className="min-w-full text-sm">
        <thead>
        <tr>
          <th rowSpan={2} className="p-2 text-left">
            Pregunta
          </th>
          {cols.map((col, i) => (
            <th key={`group-${i}`} colSpan={2} className="p-2 text-center">
              {col}
            </th>
          ))}
        </tr>
        <tr>
          {cols.flatMap((_, i) => [
            <th key={`ok-${i}`} className="p-2 text-center">
              OK
            </th>,
            <th key={`ng-${i}`} className="p-2 text-center">
              NG
            </th>,
          ])}
        </tr>
        </thead>
        <tbody>
          {filteredQuestions.map((q) => {
            const values = getValues(q.id);

          return (
            <tr key={q.id} className="border-t">
              <td className="p-2">{q.title}</td>

              {cols.map((_, colIndex) => {
                const v = values[colIndex]; // boolean | null | undefined
                const okChecked = v === true;
                const ngChecked = v === false;

                return (
                  <React.Fragment key={`col-${q.id}-${colIndex}`}>
                    <td className="text-center p-2">
                      <CheckboxOk
                        type="checkbox"
                        disabled={readOnly}
                        checked={okChecked}
                        onChange={(e) =>
                          handleChange(q.id, colIndex, 'ok', e.target.checked)
                        }
                      />
                    </td>
                    <td className="text-center p-2">
                      <CheckboxNg
                        type="checkbox"
                        disabled={readOnly}
                        checked={ngChecked}
                        onChange={(e) =>
                          handleChange(q.id, colIndex, 'ng', e.target.checked)
                        }
                      />
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          );
          })}
        </tbody>
      </Table>
      {extras}
    </>
  );
};

export const OperatorAdvanceMachineTable: React.FC<
  Omit<MachineSectionProps, 'roleId' | 'filterRoleId'>
> = (props) => (
  <MachineSection {...props} roleId="operator" filterRoleId={null} />
);
export const CqmAdvanceMachineTable: React.FC<
  Omit<MachineSectionProps, 'roleId' | 'filterRoleId'>
> = (props) => (
  <MachineSection {...props} roleId="operator" filterRoleId={null} />
);

// Estilos (puedes reusar tu <Table/> existente)
const Table = styled.table`
  width: 100%;
  margin-top: 1rem;
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
