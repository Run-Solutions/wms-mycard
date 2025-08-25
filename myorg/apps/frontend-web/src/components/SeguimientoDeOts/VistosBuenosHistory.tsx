import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  OperatorAdvanceMachineTable,
  CqmAdvanceMachineTable,
} from '../liberacionDeVistosBuenos/util/MachineSection';
import { OperatorAdvancedTable, CqmAdvancedTable } from './util/QuestionTable';

/*********************************
 * Types (puedes moverlos a ./util/types)
 *********************************/
interface Question {
  id: number;
  title: string;
  role_id: number | null;
}
interface FormAnswerResponse {
  question_id: number;
  response_operator: boolean | null;
  response_cqm: boolean | null;
}
interface FormAnswer {
  [key: string]: any;
  created_at?: string;
  sample_quantity: number;
  tipo_personalizacion: string | null;
  FormAnswerResponse: FormAnswerResponse[];
  reviewer?: { username?: string };
  // extras usados en operador o CQM
  // operador:
  finish_validation?: string; // laminación (operador)
  color_foil?: string;
  revisar_posicion?: string;
  imagen_holograma?: string; // hot stamping (operador)
  color_personalizacion?: string;
  codigo_barras?: string;
  verificar_etiqueta?: string; // perso/etiquetadora (operador)
  // CQM:
  testtype_cqm?: 'color' | 'perfil' | 'fisica'; // impresión (CQM)
  validar_inlays?: string;
  magnetic_band?: 'hico' | 'loco';
  track_type?: 'dos_tracks' | 'tres_tracks';
  color?: string;
  prueba_over?: string;
  prueba_cinta_magnetica?: string;
  prueba_centro?: string;
  holographic_type?: string; // empalme (CQM)
  localizacion_contactos?: string;
  altura_chip?: string; // milling chip (CQM)
  verificar_script?: string;
  validar_kvc_perso?: string;
  apariencia_quemado?: string; // laser (CQM)
  carga_aplicacion?: string; // persos (CQM)
}
interface AreaHistory {
  areaName: string;
  created_at: string;
  username: string;
  questions: Question[];
  formAnswers: FormAnswer[];
  mode: 'doble' | 'simple';
}
interface Props {
  history: AreaHistory[];
  qualitySectionOpen: boolean;
  toggleQualitySection: () => void;
}

/*********************************
 * Helpers
 *********************************/
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleString() : '—');

/*********************************
 * UI atoms
 *********************************/
const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
  <span className="text-gray-500 ml-4">{open ? '▼' : '▶'}</span>
);

const ReadonlyField: React.FC<{
  label?: string;
  value?: any;
  width?: string;
  type?: string;
}> = ({ label, value, width = '30%', type = 'text' }) => (
  <div
    className="mt-3 text-sm flex flex-col gap-1 text-black"
    style={{ width }}
  >
    {label && <strong>{label}</strong>}
    <Input
      type={type}
      readOnly
      value={value ?? 'No se reconoce la muestra enviada'}
    />
  </div>
);

/*********************************
 * Collapsible cards
 *********************************/
const AreaCard: React.FC<{
  entry: AreaHistory;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ entry, open, onToggle, children }) => (
  <div className="bg-white shadow rounded-xl p-6 mb-6">
    <button
      type="button"
      onClick={onToggle}
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
      <Chevron open={open} />
    </button>
    {open && <div className="mt-4">{children}</div>}
  </div>
);

const EvaluationCard: React.FC<{
  idx: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ idx, open, onToggle, children }) => (
  <div className="border rounded-lg mb-4">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between bg-gray-50 px-4 py-2"
    >
      <h5 className="text-sm font-semibold text-gray-700">
        Evaluación #{idx + 1}
      </h5>
      <Chevron open={open} />
    </button>
    {open && <div className="p-4">{children}</div>}
  </div>
);

/*********************************
 * Secciones por tipo (OPERADOR)
 *********************************/
const OperatorMachineSection: React.FC<{
  tipo: string | null;
  questions: Question[];
  fa: FormAnswer;
}> = ({ tipo, questions, fa }) => {
  if (!tipo) return null; // si es null, se renderiza tabla de operador

  const commonProps = {
    visible: true,
    title: '',
    questions,
    areaId: 10,
    roleId: null as number | null,
    answers: fa.FormAnswerResponse ?? [],
  };

  const map: Record<string, React.ReactNode> = {
    persos: (
      <>
        <InputGroup style={{ width: '70%' }}>
          <div className="mt-3 text-sm flex flex-col gap-3">
            <Label>Tipo de Personalización:</Label>
            <Input
              type="text"
              value={
                fa.tipo_personalizacion ?? 'No se reconoce la muestra enviada'
              }
              readOnly
            />
          </div>
        </InputGroup>

        <OperatorAdvanceMachineTable
          {...commonProps}
          machine="Personalización"
          questionSlice={[1, 10]}
          extras={
            <InputGroup style={{ width: '70%' }}>
              <div className="mt-3 text-sm flex flex-col gap-3">
                <Label>Color De Personalización:</Label>
                <Input
                  type="text"
                  value={
                    fa.color_personalizacion ??
                    'No se reconoce la muestra enviada'
                  }
                  readOnly
                />
                <Label>Tipo de Código de Barras Que Se Personaliza:</Label>
                <Input
                  type="text"
                  value={
                    fa.codigo_barras ?? 'No se reconoce la muestra enviada'
                  }
                  readOnly
                />
              </div>
            </InputGroup>
          }
        />
      </>
    ),
    etiquetadora: (
      <>
        <InputGroup style={{ width: '70%' }}>
          <div className="mt-3 text-sm flex flex-col gap-3">
            <Label>Tipo de Personalización:</Label>
            <Input
              type="text"
              value={
                fa.tipo_personalizacion ?? 'No se reconoce la muestra enviada'
              }
              readOnly
            />
          </div>
        </InputGroup>
        <OperatorAdvanceMachineTable
          {...commonProps}
          machine="etiquetadora"
          questionSlice={[0, 1]}
          extras={
            <InputGroup style={{ width: '70%' }}>
              <div className="mt-3 text-sm flex flex-col gap-3">
                <Label>
                  Verificar Tipo De Etiqueta Vs Ot Y Pegar Utilizada:
                </Label>
                <Input
                  type="text"
                  value={
                    fa.verificar_etiqueta ?? 'No se reconoce la muestra enviada'
                  }
                  readOnly
                />
              </div>
            </InputGroup>
          }
        />
      </>
    ),
    packsmart: (
      <>
        <InputGroup style={{ width: '70%' }}>
          <div className="mt-3 text-sm flex flex-col gap-3">
            <Label>Tipo de Personalización:</Label>
            <Input
              type="text"
              value={
                fa.tipo_personalizacion ?? 'No se reconoce la muestra enviada'
              }
              readOnly
            />
          </div>
        </InputGroup>

        <OperatorAdvanceMachineTable
          {...commonProps}
          machine="packsmart"
          questionSlice={[14, 20]}
          extras={<></>}
        />
      </>
    ),
    otto: (
      <>
        <InputGroup style={{ width: '70%' }}>
          <div className="mt-3 text-sm flex flex-col gap-3">
            <Label>Tipo de Personalización:</Label>
            <Input
              type="text"
              value={
                fa.tipo_personalizacion ?? 'No se reconoce la muestra enviada'
              }
              readOnly
            />
          </div>
        </InputGroup>
        <OperatorAdvanceMachineTable
          {...commonProps}
          machine="otto"
          questionSlice={[20, 28]}
          extras={<></>}
        />
      </>
    ),
    embolsadora: (
      <>
        <InputGroup style={{ width: '70%' }}>
          <div className="mt-3 text-sm flex flex-col gap-3">
            <Label>Tipo de Personalización:</Label>
            <Input
              type="text"
              value={
                fa.tipo_personalizacion ?? 'No se reconoce la muestra enviada'
              }
              readOnly
            />
          </div>
        </InputGroup>
        <OperatorAdvanceMachineTable
          {...commonProps}
          machine="embolsadora"
          questionSlice={[28, 30]}
          extras={<></>}
        />
      </>
    ),
    laser: (
      <div className="mt-3 text-sm flex flex-col gap-3">
        <strong>No hay preguntas por parte del operador.</strong>
      </div>
    ),
  };

  return <>{map[tipo] ?? null}</>;
};

/*********************************
 * Extras por área (OPERADOR)
 *********************************/
const OperatorExtrasByArea: React.FC<{ area: string; fa: FormAnswer }> = ({
  area,
  fa,
}) => {
  switch (area) {
    case 'laminacion':
      return (
        <>
          <ReadonlyField
            label="Validar Acabado Vs Orden De Trabajo:"
            value={fa.finish_validation}
            width="70%"
          />
        </>
      );
    case 'hot stamping':
      return (
        <div className="mt-3 text-sm flex flex-col gap-3 text-black">
          <strong>Color Foil:</strong>
          <Input
            type="text"
            value={fa.color_foil ?? 'No se reconoce la muestra enviada'}
            readOnly
          />
          <strong>Revisar Posición Vs Ot:</strong>
          <RadioGroup>
            <RadioLabel>
              <input
                type="checkbox"
                disabled
                checked={
                  fa.revisar_posicion === 'holograma' ||
                  fa.revisar_posicion === 'hologramafoil'
                }
              />
              Holograma
            </RadioLabel>
            <RadioLabel>
              <input
                type="checkbox"
                disabled
                checked={
                  fa.revisar_posicion === 'foil' ||
                  fa.revisar_posicion === 'hologramafoil'
                }
              />
              Foil
            </RadioLabel>
          </RadioGroup>
          <strong>Imagen de Holograma Vs Ot:</strong>
          <RadioGroup>
            <RadioLabel>
              <input
                type="checkbox"
                disabled
                checked={
                  fa.imagen_holograma === 'holograma' ||
                  fa.imagen_holograma === 'hologramafoil'
                }
              />
              Holograma
            </RadioLabel>
            <RadioLabel>
              <input
                type="checkbox"
                disabled
                checked={
                  fa.imagen_holograma === 'foil' ||
                  fa.imagen_holograma === 'hologramafoil'
                }
              />
              Foil
            </RadioLabel>
          </RadioGroup>
        </div>
      );
    default:
      return null; // otros extras de operador no definidos
  }
};

/*********************************
 * Secciones por tipo (CQM)
 *********************************/
const CqmMachineSection: React.FC<{
  tipo: string | null;
  questions: Question[];
  fa: FormAnswer;
}> = ({ tipo, questions, fa }) => {
  if (!tipo) return null; // si es null, se renderiza tabla de CQM

  const commonProps = {
    visible: true,
    title: '',
    questions,
    areaId: 10,
    roleId: 3 as number,
    answers: fa.FormAnswerResponse ?? [],
  };

  const map: Record<string, React.ReactNode> = {
    laser: (
      <CqmAdvanceMachineTable
        {...commonProps}
        machine="laser"
        questionSlice={[9, 3]}
        extras={
          <InputGroup style={{ width: '70%' }}>
            <div className="mt-3 text-sm flex flex-col gap-3 text-black">
              <Label>
                Verificar Script / Layout Vs Ot /Autorización, Favor De Anotar:
              </Label>
              <Input
                type="text"
                value={
                  fa.verificar_script ?? 'No se reconoce la muestra enviada'
                }
                readOnly
              />
              <Label>
                Validar, Anotar KVC (Llaves), Carga de Aplicación o
                Prehabilitación:
              </Label>
              <Input
                type="text"
                value={
                  fa.validar_kvc_perso ?? 'No se reconoce la muestra enviada'
                }
                readOnly
              />
              <Label>Describir Apariencia Del Quemado Del Laser (Color):</Label>
              <Input
                type="text"
                value={
                  fa.apariencia_quemado ?? 'No se reconoce la muestra enviada'
                }
                readOnly
              />
            </div>
          </InputGroup>
        }
      />
    ),
    persos: (
      <CqmAdvanceMachineTable
        {...commonProps}
        machine="Personalización"
        questionSlice={[13, 15]}
        extras={
          <InputGroup style={{ width: '70%' }}>
            <div className="mt-3 text-sm flex flex-col gap-3 text-black">
              <Label>Validar Carga De Aplicación (PersoMaster) Anotar:</Label>
              <Input
                type="text"
                value={
                  fa.carga_aplicacion ?? 'No se reconoce la muestra enviada'
                }
                readOnly
              />
            </div>
          </InputGroup>
        }
      />
    ),
  };

  return <>{map[tipo] ?? null}</>;
};

/*********************************
 * Extras por área (CQM)
 *********************************/
const QualityExtrasByArea: React.FC<{ area: string; fa: FormAnswer }> = ({
  area,
  fa,
}) => {
  switch (area) {
    case 'impresion':
      return (
        <div className="mt-3 text-sm flex flex-col gap-3 text-black">
          <strong>Tonos y/o Densidades Contra:</strong>
          <RadioGroup>
            <RadioLabel>
              <input
                type="radio"
                disabled
                checked={fa.testtype_cqm === 'color'}
              />
              Prueba de Color
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                disabled
                checked={fa.testtype_cqm === 'perfil'}
              />
              VoBo Perfil
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                disabled
                checked={fa.testtype_cqm === 'fisica'}
              />
              Prueba Digital
            </RadioLabel>
          </RadioGroup>
        </div>
      );
    case 'empalme':
      return (
        <div className="mt-3 text-sm flex flex-col gap-3 text-black">
          <strong>Validar Inlays Vs Ot (Anotarlo):</strong>
          <Input
            type="text"
            value={fa.validar_inlays ?? 'No se reconoce la muestra enviada'}
            readOnly
          />
          <strong>Validar tipo de banda magnética:</strong>
          <RadioGroup>
            <RadioLabel>
              <input
                type="checkbox"
                disabled
                checked={fa.magnetic_band === 'hico'}
              />
              Hico
            </RadioLabel>
            <RadioLabel>
              <input
                type="checkbox"
                disabled
                checked={fa.magnetic_band === 'loco'}
              />
              Loco
            </RadioLabel>
          </RadioGroup>
          <RadioGroup>
            <RadioLabel>
              <input
                type="checkbox"
                disabled
                checked={fa.track_type === 'dos_tracks'}
              />
              2 Tracks
            </RadioLabel>
            <RadioLabel>
              <input
                type="checkbox"
                disabled
                checked={fa.track_type === 'tres_tracks'}
              />
              3 Tracks
            </RadioLabel>
          </RadioGroup>
          <strong>Color:</strong>
          <Input
            type="text"
            value={fa.color ?? 'No se reconoce la muestra enviada'}
            readOnly
          />
          <strong>Tipo de Holográfico:</strong>
          <Input
            type="text"
            value={fa.holographic_type ?? 'No se reconoce la muestra enviada'}
            readOnly
          />
        </div>
      );
    case 'laminacion':
      return (
        <div className="mt-3 text-sm flex flex-col gap-3 text-black">
          <strong>Prueba Over:</strong>
          <Input
            type="text"
            value={fa.prueba_over ?? 'No se reconoce la muestra enviada'}
            readOnly
          />
          <strong>Prueba Cinta Magnética:</strong>
          <Input
            type="text"
            value={fa.prueba_cinta_magnetica ?? 'No se reconoce la muestra enviada'}
            readOnly
          />
          <strong>Prueba Centro (entre capas):</strong>
          <Input
            type="text"
            value={fa.prueba_centro ?? 'No se reconoce la muestra enviada'}
            readOnly
          />
        </div>
      );
    case 'milling chip':
      return (
        <>
          <ReadonlyField
            label="Localización de Contactos:"
            value={fa.localizacion_contactos}
            width="70%"
          />
          <ReadonlyField
            label="Altura Chip Centro:"
            value={fa.altura_chip}
            width="70%"
          />
        </>
      );
    default:
      return null;
  }
};

/*********************************
 * Main
 *********************************/
export const VistosBuenosHistory: React.FC<Props> = ({
  history,
  qualitySectionOpen,
  toggleQualitySection,
}) => {
  const [openAreas, setOpenAreas] = useState<Set<string>>(() => new Set());
  const [openEvals, setOpenEvals] = useState<Set<string>>(() => new Set());

  const areaKey = (i: number) => `area-${i}`;
  const evalKey = (i: number, j: number) => `area-${i}::eval-${j}`;

  useMemo(() => {
    if (qualitySectionOpen && openAreas.size === 0) {
      // para abrir todo por defecto, descomenta:
      // setOpenAreas(new Set(history.map((_, i) => areaKey(i))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qualitySectionOpen]);

  const toggleArea = (i: number) =>
    setOpenAreas((prev) => {
      const next = new Set(prev);
      const k = areaKey(i);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  const toggleEval = (i: number, j: number) =>
    setOpenEvals((prev) => {
      const next = new Set(prev);
      const k = evalKey(i, j);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  if (history.length === 0) {
    return (
      <div className="bg-yellow-100 text-yellow-800 p-4 rounded-xl mt-4 mb-2">
        ⚠️ No hay vistos buenos registrados.
      </div>
    );
  }

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
            const aK = areaKey(areaIdx);
            const areaOpen = openAreas.has(aK);

            return (
              <AreaCard
                key={`${entry.areaName}-${areaIdx}`}
                entry={entry}
                open={areaOpen}
                onToggle={() => toggleArea(areaIdx)}
              >
                {entry.formAnswers.map((fa, evalIdx) => {
                  const eK = evalKey(areaIdx, evalIdx);
                  const evalOpen = openEvals.has(eK);
                  const isPersoNull = fa.tipo_personalizacion === null;

                  return (
                    <EvaluationCard
                      key={`fa-${evalIdx}`}
                      idx={evalIdx}
                      open={evalOpen}
                      onToggle={() => toggleEval(areaIdx, evalIdx)}
                    >
                      <p className="text-sm text-gray-600">
                        <strong>Fecha de Creación:</strong>{' '}
                        {fmtDate(fa.created_at)}
                      </p>

                      {/* --- OPERADOR --- */}
                      {isPersoNull ? (
                        <OperatorAdvancedTable
                          questions={entry.questions}
                          answers={fa.FormAnswerResponse ?? []}
                          mode={entry.mode}
                          readOnly
                          columns={
                            entry.mode === 'doble'
                              ? ['Hoja Frente', 'Hoja Vuelta']
                              : ['Respuesta']
                          }
                        />
                      ) : (
                        <OperatorMachineSection
                          tipo={fa.tipo_personalizacion}
                          questions={entry.questions}
                          fa={fa}
                        />
                      )}

                      {/* Extras de operador por área */}
                      <OperatorExtrasByArea area={entry.areaName} fa={fa} />

                      {/* Muestras entregadas (operador) */}
                      <ReadonlyField
                        label="Muestras entregadas:"
                        value={fa.sample_quantity ?? '—'}
                        type="number"
                      />

                      {/* --- CQM --- */}
                      <div className="mt-6 text-sm flex flex-col gap-1 text-black">
                        <strong>Respuestas de calidad:</strong>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Usuario de calidad:</strong>{' '}
                        {fa.reviewer?.username ?? '—'}
                      </p>

                      {entry.areaName === 'color edge' ||
                      [
                        'etiquetadora',
                        'otto',
                        'packsmart',
                        'embolsadora',
                      ].includes(fa.tipo_personalizacion ?? '') ? (
                        <div className="mt-3 text-sm flex flex-col gap-3 text-black">
                          <strong>
                            No hay preguntas por parte de calidad.
                          </strong>
                        </div>
                      ) : isPersoNull ? (
                        <CqmAdvancedTable
                          questions={entry.questions}
                          answers={fa.FormAnswerResponse ?? []}
                          mode={entry.mode}
                          readOnly
                          columns={
                            entry.mode === 'doble'
                              ? ['Hoja Frente', 'Hoja Vuelta']
                              : ['Respuesta']
                          }
                        />
                      ) : (
                        <CqmMachineSection
                          tipo={fa.tipo_personalizacion}
                          questions={entry.questions}
                          fa={fa}
                        />
                      )}

                      {/* Extras de CQM por área (van DESPUÉS de la tabla de CQM) */}
                      <QualityExtrasByArea area={entry.areaName} fa={fa} />
                    </EvaluationCard>
                  );
                })}
              </AreaCard>
            );
          })}
        </>
      )}
    </div>
  );
};

/*********************************
 * Styled
 *********************************/
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
