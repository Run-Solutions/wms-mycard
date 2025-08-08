// myorg/apps/frontend-web/src/components/liberacionDeVistosBuenos/util/MachineSection.tsx

interface MachineSectionProps {
  machine: string;
  visible: boolean;
  questions: any[];
  areaId: number;
  roleId: number | null;
  questionSlice?: [number, number];
  extras?: React.ReactNode;
  title?: string;
  answers: { question_id: number; response_operator: any }[];
}

export function MachineSection({
  visible,
  questions,
  areaId,
  roleId,
  questionSlice,
  extras,
  title,
  answers,
}: MachineSectionProps) {
  if (!visible) return null;

  // 🔍 Filtrar preguntas por rol
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
          {filteredQuestions.map((q) => {
            const answer = answers.find((a) => a.question_id === q.id);
            const operatorResponse = answer?.response_operator;

            return (
              <tr key={q.id}>
                <td style={{ padding: '0.5rem' }}>{q.title}</td>
                <td style={{ padding: '0.5rem' }}>
                  {typeof operatorResponse === 'boolean' ? (
                    <input type="checkbox" checked={operatorResponse} disabled />
                  ) : (
                    <span>
                      {operatorResponse !== undefined && operatorResponse !== null
                        ? operatorResponse.toString()
                        : ''}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {extras}
    </>
  );
}