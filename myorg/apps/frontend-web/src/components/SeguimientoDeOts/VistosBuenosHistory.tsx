import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { MachineSection } from './util/MachineSection';
import { MachineSectionCqm } from './util/MachineSectionCqm';

interface Question {
  id: number;
  title: string;
  role_id: number;
}

interface FormAnswerResponse {
  question_id: number;
  response_operator: boolean | null;
  response_cqm: boolean | null;
}

interface FormAnswer {
  [key: string]: any;
  sample_quantity: number;
  tipo_personalizacion: string;
  FormAnswerResponse: FormAnswerResponse[];
}

interface AreaHistory {
  areaName: string;
  created_at: string;
  username: string;
  questions: Question[];
  formAnswers: FormAnswer[]; // múltiples evaluaciones por área
  mode: 'doble' | 'simple';
}

interface Props {
  history: AreaHistory[];
  qualitySectionOpen: boolean;
  toggleQualitySection: () => void;
}

// helpers pequeñitos
const isTruthyBool = (v: any) => (typeof v === 'boolean' ? v : false);

export const VistosBuenosHistory: React.FC<Props> = ({
  history,
  qualitySectionOpen,
  toggleQualitySection,
}) => {
  const [openAreas, setOpenAreas] = useState<Set<string>>(() => new Set());
  const [openEvals, setOpenEvals] = useState<Set<string>>(() => new Set());

  // claves únicas estables (area & eval)
  const areaKey = (areaIdx: number) => `area-${areaIdx}`;
  const evalKey = (areaIdx: number, evalIdx: number) =>
    `area-${areaIdx}::eval-${evalIdx}`;

  // opcional: abrir todo por defecto la 1a vez si la sección global está abierta
  useMemo(() => {
    if (qualitySectionOpen && openAreas.size === 0) {
      // no abrimos nada por defecto; si quieres abrir todo, descomenta:
      // setOpenAreas(new Set(history.map((_, i) => areaKey(i))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qualitySectionOpen]);

  const toggleArea = (i: number) => {
    const k = areaKey(i);
    setOpenAreas((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const toggleEval = (i: number, j: number) => {
    const k = evalKey(i, j);
    setOpenEvals((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };
  if (history.length === 0)
    return (
      <div className="bg-yellow-100 text-yellow-800 p-4 rounded-xl mt-4 mb-2">
        ⚠️ No hay vistos buenos registrados.
      </div>
    );

  return (
    <div className="mt-10">
      {/* toggle global */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">
          Historial de Vistos Buenos
        </h3>
        <button
          onClick={toggleQualitySection}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          {qualitySectionOpen ? 'Ocultar' : 'Mostrar'}
          <span>{qualitySectionOpen ? '▼' : '▶'}</span>
        </button>
      </div>

      {!qualitySectionOpen ? null : (
        <>
          {history.map((entry, areaIdx) => {
            const aKey = areaKey(areaIdx);
            const areaOpen = openAreas.has(aKey);

            return (
              <div
                key={`${entry.areaName}-${areaIdx}`}
                className="bg-white shadow rounded-xl p-6 mb-6"
              >
                {/* Header de área con toggle */}
                <button
                  type="button"
                  onClick={() => toggleArea(areaIdx)}
                  className="w-full text-left flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-lg font-semibold text-blue-800">
                      Área a evaluar: {entry.areaName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      <strong>Operador:</strong> {entry.username}
                    </p>
                  </div>
                  <span className="text-gray-500 ml-4">
                    {areaOpen ? '▼' : '▶'}
                  </span>
                </button>

                {!areaOpen ? null : (
                  <div className="mt-4">
                    {entry.formAnswers.map((formAnswer, evalIdx) => {
                      const eKey = evalKey(areaIdx, evalIdx);
                      const evalOpen = openEvals.has(eKey);

                      return (
                        <div
                          key={`fa-${evalIdx}`}
                          className="border rounded-lg mb-4"
                        >
                          {/* Header de evaluación con toggle */}
                          <button
                            type="button"
                            onClick={() => toggleEval(areaIdx, evalIdx)}
                            className="w-full flex items-center justify-between bg-gray-50 px-4 py-2"
                          >
                            <h5 className="text-sm font-semibold text-gray-700">
                              Evaluación #{evalIdx + 1}
                            </h5>
                            <span className="text-gray-500">
                              {evalOpen ? '▼' : '▶'}
                            </span>
                          </button>

                          {!evalOpen ? null : (
                            <div className="p-4">
                              <p className="text-sm text-gray-600">
                                <strong>Fecha de Creación:</strong>{' '}
                                {new Date(
                                  entry.formAnswers[0].created_at
                                ).toLocaleString()}
                              </p>
                              {entry.formAnswers[0].tipo_personalizacion !==
                                null && (
                                <>
                                  <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                                    <strong>Tipo de personalización</strong>
                                    <Input
                                      type="text"
                                      value={
                                        formAnswer.tipo_personalizacion ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                  </div>
                                </>
                              )}
                              {/* Tabla de preguntas/respuestas */}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                null && (
                                <>
                                  <Table className="min-w-full border text-sm">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="p-2 text-left">
                                          Pregunta
                                        </th>
                                        {entry.mode === 'doble' &&
                                        entry.formAnswers[0]
                                          .tipo_personalizacion === null ? (
                                          <>
                                            <th className="p-2 text-center">
                                              Hoja Frente
                                            </th>
                                            <th className="p-2 text-center">
                                              Hoja Vuelta
                                            </th>
                                          </>
                                        ) : (
                                          <th className="p-2 text-center">
                                            Respuesta
                                          </th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {entry.formAnswers[0]
                                        .tipo_personalizacion === null &&
                                        entry.questions
                                          .filter((q) => q.role_id === null)
                                          .map((q) => {
                                            const respuestas = (
                                              formAnswer.FormAnswerResponse ||
                                              []
                                            ).filter(
                                              (r: FormAnswerResponse) =>
                                                r.question_id === q.id
                                            );
                                            const frontAnswer =
                                              respuestas[0]?.response_operator;
                                            const vueltaAnswer =
                                              respuestas[1]?.response_operator;
                                            const respuestaSimple =
                                              respuestas[0]?.response_operator;

                                            return (
                                              <tr
                                                key={`q-${q.id}`}
                                                className="border-t"
                                              >
                                                <td className="p-2">
                                                  {q.title}
                                                </td>
                                                {entry.mode === 'doble' ? (
                                                  <>
                                                    <td className="text-center p-2">
                                                      <input
                                                        type="checkbox"
                                                        disabled
                                                        checked={isTruthyBool(
                                                          frontAnswer
                                                        )}
                                                      />
                                                    </td>
                                                    <td className="text-center p-2">
                                                      <input
                                                        type="checkbox"
                                                        disabled
                                                        checked={isTruthyBool(
                                                          frontAnswer
                                                        )}
                                                      />
                                                    </td>
                                                  </>
                                                ) : (
                                                  <td className="text-center p-2">
                                                    {typeof respuestas[0]
                                                      ?.response_operator ===
                                                    'boolean' ? (
                                                      <input
                                                        type="checkbox"
                                                        disabled
                                                        checked={
                                                          respuestas[0]
                                                            ?.response_operator ??
                                                          false
                                                        }
                                                      />
                                                    ) : (
                                                      <span>
                                                        {respuestas[0]
                                                          ?.response_operator ??
                                                          '—'}
                                                      </span>
                                                    )}
                                                  </td>
                                                )}
                                              </tr>
                                            );
                                          })}
                                    </tbody>
                                  </Table>
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'laser' && (
                                <>
                                  <div className="mt-3 text-sm flex flex-col gap-3">
                                    <strong>
                                      No hay preguntas por parte del operador.
                                    </strong>
                                  </div>
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'persos' && (
                                <>
                                  <MachineSection
                                    visible
                                    machine="Personalización"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    roleId={null}
                                    questionSlice={[1, 10]}
                                    answers={
                                      formAnswer.FormAnswerResponse ?? []
                                    }
                                    extras={
                                      <InputGroup style={{ width: '70%' }}>
                                        <div className="mt-3 text-sm flex flex-col gap-3">
                                          <Label>
                                            Color De Personalización:
                                          </Label>
                                          <Input
                                            type="text"
                                            value={
                                              formAnswer.color_personalizacion ??
                                              'No se reconoce la muestra enviada'
                                            }
                                            readOnly
                                          />
                                          <Label>
                                            Tipo de Código de Barras Que Se
                                            Personaliza:
                                          </Label>
                                          <Input
                                            type="text"
                                            value={
                                              formAnswer.codigo_barras ??
                                              'No se reconoce la muestra enviada'
                                            }
                                            readOnly
                                          />
                                        </div>
                                      </InputGroup>
                                    }
                                  />
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'etiquetadora' && (
                                <>
                                  <MachineSection
                                    visible
                                    machine="etiquetadora"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    roleId={null}
                                    questionSlice={[0, 1]}
                                    answers={
                                      formAnswer.FormAnswerResponse ?? []
                                    }
                                    extras={
                                      <InputGroup style={{ width: '70%' }}>
                                        <div className="mt-3 text-sm flex flex-col gap-3">
                                          <Label>
                                            Verificar Tipo De Etiqueta Vs Ot Y
                                            Pegar Utilizada:
                                          </Label>
                                          <Input
                                            type="text"
                                            value={
                                              formAnswer.verificar_etiqueta ??
                                              'No se reconoce la muestra enviada'
                                            }
                                            readOnly
                                          />
                                        </div>
                                      </InputGroup>
                                    }
                                  />
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'packsmart' && (
                                <>
                                  <MachineSection
                                    visible
                                    machine="packsmart"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    roleId={null}
                                    questionSlice={[14, 20]}
                                    answers={
                                      formAnswer.FormAnswerResponse ?? []
                                    }
                                    extras={<> </>}
                                  />
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'otto' && (
                                <>
                                  <MachineSection
                                    visible
                                    machine="otto"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    roleId={null}
                                    questionSlice={[20, 28]}
                                    answers={
                                      formAnswer.FormAnswerResponse ?? []
                                    }
                                    extras={<> </>}
                                  />
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'embolsadora' && (
                                <>
                                  <MachineSection
                                    visible
                                    machine="embolsadora"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    roleId={null}
                                    questionSlice={[28, 30]}
                                    answers={
                                      formAnswer.FormAnswerResponse ?? []
                                    }
                                    extras={<> </>}
                                  />
                                </>
                              )}
                              {/* Muestras */}
                              {entry.areaName === 'laminacion' && (
                                <>
                                  <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                                    <strong>Valor de Anclaje Obtenido:</strong>
                                    <Input
                                      type="text"
                                      value={
                                        formAnswer.valor_anclaje ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                    <strong>
                                      Validar Acabado Vs Orden De Trabajo:
                                    </strong>
                                    <Input
                                      type="text"
                                      value={
                                        formAnswer.finish_validation ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                  </div>
                                </>
                              )}
                              {entry.areaName === 'hot stamping' && (
                                <>
                                  <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                                    <strong>Color Foil:</strong>
                                    <Input
                                      type="text"
                                      value={
                                        formAnswer.color_foil ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                    <strong>Revisar Posición Vs Ot:</strong>
                                    <RadioGroup>
                                      <RadioLabel>
                                        <input
                                          type="checkbox"
                                          value="holograma"
                                          checked={
                                            formAnswer.revisar_posicion ===
                                              'holograma' ||
                                            formAnswer.revisar_posicion ===
                                              'hologramafoil'
                                          }
                                          disabled
                                        />
                                        Holograma
                                      </RadioLabel>
                                      <RadioLabel>
                                        <input
                                          type="checkbox"
                                          value="foil"
                                          checked={
                                            formAnswer.revisar_posicion ===
                                              'foil' ||
                                            formAnswer.revisar_posicion ===
                                              'hologramafoil'
                                          }
                                          disabled
                                        />
                                        Foil
                                      </RadioLabel>
                                    </RadioGroup>
                                    <strong>Imagen de Holograma Vs Ot:</strong>
                                    <RadioGroup>
                                      <RadioLabel>
                                        <input
                                          type="checkbox"
                                          value="holograma"
                                          checked={
                                            formAnswer.imagen_holograma ===
                                              'holograma' ||
                                            formAnswer.imagen_holograma ===
                                              'hologramafoil'
                                          }
                                          disabled
                                        />
                                        Holograma
                                      </RadioLabel>
                                      <RadioLabel>
                                        <input
                                          type="checkbox"
                                          value="foil"
                                          checked={
                                            formAnswer.imagen_holograma ===
                                              'foil' ||
                                            formAnswer.imagen_holograma ===
                                              'hologramafoil'
                                          }
                                          disabled
                                        />
                                        Foil
                                      </RadioLabel>
                                    </RadioGroup>
                                  </div>
                                </>
                              )}
                              {entry.areaName === 'milling chip' && (
                                <>
                                  <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                                    <strong>
                                      Revisar Tecnología De Chip y Color Vs Ot:
                                    </strong>
                                    <Input
                                      type="text"
                                      value={
                                        formAnswer.revisar_tecnologia ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                    <strong>
                                      Validar y Anotar KCV (Intercambio De
                                      Llaves), Carga De Aplicación o
                                      Prehabilitación (Si Aplica):
                                    </strong>
                                    <Input
                                      type="text"
                                      value={
                                        formAnswer.validar_kvc ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                  </div>
                                </>
                              )}
                              <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                                <strong>Muestras entregadas:</strong>
                                <Input
                                  type="number"
                                  value={formAnswer.sample_quantity ?? '—'}
                                  readOnly
                                />
                              </div>
                              {/*////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/}
                              <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                                <strong>Respuestas de calidad:</strong>
                              </div>
                              <p className="text-sm text-gray-600">
                                <strong>Usuario de calidad:</strong>{' '}
                                {entry.formAnswers[0].reviewer.username}
                              </p>
                              {(entry.areaName === 'color edge' ||
                                [
                                  'etiquetadora',
                                  'otto',
                                  'packsmart',
                                  'embolsadora',
                                ].some((valor) =>
                                  entry.formAnswers?.[0]?.tipo_personalizacion?.includes(
                                    valor
                                  )
                                )) && (
                                <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                                  <strong>
                                    No hay preguntas por parte de calidad.
                                  </strong>
                                </div>
                              )}
                              {/* Tabla de preguntas/respuestas */}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                null &&
                                entry.areaName !== 'color edge' && (
                                  <>
                                    <Table className="min-w-full border text-sm">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="p-2 text-left">
                                            Pregunta
                                          </th>
                                          {entry.mode === 'doble' &&
                                          entry.formAnswers[0]
                                            .tipo_personalizacion === null ? (
                                            <>
                                              <th className="p-2 text-center">
                                                Hoja Frente
                                              </th>
                                              <th className="p-2 text-center">
                                                Hoja Vuelta
                                              </th>
                                            </>
                                          ) : (
                                            <th className="p-2 text-center">
                                              Respuesta
                                            </th>
                                          )}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {entry.formAnswers[0]
                                          .tipo_personalizacion === null &&
                                          entry.questions
                                            .filter((q) => q.role_id === 3)
                                            .map((q) => {
                                              const respuestas = (
                                                formAnswer.FormAnswerResponse ||
                                                []
                                              ).filter(
                                                (r: FormAnswerResponse) =>
                                                  r.question_id === q.id
                                              );
                                              const frontAnswer =
                                                respuestas[0]?.response_cqm;
                                              const vueltaAnswer =
                                                respuestas[1]?.response_cqm;
                                              const respuestaSimple =
                                                respuestas[0]?.response_cqm;

                                              return (
                                                <tr
                                                  key={`q-${q.id}`}
                                                  className="border-t"
                                                >
                                                  <td className="p-2">
                                                    {q.title}
                                                  </td>
                                                  {entry.mode === 'doble' ? (
                                                    <>
                                                      <td className="text-center p-2">
                                                        <input
                                                          type="checkbox"
                                                          disabled
                                                          checked={isTruthyBool(
                                                            frontAnswer
                                                          )}
                                                        />
                                                      </td>
                                                      <td className="text-center p-2">
                                                        <input
                                                          type="checkbox"
                                                          disabled
                                                          checked={isTruthyBool(
                                                            frontAnswer
                                                          )}
                                                        />
                                                      </td>
                                                    </>
                                                  ) : (
                                                    <td className="text-center p-2">
                                                      {typeof respuestas[0]
                                                        ?.response_cqm ===
                                                      'boolean' ? (
                                                        <input
                                                          type="checkbox"
                                                          disabled
                                                          checked={
                                                            respuestas[0]
                                                              ?.response_cqm ??
                                                            false
                                                          }
                                                        />
                                                      ) : (
                                                        <span>
                                                          {respuestas[0]
                                                            ?.response_cqm ??
                                                            '—'}
                                                        </span>
                                                      )}
                                                    </td>
                                                  )}
                                                </tr>
                                              );
                                            })}
                                      </tbody>
                                    </Table>
                                  </>
                                )}
                              {/* Extras */}
                              {entry.areaName === 'impresion' && (
                                <>
                                  <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                                    <strong>Tipo de prueba:</strong>
                                    <RadioGroup>
                                      <RadioLabel>
                                        <input
                                          type="radio"
                                          value="prueba"
                                          checked={
                                            formAnswer.testtype_cqm === 'color'
                                          }
                                          disabled
                                        />
                                        Prueba de Color
                                      </RadioLabel>
                                      <RadioLabel>
                                        <input
                                          type="radio"
                                          value="prueba"
                                          checked={
                                            formAnswer.testtype_cqm === 'perfil'
                                          }
                                          disabled
                                        />
                                        VoBo Perfil
                                      </RadioLabel>
                                      <RadioLabel>
                                        <input
                                          type="radio"
                                          value="prueba"
                                          checked={
                                            formAnswer.testtype_cqm === 'fisica'
                                          }
                                          disabled
                                        />
                                        Prueba Digital
                                      </RadioLabel>
                                    </RadioGroup>
                                  </div>
                                </>
                              )}
                              {entry.areaName === 'empalme' && (
                                <>
                                  <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                                    <strong>
                                      Validar Inlays Vs Ot (Anotarlo):
                                    </strong>
                                    <Input
                                      type="text"
                                      value={
                                        formAnswer.validar_inlays ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                    <strong>
                                      Validar tipo de banda magnetica:
                                    </strong>
                                    <RadioGroup>
                                      <RadioLabel>
                                        <input
                                          type="checkbox"
                                          value="holograma"
                                          checked={
                                            formAnswer.magnetic_band === 'hico'
                                          }
                                          disabled
                                        />
                                        Hico
                                      </RadioLabel>
                                      <RadioLabel>
                                        <input
                                          type="checkbox"
                                          value="foil"
                                          checked={
                                            formAnswer.magnetic_band === 'loco'
                                          }
                                          disabled
                                        />
                                        Loco
                                      </RadioLabel>
                                    </RadioGroup>
                                    <RadioGroup>
                                      <RadioLabel>
                                        <input
                                          type="checkbox"
                                          value="holograma"
                                          checked={
                                            formAnswer.track_type ===
                                            'dos_tracks'
                                          }
                                          disabled
                                        />
                                        2 Tracks
                                      </RadioLabel>
                                      <RadioLabel>
                                        <input
                                          type="checkbox"
                                          value="foil"
                                          checked={
                                            formAnswer.track_type ===
                                            'tres_tracks'
                                          }
                                          disabled
                                        />
                                        3 Tracks
                                      </RadioLabel>
                                    </RadioGroup>
                                    <strong>Color: </strong>
                                    <Input
                                      type="text"
                                      value={
                                        formAnswer.color ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                    <strong>Tipo de Holografico:</strong>
                                    <Input
                                      type="text"
                                      value={
                                        formAnswer.holographic_type ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                  </div>
                                </>
                              )}
                              {entry.areaName === 'milling chip' && (
                                <>
                                  <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                                    <strong>Localización de Contactos:</strong>
                                    <Input
                                      type="text"
                                      value={
                                        formAnswer.localizacion_contactos ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                    <strong>Altura Chip Centro:</strong>
                                    <Input
                                      type="text"
                                      value={
                                        formAnswer.altura_chip ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                  </div>
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'laser' && (
                                <>
                                  <MachineSectionCqm
                                    visible
                                    machine="laser"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    roleId={3}
                                    questionSlice={[9, 3]}
                                    answers={
                                      formAnswer.FormAnswerResponse ?? []
                                    }
                                    extras={
                                      <InputGroup style={{ width: '70%' }}>
                                        <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                                          <Label>
                                            Verificar Script / Layout Vs Ot
                                            /Autorización, Favor De Anotar:
                                          </Label>
                                          <Input
                                            type="text"
                                            value={
                                              formAnswer.verificar_script ??
                                              'No se reconoce la muestra enviada'
                                            }
                                            readOnly
                                          />
                                          <Label>
                                            Validar, Anotar KVC (Llaves), Carga
                                            de Aplicación o Prehabilitación:
                                          </Label>
                                          <Input
                                            type="text"
                                            value={
                                              formAnswer.validar_kvc_perso ??
                                              'No se reconoce la muestra enviada'
                                            }
                                            readOnly
                                          />
                                          <Label>
                                            Describir Apariencia Del Quemado Del
                                            Laser (Color):
                                          </Label>
                                          <Input
                                            type="text"
                                            value={
                                              formAnswer.apariencia_quemado ??
                                              'No se reconoce la muestra enviada'
                                            }
                                            readOnly
                                          />
                                        </div>
                                      </InputGroup>
                                    }
                                  />
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'persos' && (
                                <>
                                  <MachineSectionCqm
                                    visible
                                    machine="Personalización"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    roleId={3}
                                    questionSlice={[13, 15]}
                                    answers={
                                      formAnswer.FormAnswerResponse ?? []
                                    }
                                    extras={
                                      <InputGroup style={{ width: '70%' }}>
                                        <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                                          <Label>
                                            Validar Carga De Aplicación
                                            (PersoMaster) Anotar:
                                          </Label>
                                          <Input
                                            type="text"
                                            value={
                                              formAnswer.carga_aplicacion ??
                                              'No se reconoce la muestra enviada'
                                            }
                                            readOnly
                                          />
                                        </div>
                                      </InputGroup>
                                    }
                                  />
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

const Table = styled.table`
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
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

const Input = styled.input`
  width: 30%;
  color: black;
  padding: 0.75rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  outline: none;
  font-size: 1rem;
  transition: border 0.3s;

  &:focus {
    border-color: #0038a8;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #374151;
`;

const InputGroup = styled.div`
  width: 100%;
`;

const Label = styled.label`
  font-weight: 600;
  color: #6b7280;
`;
