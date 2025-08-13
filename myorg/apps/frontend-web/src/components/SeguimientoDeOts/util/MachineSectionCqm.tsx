// myorg/apps/frontend-web/src/components/SeguimientoDeOts/util/MachineSectionCqm.tsx
import styled from 'styled-components';

interface MachineSectionProps {
  machine: string;
  visible: boolean;
  questions: any[];
  areaId: number;
  roleId: number | null;
  questionSlice?: [number, number];
  extras?: React.ReactNode;
  title?: string;
  answers: { question_id: number; response_cqm: any }[];
}

export function MachineSectionCqm({
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
      <Table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Pregunta</th>
            <th className="p-2 text-center">Respuesta</th>
          </tr>
        </thead>
        <tbody>
          {filteredQuestions.map((q) => {
            const answer = answers.find((a) => a.question_id === q.id);
            const operatorResponse = answer?.response_cqm;

            return (
              <tr key={q.id} className="border-t">
                <td className="p-2">{q.title}</td>
                <td className="text-center p-2">
                  {typeof operatorResponse === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={operatorResponse}
                      disabled
                    />
                  ) : (
                    <span>
                      {operatorResponse !== undefined &&
                      operatorResponse !== null
                        ? operatorResponse.toString()
                        : ''}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      {extras}
    </>
  );
}

const Table = styled.table`
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 20px;
  border: 1px solid #e5e7eb;
  color: black;

  th,
  td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background-color: #f3f4f6;
    color: #374151;
  }
`;
