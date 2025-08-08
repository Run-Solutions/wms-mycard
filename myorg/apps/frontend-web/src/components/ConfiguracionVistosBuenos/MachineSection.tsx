// myorg/apps/frontend-web/src/components/ConfiguracionVistosBuenos/MachineSection.tsx

import { FaEdit, FaTrash } from 'react-icons/fa';

interface MachineSectionProps {
  machine: string;
  visible: boolean;
  questions: any[];
  areaId: number;
  roleId: number | null;
  questionSlice?: [number, number];
  extras?: React.ReactNode;
  onEdit?: (id: number, title: string) => void;
  onDelete?: (id: number) => void;
  title?: string; // ✅ Título visual opcional
}

export function MachineSection({
  visible,
  questions,
  areaId,
  roleId,
  questionSlice,
  extras,
  onEdit = () => {},
  onDelete = () => {},
  title,
}: MachineSectionProps) {
  if (!visible) return null;

  const filteredQuestions = (questionSlice
    ? questions.slice(questionSlice[0], questionSlice[1])
    : questions
  ).filter(
    (q) =>
      q.role_id === roleId &&
      q.areas.some((area: any) => area.id === areaId)
  );

  return (
    <>
      {title && (
        <h4 style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.1rem' }}>
          {title}
        </h4>
      )}
      <table style={{ width: '100%', marginBottom: '1rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.5rem', background: '#f3f4f6' }}>Pregunta</th>
            <th style={{ textAlign: 'left', padding: '0.5rem', background: '#f3f4f6' }}>Respuesta</th>
            <th style={{ textAlign: 'left', padding: '0.5rem', background: '#f3f4f6' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredQuestions.map((q) => (
            <tr key={q.id}>
              <td style={{ padding: '0.5rem' }}>{q.title}</td>
              <td style={{ padding: '0.5rem' }}>
                <input type="checkbox" checked={false} disabled />
              </td>
              <td style={{ padding: '0.5rem' }}>
                <button
                  style={{ marginRight: '8px' }}
                  onClick={() => onEdit(q.id, q.title)}
                >
                  <FaEdit />
                </button>
                <button onClick={() => onDelete(q.id)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {extras}
    </>
  );
}