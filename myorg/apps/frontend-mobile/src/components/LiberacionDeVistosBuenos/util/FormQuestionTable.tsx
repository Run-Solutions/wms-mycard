import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ScrollView,
  useWindowDimensions,
} from 'react-native';

// ===== Config de columnas (ajusta a tu UI) =====
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
  role: Role; // operador o cqm (elige el campo)
  columns?: string[]; // p.ej. ['Hoja Frente','Hoja Vuelta'] o ['Respuesta']
  answers: FormAnswerResponse[];
  onToggle?: (
    questionId: number,
    colIndex: number,
    value: true | false | null
  ) => void;
  readOnly?: boolean;
  mode: 'doble' | 'simple';
  filterRoleId: number | null; // null para operador, 3 para CQM
  style?: ViewStyle;
  /** Nuevo: si true, la tabla se expande para llenar el ancho disponible en pantallas grandes */
  autoFit?: boolean;
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
    style,
    autoFit = true,
  }) => {
    const { width: screenW } = useWindowDimensions();
    const cols =
      columns ??
      (mode === 'doble' ? ['Hoja Frente', 'Hoja Vuelta'] : ['Respuesta']);

    const filtered = questions.filter((q) => q.role_id === filterRoleId);
    console.log('filtered', filtered);

    // 2) Cálculo de anchos responsivos -------------------------------
    // Valores base (los que ya usabas)
    const basePreguntaW = 280;
    const baseColW = 60;
    const numSubCols = (columns?.length ?? 1) * 2;
    const minTableW = basePreguntaW + numSubCols * baseColW;

    // Margen de tarjeta y bordes: reserva ~24px para que no “toque”
    const availableW = Math.max(0, screenW - 24);

    // Si autoFit y hay espacio extra, lo repartimos:
    // 40% para "Pregunta" (porque suele necesitar más texto) y 60% para subcolumnas
    let cellPreguntaW = basePreguntaW;
    let cellColW = baseColW;
    if (autoFit && availableW > minTableW) {
      const extra = availableW - minTableW;
      const extraPregunta = extra * 0.4;
      const extraColsTotal = extra * 0.6;

      cellPreguntaW = Math.round(basePreguntaW + extraPregunta);
      const perSubColExtra = extraColsTotal / numSubCols;
      cellColW = Math.round(baseColW + perSubColExtra);
    }

    // 3) Escalado de tipografías para no verse “chiquito” en tablet
    const scale = Math.min(1.25, Math.max(1, screenW / 768)); // hasta +25% aprox.
    const headerFont = 13.5 * scale;
    const questionFont = 15 * scale;
    const subHeaderFont = 12.5 * scale;

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

    // Ancho total final de la tabla (para que el ScrollView estire su contenido)
    const tableW = cellPreguntaW + numSubCols * cellColW;

    return (
      <View style={[styles.card, style]}>
        {/* Header */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ width: Math.max(tableW, availableW) }}>
          <View style={{ width: tableW }}>
            {/* Top header row */}
            <View style={[styles.row, styles.headerRowTop]}>
              <View style={[styles.cell, styles.headerCell, { width: cellPreguntaW }]}>
                <Text style={[styles.headerText, { fontSize: headerFont }]}>Pregunta</Text>
              </View>
              {columns?.map((label, i) => (
                <View key={i} style={[styles.cell, styles.headerCell, { width: cellColW * 2, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={[styles.headerText, { fontSize: headerFont }]}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Sub-header row: OK | NG per column */}
            <View style={[styles.row, styles.headerRowBottom]}>
              <View style={[styles.cell, { width: cellPreguntaW, borderRightWidth: 1, borderColor: BORDER }]} />
              {columns?.map((_, i) => (
                <View key={i} style={{ flexDirection: 'row', width: cellColW * 2 }}>
                  <View style={[styles.cell, styles.subHeaderCell, { width: cellColW }]}>
                    <Text style={[styles.subHeaderText, { fontSize: subHeaderFont }]}>OK</Text>
                  </View>
                  <View style={[styles.cell, styles.subHeaderCell, { width: cellColW }]}>
                    <Text style={[styles.subHeaderText, { fontSize: subHeaderFont }]}>NG</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Body */}
            {filtered.map((q) => {
              const values = getValues(q.id); // [v0, v1]
              return (
                <View key={q.id} style={[styles.row, styles.bodyRow]}>
                  <View style={[styles.cell, { width: cellPreguntaW, paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderRightWidth: 1, borderColor: BORDER, justifyContent: 'center' }]}>
                    <Text style={[styles.questionText, { fontSize: questionFont }]}>{q.title}</Text>
                  </View>
                  {columns?.map((_, colIndex) => {
                    // Para modo simple usamos sólo colIndex 0
                    if (mode === 'simple' && colIndex > 0) return null;

                    const v = values[colIndex]; // boolean | null | undefined
                    const okChecked = v === true;
                    const ngChecked = v === false;
                    return (
                      <View key={`${q.id}-${colIndex}`} style={{ flexDirection: 'row', width: cellColW * 2 }}>
                        <CheckboxCell
                          type="ok"
                          checked={okChecked}
                          onPress={() =>
                            handleChange(q.id, colIndex, 'ok', !okChecked)
                          }
                          disabled={readOnly}
                          cellW={cellColW}
                        />
                        <CheckboxCell
                          type="ng"
                          checked={ngChecked}
                          onPress={() =>
                            handleChange(q.id, colIndex, 'ng', !ngChecked)
                          }
                          disabled={readOnly}
                          cellW={cellColW}
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
  cellW: number;
}> = ({ type, checked, disabled, onPress, cellW }) => {
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityLabel={type === 'ok' ? 'Marcar OK' : 'Marcar NG'}
      accessibilityState={{ checked, disabled }}
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.8}
      style={[styles.cell, styles.cellCheckbox, { width: cellW }]}
    >
      <View
        style={[
          styles.checkbox,
          type === 'ok' ? styles.checkboxOk : styles.checkboxNg,
          checked &&
            (type === 'ok'
              ? styles.checkboxOkChecked
              : styles.checkboxNgChecked),
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
    // Un poco de padding para que availableW sea realista
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
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  subHeaderCell: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subHeaderText: { color: '#374151', fontWeight: '600' },
  // --- celdas comunes ---
  cell: { borderBottomWidth: 1, borderRightWidth: 1, borderColor: BORDER, justifyContent: 'center' },
  bodyRow: { backgroundColor: '#FFFFFF' },
  questionText: { color: '#111827' },
  cellCheckbox: { paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  checkboxOk: { borderColor: OK_COLOR },
  checkboxNg: { borderColor: NG_COLOR },
  checkboxOkChecked: { backgroundColor: OK_COLOR },
  checkboxNgChecked: { backgroundColor: NG_COLOR },
  checkboxMark: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, lineHeight: 14 },
  checkboxDisabled: { opacity: 0.6 },
});
