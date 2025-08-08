// apps/frontend-web/src/components/LiberarProducto/util/MachineSection.tsx

interface MachineSectionProps {
  machine: string;
  visible: boolean;
  questions: any[];
  areaId: number;
  roleId: number | null;
  questionSlice?: [number, number];
  extras?: React.ReactNode;
  title?: string;
  checkedQuestions?: number[];
  onCheckToggle?: (id: number, checked: boolean) => void;
}

export function MachineSection({
  visible,
  questions,
  areaId,
  roleId,
  questionSlice,
  extras,
  title,
  checkedQuestions = [],
  onCheckToggle,
}: MachineSectionProps) {
  if (!visible) return null;

  // 🔍 Primero filtra por role y área
  const filteredQuestions = (questionSlice
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
      <table
        style={{
          width: '100%',
          marginBottom: '1rem',
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '0.5rem',
                background: '#f3f4f6',
              }}
            >
              Pregunta
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '0.5rem',
                background: '#f3f4f6',
              }}
            >
              Respuesta
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredQuestions.map((q) => (
            <tr key={q.id}>
              <td style={{ padding: '0.5rem' }}>{q.title}</td>
              <td style={{ padding: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={checkedQuestions.includes(q.id)}
                  onChange={(e) => onCheckToggle?.(q.id, e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {extras}
    </>
  );
}
