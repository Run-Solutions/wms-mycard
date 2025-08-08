// myorg/apps/frontend-web/src/components/liberacionDeVistosBuenos/util/MachineSectionEdit.tsx
interface MachineSectionEditProps {
    visible: boolean;
    questions: any[];
    roleId: number | null;
    questionSlice?: [number, number];
    checkedQuestions: number[];
    onCheckToggle: (id: number, checked: boolean) => void;
    title?: string;
    extras?: React.ReactNode;
  }
  
  export function MachineSectionEdit({
    visible,
    questions,
    roleId,
    questionSlice,
    checkedQuestions,
    onCheckToggle,
    title,
    extras,
  }: MachineSectionEditProps) {
    if (!visible) return null;
  
    const filteredQuestions = (questionSlice
      ? questions.slice(questionSlice[0], questionSlice[1])
      : questions
    ).filter((q) => q.role_id === roleId);
  
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
              <th style={{ textAlign: 'left', padding: '0.5rem', background: '#f3f4f6' }}>
                Pregunta
              </th>
              <th style={{ textAlign: 'left', padding: '0.5rem', background: '#f3f4f6' }}>
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
                    onChange={(e) => onCheckToggle(q.id, e.target.checked)}
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