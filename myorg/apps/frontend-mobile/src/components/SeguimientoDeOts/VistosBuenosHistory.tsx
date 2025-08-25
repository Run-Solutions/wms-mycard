// myorg/apps/frontend-mobile/src/components/SeguimientoDeOts/VistosBuenosHistory.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { TextInput } from 'react-native-paper';
import {
  OperatorAdvancedMachineTable,
  CqmAdvancedMachineTable,
} from './util/MachineSection';
import {
  CqmAdvancedTable,
  OperatorAdvancedTable,
} from './util/FormQuestionTable';
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
      <View style={[styles.container, { backgroundColor: '#FEF3C7' }]}>
        <Text style={{ color: '#B45309' }}>
          ⚠️ No hay vistos buenos registrados.
        </Text>
      </View>
    );
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleQualitySection}>
        <Text style={styles.title}>
          Historial de Vistos Buenos{' '}
          <Text style={styles.toggle}>({qualitySectionOpen ? '▼' : '▶'})</Text>
        </Text>
      </TouchableOpacity>

      {!qualitySectionOpen ? null : (
        <>
          {history.map((entry, areaIdx) => {
            const aKey = areaKey(areaIdx);
            const areaOpen = openAreas.has(aKey);

            return (
              <View key={`${entry.areaName}-${areaIdx}`} style={styles.card}>
                {/* Header de área con toggle */}
                <TouchableOpacity
                  onPress={() => toggleArea(areaIdx)}
                  style={styles.button}
                >
                  <View>
                    <Text style={styles.text}>
                      Area a evaluar: {entry.areaName}
                    </Text>
                    <Text style={styles.sub}>Operador: {entry.username}</Text>
                  </View>
                  <Text style={styles.toggle}>{areaOpen ? '▼' : '▶'}</Text>
                </TouchableOpacity>
                {!areaOpen ? null : (
                  <View style={{ marginTop: 4 }}>
                    {entry.formAnswers.map((formAnswer, evalIdx) => {
                      const eKey = evalKey(areaIdx, evalIdx);
                      const evalOpen = openEvals.has(eKey);
                      return (
                        <View
                          key={`fa-${evalIdx}`}
                          style={{
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            borderRadius: 8,
                            marginBottom: 16,
                          }}
                        >
                          {/* Header de evaluación con toggle */}
                          <TouchableOpacity
                            onPress={() => toggleEval(areaIdx, evalIdx)}
                            style={styles.button}
                          >
                            <Text style={styles.evals}>
                              Evaluación #{evalIdx + 1}
                            </Text>
                            <Text style={styles.toggle}>
                              {evalOpen ? '▼' : '▶'}
                            </Text>
                          </TouchableOpacity>
                          {!evalOpen ? null : (
                            <View style={{ padding: 4 }}>
                              <Text>
                                Fecha de Creación{' '}
                                {new Date(
                                  entry.formAnswers[0].created_at
                                ).toLocaleString()}
                              </Text>
                              {entry.formAnswers[0].tipo_personalizacion !==
                                null && (
                                <>
                                  <Text
                                    style={{
                                      marginTop: 12, // mt-3 (3 * 4 = 12)
                                      fontSize: 14, // text-sm (14px)
                                      display: 'flex', // flex (implícito en View)
                                      flexDirection: 'column', // flex-col
                                      gap: 12, // gap-3 (3 * 4 = 12) - Solo RN 0.71+
                                      color: '#000',
                                    }}
                                  >
                                    Tipo de Personalizacion
                                  </Text>

                                  <TextInput
                                    style={styles.input}
                                    theme={{ roundness: 30 }}
                                    mode="outlined"
                                    activeOutlineColor="#000"
                                    value={
                                      formAnswer.tipo_personalizacion ??
                                      'No se reconoce la muestra enviada'
                                    }
                                    readOnly
                                  />
                                </>
                              )}
                              <ScrollView horizontal>
                                {/* Tabla de preguntas/respuestas */}
                                {entry.formAnswers[0].tipo_personalizacion ===
                                  null && (
                                  <>
                                    <OperatorAdvancedTable
                                      questions={entry.questions}
                                      answers={
                                        formAnswer.FormAnswerResponse ?? []
                                      }
                                      mode={entry.mode}
                                      readOnly
                                      columns={
                                        entry.mode === 'doble'
                                          ? ['Hoja Frente', 'Hoja Vuelta']
                                          : ['Respuesta']
                                      }
                                    />
                                  </>
                                )}
                              </ScrollView>
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'laser' && (
                                <>
                                  <View>
                                    <Text style={styles.evals}>
                                      No hay preguntas por parte del operador
                                    </Text>
                                  </View>
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'persos' && (
                                <>
                                  <OperatorAdvancedMachineTable
                                    visible
                                    machine="Personalización"
                                    areaId={10}
                                    questions={entry.questions}
                                    questionSlice={[1, 10]}
                                    answers={
                                      formAnswer.FormAnswerResponse || []
                                    }
                                    extras={
                                      <View style={{ width: '70%' }}>
                                        <Text style={styles.label}>
                                          Color De Personalización:
                                        </Text>
                                        <TextInput
                                          style={styles.input}
                                          theme={{ roundness: 30 }}
                                          mode="outlined"
                                          activeOutlineColor="#000"
                                          value={
                                            formAnswer.color_personalizacion ??
                                            'No se reconoce la muestra enviada'
                                          }
                                          readOnly
                                        />
                                        <Text style={styles.label}>
                                          Tipo de Código de Barras Que Se
                                          Personaliza:
                                        </Text>
                                        <TextInput
                                          style={styles.input}
                                          theme={{ roundness: 30 }}
                                          mode="outlined"
                                          activeOutlineColor="#000"
                                          value={
                                            formAnswer.codigo_barras ??
                                            'No se reconoce la muestra enviada'
                                          }
                                          readOnly
                                        />
                                      </View>
                                    }
                                  />
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'etiquetadora' && (
                                <>
                                  <OperatorAdvancedMachineTable
                                    visible
                                    machine="etiquetadora"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    questionSlice={[0, 1]}
                                    answers={
                                      formAnswer.FormAnswerResponse || []
                                    }
                                    extras={
                                      <View style={{ width: '70%' }}>
                                        <Text style={styles.label}>
                                          Verificar Tipo De Etiqueta Vs Ot Y
                                          Pegar Utilizada:
                                        </Text>
                                        <TextInput
                                          style={styles.input}
                                          theme={{ roundness: 30 }}
                                          mode="outlined"
                                          activeOutlineColor="#000"
                                          value={
                                            formAnswer.verificar_etiqueta ??
                                            'No se reconoce la muestra enviada'
                                          }
                                          readOnly
                                        />
                                      </View>
                                    }
                                  />
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'packsmart' && (
                                <>
                                  <OperatorAdvancedMachineTable
                                    visible
                                    machine="packsmart"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    questionSlice={[14, 20]}
                                    answers={
                                      formAnswer.FormAnswerResponse || []
                                    }
                                    extras={<> </>}
                                  />
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'otto' && (
                                <>
                                  <OperatorAdvancedMachineTable
                                    visible
                                    machine="otto"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    questionSlice={[20, 28]}
                                    answers={
                                      formAnswer.FormAnswerResponse || []
                                    }
                                    extras={<> </>}
                                  />
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'embolsadora' && (
                                <>
                                  <OperatorAdvancedMachineTable
                                    visible
                                    machine="embolsadora"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    questionSlice={[28, 30]}
                                    answers={
                                      formAnswer.FormAnswerResponse || []
                                    }
                                    extras={<> </>}
                                  />
                                </>
                              )}
                              {entry.areaName === 'laminacion' && (
                                <>
                                  <View style={{ width: '70%' }}>
                                    <Text style={styles.label}>
                                      Validar Acabado Vs Orden De Trabajo:
                                    </Text>
                                    <TextInput
                                      style={styles.input}
                                      theme={{ roundness: 30 }}
                                      mode="outlined"
                                      activeOutlineColor="#000"
                                      value={
                                        formAnswer.finish_validation ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                  </View>
                                </>
                              )}
                              {entry.areaName === 'hot stamping' && (
                                <>
                                  <View style={{ width: '70%' }}>
                                    <Text style={styles.label}>
                                      Color Foil:
                                    </Text>
                                    <TextInput
                                      style={styles.input}
                                      theme={{ roundness: 30 }}
                                      mode="outlined"
                                      activeOutlineColor="#000"
                                      value={
                                        formAnswer.color_foil ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                    <Text style={styles.label}>
                                      Revisar Posición Vs Ot:
                                    </Text>
                                    <View style={styles.radioGroup}>
                                      {['holograma', 'foil'].map((value) => (
                                        <View
                                          key={value}
                                          style={styles.radioOption}
                                        >
                                          <View
                                            style={[
                                              styles.checkbox,
                                              { opacity: 0.5 },
                                            ]}
                                          >
                                            {formAnswer.revisar_posicion ===
                                              value ||
                                            formAnswer.revisar_posicion ===
                                              'hologramafoil' ? (
                                              <View
                                                style={styles.checkboxChecked}
                                              />
                                            ) : null}
                                          </View>
                                          <Text
                                            style={[
                                              styles.radioLabel,
                                              { opacity: 0.5 },
                                            ]}
                                          >
                                            {value.charAt(0).toUpperCase() +
                                              value.slice(1)}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                    <Text style={styles.label}>
                                      Imagen de Holograma Vs Ot:
                                    </Text>
                                    <View style={styles.radioGroup}>
                                      {['holograma', 'foil'].map((value) => (
                                        <View
                                          key={value}
                                          style={styles.radioOption}
                                        >
                                          <View
                                            style={[
                                              styles.checkbox,
                                              { opacity: 0.5 },
                                            ]}
                                          >
                                            {formAnswer.imagen_holograma ===
                                              value ||
                                            formAnswer.imagen_holograma ===
                                              'hologramafoil' ? (
                                              <View
                                                style={styles.checkboxChecked}
                                              />
                                            ) : null}
                                          </View>
                                          <Text
                                            style={[
                                              styles.radioLabel,
                                              { opacity: 0.5 },
                                            ]}
                                          >
                                            {value.charAt(0).toUpperCase() +
                                              value.slice(1)}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  </View>
                                </>
                              )}
                              {entry.areaName === 'milling chip' && (
                                <>
                                  <View style={{ width: '70%' }}>
                                    <Text style={styles.label}>
                                      Revisar Tecnología De Chip y Color Vs Ot:
                                    </Text>
                                    <TextInput
                                      style={styles.input}
                                      theme={{ roundness: 30 }}
                                      mode="outlined"
                                      activeOutlineColor="#000"
                                      value={
                                        formAnswer.revisar_tecnologia ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                    <Text style={styles.label}>
                                      Validar y Anotar KCV (Intercambio De
                                      Llaves), Carga De Aplicación o
                                      Prehabilitación (Si Aplica):
                                    </Text>
                                    <TextInput
                                      style={styles.input}
                                      theme={{ roundness: 30 }}
                                      mode="outlined"
                                      activeOutlineColor="#000"
                                      value={
                                        formAnswer.validar_kvc ??
                                        'No se reconoce la muestra enviada'
                                      }
                                      readOnly
                                    />
                                  </View>
                                </>
                              )}
                              <Text style={styles.label}>
                                Muestras entregadas:
                              </Text>
                              <TextInput
                                style={styles.input}
                                theme={{ roundness: 30 }}
                                mode="outlined"
                                activeOutlineColor="#000"
                                value={String(formAnswer.sample_quantity ?? 0)}
                                readOnly
                              />
                              {/*////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/}
                              <Text style={styles.label}>
                                Respuestas de calidad:
                              </Text>
                              <Text style={styles.labelUser}>
                                Usuario de calidad: {''}
                                {entry.formAnswers[0].reviewer.username}
                              </Text>
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
                                <Text style={styles.label}>
                                  No hay preguntas por parte de calidad.
                                </Text>
                              )}
                              {/* Tabla de preguntas/respuestas */}
                              <ScrollView horizontal>
                                {/* Tabla de preguntas/respuestas */}
                                {entry.formAnswers[0].tipo_personalizacion ===
                                  null &&
                                  entry.areaName !== 'color edge' && (
                                    <>
                                      <CqmAdvancedTable
                                        questions={entry.questions}
                                        answers={
                                          formAnswer.FormAnswerResponse ?? []
                                        }
                                        mode={entry.mode}
                                        readOnly
                                        columns={
                                          entry.mode === 'doble'
                                            ? ['Hoja Frente', 'Hoja Vuelta']
                                            : ['Respuesta']
                                        }
                                      />
                                    </>
                                  )}
                              </ScrollView>
                              {/* Extras */}
                              {entry.areaName === 'impresion' && (
                                <>
                                  <View style={{ width: '70%' }}>
                                    <Text style={styles.label}>
                                      Tonos y/o Densidades Contra:
                                    </Text>
                                    <View
                                      style={[
                                        styles.radioGroup,
                                        { flexWrap: 'wrap' },
                                      ]}
                                    >
                                      {[
                                        {
                                          label: 'Prueba de Color',
                                          value: 'color',
                                        },
                                        {
                                          label: 'VoBo Perfil',
                                          value: 'perfil',
                                        },
                                        {
                                          label: 'Prueba Digital',
                                          value: 'fisica',
                                        },
                                      ].map((item) => (
                                        <View
                                          key={item.value}
                                          style={styles.radioOption}
                                        >
                                          <View style={styles.radioButton}>
                                            <View
                                              style={[
                                                styles.radioButtonOuter,
                                                { opacity: 0.5 },
                                              ]}
                                            >
                                              {formAnswer.testtype_cqm ===
                                                item.value && (
                                                <View
                                                  style={
                                                    styles.radioButtonInner
                                                  }
                                                />
                                              )}
                                            </View>
                                          </View>
                                          <Text
                                            style={[
                                              styles.radioLabel,
                                              { opacity: 0.5 },
                                            ]}
                                          >
                                            {item.label}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  </View>
                                </>
                              )}
                              {entry.areaName === 'empalme' && (
                                <>
                                  <View style={{ width: '70%' }}>
                                    <Text style={styles.label}>
                                      Validar Inlays Vs Ot (Anotarlo):
                                    </Text>
                                    <TextInput
                                      style={styles.input}
                                      theme={{ roundness: 30 }}
                                      mode="outlined"
                                      activeOutlineColor="#000"
                                      value={String(
                                        formAnswer.validar_inlays ?? 0
                                      )}
                                      readOnly
                                    />
                                    <Text style={styles.label}>
                                      Validar tipo de banda magnetica:
                                    </Text>
                                    <View style={styles.radioGroup}>
                                      {['hico', 'loco'].map((value) => (
                                        <View
                                          key={value}
                                          style={styles.radioOption}
                                        >
                                          <View
                                            style={[
                                              styles.checkbox,
                                              { opacity: 0.5 },
                                            ]}
                                          >
                                            {formAnswer.magnetic_band ===
                                              value ||
                                            formAnswer.imagen_holograma ===
                                              'hologramafoil' ? (
                                              <View
                                                style={styles.checkboxChecked}
                                              />
                                            ) : null}
                                          </View>
                                          <Text
                                            style={[
                                              styles.radioLabel,
                                              { opacity: 0.5 },
                                            ]}
                                          >
                                            {value.charAt(0).toUpperCase() +
                                              value.slice(1)}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                    <View
                                      style={[
                                        styles.radioGroup,
                                        { flexWrap: 'wrap' },
                                      ]}
                                    >
                                      {[
                                        {
                                          label: '2 Tracks',
                                          value: 'dos_tracks',
                                        },
                                        {
                                          label: '3 Tracks',
                                          value: 'tres_tracks',
                                        },
                                      ].map((item) => (
                                        <View
                                          key={item.value}
                                          style={styles.radioOption}
                                        >
                                          <View style={styles.radioButton}>
                                            <View
                                              style={[
                                                styles.radioButtonOuter,
                                                { opacity: 0.5 },
                                              ]}
                                            >
                                              {formAnswer.track_type ===
                                                item.value && (
                                                <View
                                                  style={
                                                    styles.radioButtonInner
                                                  }
                                                />
                                              )}
                                            </View>
                                          </View>
                                          <Text
                                            style={[
                                              styles.radioLabel,
                                              { opacity: 0.5 },
                                            ]}
                                          >
                                            {item.label}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                    <Text style={styles.label}>Color:</Text>
                                    <TextInput
                                      style={styles.input}
                                      theme={{ roundness: 30 }}
                                      mode="outlined"
                                      activeOutlineColor="#000"
                                      value={String(formAnswer.color ?? 0)}
                                      readOnly
                                    />
                                    <Text style={styles.label}>
                                      Tipo de Holografico:
                                    </Text>
                                    <TextInput
                                      style={styles.input}
                                      theme={{ roundness: 30 }}
                                      mode="outlined"
                                      activeOutlineColor="#000"
                                      value={String(
                                        formAnswer.holographic_type ?? 0
                                      )}
                                      readOnly
                                    />
                                  </View>
                                </>
                              )}
                              {entry.areaName === 'laminacion' && (
                                <>
                                  <View style={{ width: '70%' }}>
                                    <Text style={styles.label}>
                                      Prueba Over:
                                    </Text>
                                    <TextInput
                                      style={styles.input}
                                      theme={{ roundness: 30 }}
                                      mode="outlined"
                                      activeOutlineColor="#000"
                                      value={String(
                                        formAnswer.prueba_over ?? 0
                                      )}
                                      readOnly
                                    />
                                    <Text style={styles.label}>
                                      Prueba Cinta Magnética:
                                    </Text>
                                    <TextInput
                                      style={styles.input}
                                      theme={{ roundness: 30 }}
                                      mode="outlined"
                                      activeOutlineColor="#000"
                                      value={String(
                                        formAnswer.prueba_cinta_magnetica ?? 0
                                      )}
                                      readOnly
                                    />
                                    <Text style={styles.label}>
                                      Prueba Centro (entre capas):
                                    </Text>
                                    <TextInput
                                      style={styles.input}
                                      theme={{ roundness: 30 }}
                                      mode="outlined"
                                      activeOutlineColor="#000"
                                      value={String(
                                        formAnswer.prueba_centro ?? 0
                                      )}
                                      readOnly
                                    />
                                  </View>
                                </>
                              )}
                              {entry.areaName === 'milling chip' && (
                                <>
                                  <View style={{ width: '70%' }}>
                                    <Text style={styles.label}>
                                      Localización de Contactos:
                                    </Text>
                                    <TextInput
                                      style={styles.input}
                                      theme={{ roundness: 30 }}
                                      mode="outlined"
                                      activeOutlineColor="#000"
                                      value={String(
                                        formAnswer.localizacion_contactos ?? 0
                                      )}
                                      readOnly
                                    />
                                    <Text style={styles.label}>
                                      Altura Chip Centro:
                                    </Text>
                                    <TextInput
                                      style={styles.input}
                                      theme={{ roundness: 30 }}
                                      mode="outlined"
                                      activeOutlineColor="#000"
                                      value={String(
                                        formAnswer.altura_chip ?? 0
                                      )}
                                      readOnly
                                    />
                                  </View>
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'laser' && (
                                <>
                                  <CqmAdvancedMachineTable
                                    visible
                                    machine="laser"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    questionSlice={[9, 3]}
                                    answers={
                                      formAnswer.FormAnswerResponse || []
                                    }
                                    extras={
                                      <View style={{ width: '70%' }}>
                                        <Text style={styles.label}>
                                          Verificar Script / Layout Vs Ot
                                          /Autorización, Favor De Anotar:
                                        </Text>
                                        <TextInput
                                          style={styles.input}
                                          theme={{ roundness: 30 }}
                                          mode="outlined"
                                          activeOutlineColor="#000"
                                          value={String(
                                            formAnswer.verificar_script ??
                                              'No se reconoce la muestra enviada'
                                          )}
                                          readOnly
                                        />
                                        <Text style={styles.label}>
                                          Validar, Anotar KVC (Llaves), Carga de
                                          Aplicación o Prehabilitación:
                                        </Text>
                                        <TextInput
                                          style={styles.input}
                                          theme={{ roundness: 30 }}
                                          mode="outlined"
                                          activeOutlineColor="#000"
                                          value={String(
                                            formAnswer.validar_kvc_perso ??
                                              'No se reconoce la muestra enviada'
                                          )}
                                          readOnly
                                        />
                                        <Text style={styles.label}>
                                          Describir Apariencia Del Quemado Del
                                          Laser (Color):
                                        </Text>
                                        <TextInput
                                          style={styles.input}
                                          theme={{ roundness: 30 }}
                                          mode="outlined"
                                          activeOutlineColor="#000"
                                          value={String(
                                            formAnswer.apariencia_quemado ??
                                              'No se reconoce la muestra enviada'
                                          )}
                                          readOnly
                                        />
                                      </View>
                                    }
                                  />
                                </>
                              )}
                              {entry.formAnswers[0].tipo_personalizacion ===
                                'persos' && (
                                <>
                                  <CqmAdvancedMachineTable
                                    visible
                                    machine="personalizacion"
                                    title=""
                                    questions={entry.questions}
                                    areaId={10}
                                    questionSlice={[13, 15]}
                                    answers={
                                      formAnswer.FormAnswerResponse || []
                                    }
                                    extras={
                                      <View style={{ width: '70%' }}>
                                        <Text style={styles.label}>
                                          Validar Carga De Aplicación
                                          (PersoMaster) Anotar:
                                        </Text>
                                        <TextInput
                                          style={styles.input}
                                          theme={{ roundness: 30 }}
                                          mode="outlined"
                                          activeOutlineColor="#000"
                                          value={String(
                                            formAnswer.carga_aplicacion ??
                                              'No se reconoce la muestra enviada'
                                          )}
                                          readOnly
                                        />
                                      </View>
                                    }
                                  />
                                </>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    padding: 10,
    borderRadius: 16,
    elevation: 3,
  },
  card: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  button: {
    width: '100%', // w-full
    textAlign: 'left', // text-left (solo aplica a Text)
    flexDirection: 'row', // flex (por defecto es column en RN)
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: { fontWeight: '600', marginTop: 12, fontSize: 16 },
  labelUser: { fontWeight: '400', marginTop: 12, fontSize: 14 },
  radioGroup: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  radioLabel: {
    fontSize: 14,
    color: '#1f2937',
  },
  text: {
    fontSize: 18, // text-lg (Tailwind: 1.125rem ≈ 18px)
    fontWeight: '600', // font-semibold (600 es semibold)
    color: '#1e40af', // text-blue-800 (código HEX del blue-800 de Tailwind)
  },
  evals: {
    fontSize: 18, // text-lg (Tailwind: 1.125rem ≈ 18px)
    fontWeight: '600', // font-semibold (600 es semibold)
    color: '#374151', // text-blue-800 (código HEX del blue-800 de Tailwind)
  },
  sub: {
    fontSize: 14, // text-sm
    color: '#4b5563', // text-gray-600 (HEX del gray-600 en Tailwind)
  },
  input: {
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    height: 30,
    fontSize: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  radioDisabled: {
    padding: 8,
    borderWidth: 1,
    opacity: 0.4,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  cellLabel: {
    flex: 1,
    fontWeight: '600',
    textAlign: 'left',
    marginLeft: 9,
    marginTop: 6,
    width: 150,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#cacecd',
    borderTopStartRadius: 6,
    fontSize: 17,
    justifyContent: 'center',
    height: 40,
    alignContent: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  table: {
    padding: 5,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    color: '#111827',
  },
  tableRow: {
    flexDirection: 'row',
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  radioGroupImp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioOptionImp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radioButton: {
    marginRight: 8,
  },
  radioButtonOuter: {
    height: 20,
    width: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    height: 10,
    width: 10,
    borderRadius: 3,
    backgroundColor: '#2563eb',
  },
  toggle: {
    fontSize: 14,
    color: '#3b82f6',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
  item: {
    marginBottom: 14,
  },
  area: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  questionText: {
    fontSize: 15,
    color: '#1f2937',
  },
  comment: {
    color: '#374151',
    marginVertical: 4,
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
