import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

// ===== Config de columnas (ajusta a tu UI) =====
const CELL_PREGUNTA_WIDTH = 280; // ancho fijo para la columna "Pregunta"
const CELL_COL_WIDTH = 60;       // ancho fijo para cada subcolumna (OK/NG)
const OK_COLOR = '#0038A8';
const NG_COLOR = '#DC2626';
const BORDER = '#9A9DA1';

// ===== Types =====
export interface Question {
  id: number;
  title: string;
  role_id: number | null; // null = operador, 3 = CQM
}
export interface FormAnswerResponse {
  question_id: number;
  response_operator: boolean | null;
  response_cqm: boolean | null;
}

type Role = 'operator' | 'cqm';

interface AdvancedQuestionTableProps {
  questions: Question[];
  answers: FormAnswerResponse[];
  mode: 'doble' | 'simple';
  role: Role; // operador o cqm (elige el campo)
  filterRoleId: number | null; // null para operador, 3 para CQM
  // Opcional: personalizar cabeceras de columnas
  columns?: string[]; // p.ej. ['Hoja Frente','Hoja Vuelta'] o ['Respuesta']
  // Interactividad (por defecto readOnly)
  readOnly?: boolean;
  onToggle?: (
    questionId: number,
    colIndex: number,
    value: true | false | null
  ) => void;
}

/**
 * SelectionQuestionTable (React Native)
 * - Mirrors the web component structure: a two-tier header and a body with OK/NG per column.
 * - Layout is responsive and scrollable horizontally when there are many columns.
 */
export const AdvancedQuestionTable: React.FC<AdvancedQuestionTableProps> = memo(
  ({
    questions,
    answers,
    mode,
    role,
    filterRoleId,
    columns,
    readOnly = true,
    onToggle,
  }) => {
    const cols =
      columns ??
      (mode === 'doble' ? ['Hoja Frente', 'Hoja Vuelta'] : ['Respuesta']);

    const filtered = questions.filter((q) => q.role_id === filterRoleId);
    console.log('filtered', filtered);

    // Devuelve [valorCol0, valorCol1] según role
    const getValues = (qid: number): (boolean | null | undefined)[] => {
      const rows = answers.filter((r) => r.question_id === qid);
      // aseguramos 2 slots (frente/vuelta). Para 'simple' usamos sólo el [0]
      const v0 =
        role === 'operator'
          ? rows[0]?.response_operator ?? false
          : rows[0]?.response_cqm ?? false;
      const v1 =
        role === 'operator'
          ? rows[1]?.response_operator ?? false
          : rows[1]?.response_cqm ?? false;
      return [v0, v1];
    };
    console.log('answers', answers);

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
      <View style={[styles.card]}>
        {/* Header */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Top header row */}
            <View style={[styles.row, styles.headerRowTop]}>
              <View
                style={[
                  styles.cell,
                  styles.headerCell,
                  styles.cellPregunta,
                  { minWidth: 200 },
                ]}
              >
                <Text style={styles.headerText}>Pregunta</Text>
              </View>
              {columns?.map((label, i) => (
                <View
                  key={i}
                  style={[styles.cell, styles.headerCell, styles.cellColSpan2]}
                >
                  <Text style={styles.headerText}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Sub-header row: OK | NG per column */}
            <View style={[styles.row, styles.headerRowBottom]}>
              <View style={[styles.cell, styles.subHeaderSpacer]} />
              {columns?.map((_, i) => (
                <View key={i} style={styles.subHeaderPair}>
                  <View style={[styles.cell, styles.subHeaderCell]}>
                    <Text style={styles.subHeaderText}>OK</Text>
                  </View>
                  <View style={[styles.cell, styles.subHeaderCell]}>
                    <Text style={styles.subHeaderText}>NG</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Body */}
            {filtered.map((q) => {
              const values = getValues(q.id); // [v0, v1]
              return (
                <View key={q.id} style={[styles.row, styles.bodyRow]}>
                  <View
                    style={[
                      styles.cell,
                      styles.headerCell,
                      styles.cellPregunta,
                      { flex: 2 },
                    ]}
                  >
                    <Text style={styles.questionText}>{q.title}</Text>
                  </View>
                  {columns?.map((_, colIndex) => {
                    // Para modo simple usamos sólo colIndex 0
                    if (mode === 'simple' && colIndex > 0) return null;

                    const v = values[colIndex]; // boolean | null | undefined
                    const okChecked = v === true;
                    const ngChecked = v === false;
                    return (
                      <View key={`${q.id}-${colIndex}`} style={styles.pair}>
                        <CheckboxCell
                          type="ok"
                          checked={okChecked}
                          onPress={() =>
                            handleChange(q.id, colIndex, 'ok', !okChecked)
                          }
                          disabled={readOnly}
                        />
                        <CheckboxCell
                          type="ng"
                          checked={ngChecked}
                          onPress={() =>
                            handleChange(q.id, colIndex, 'ng', !ngChecked)
                          }
                          disabled={readOnly}
                        />
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }
);
export const OperatorAdvancedTable: React.FC<
  Omit<AdvancedQuestionTableProps, 'role' | 'filterRoleId'>
> = (props) => (
  <AdvancedQuestionTable {...props} role="operator" filterRoleId={null} />
);

// ===== Checkbox cell =====
// ===== Checkbox cell =====
const CheckboxCell: React.FC<{
  type: 'ok' | 'ng';
  checked: boolean;
  disabled?: boolean;
  onPress: () => void;
}> = ({ type, checked, disabled, onPress }) => {
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityLabel={type === 'ok' ? 'Marcar OK' : 'Marcar NG'}
      accessibilityState={{ checked, disabled }}
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.8}
      style={[styles.cell, styles.cellCheckbox]}
    >
      <View
        style={[
          styles.checkbox,
          type === 'ok' ? styles.checkboxOk : styles.checkboxNg,
          checked && (type === 'ok' ? styles.checkboxOkChecked : styles.checkboxNgChecked),
          disabled && styles.checkboxDisabled,
        ]}
      >
        {checked && (
          <Text style={styles.checkboxMark}>{type === 'ok' ? '✓' : '✗'}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ===== Styles =====
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  headerRowTop: {
    backgroundColor: BORDER,
  },
  headerRowBottom: {
    backgroundColor: BORDER,
  },
  headerCell: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderColor: BORDER,
  },
  headerText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13.5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // --- columnas pregunta ---
  cellPregunta: {
    width: CELL_PREGUNTA_WIDTH,
    justifyContent: 'center',
  },
  cellPreguntaBody: {
    width: CELL_PREGUNTA_WIDTH,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
  },
  // --- header que abarca 2 subcolumnas ---
  cellColSpan2: {
    width: CELL_COL_WIDTH * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // --- subheader (OK / NG) ---
  subHeaderSpacer: {
    width: CELL_PREGUNTA_WIDTH,
    borderRightWidth: 1,
    borderColor: BORDER,
  },
  subHeaderPair: {
    flexDirection: 'row',
    width: CELL_COL_WIDTH * 2,
  },
  subHeaderCell: {
    width: CELL_COL_WIDTH,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subHeaderText: {
    color: '#374151',
    fontWeight: '600',
  },
  // --- celdas comunes ---
  cell: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
  },
  bodyRow: {
    backgroundColor: '#FFFFFF',
  },
  questionText: {
    color: '#111827',
    fontSize: 15,
  },
  // --- par OK/NG en body ---
  pair: {
    flexDirection: 'row',
    width: CELL_COL_WIDTH * 2,
  },
  cellCheckbox: {
    width: CELL_COL_WIDTH,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOk: {
    borderColor: OK_COLOR,
  },
  checkboxNg: {
    borderColor: NG_COLOR,
  },
  checkboxOkChecked: {
    backgroundColor: OK_COLOR,
  },
  checkboxNgChecked: {
    backgroundColor: NG_COLOR,
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 14,
  },
  checkboxDisabled: {
    opacity: 0.6,
  },
});