import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ViewStyle } from 'react-native';

// ===== Config de columnas (ajusta a tu UI) =====
const CELL_PREGUNTA_WIDTH = 280; // ancho fijo para la columna "Pregunta"
const CELL_COL_WIDTH = 60;       // ancho fijo para cada subcolumna (OK/NG)
const OK_COLOR = '#0038A8';
const NG_COLOR = '#DC2626';
const BORDER = '#9A9DA1';

// ===== Types =====
interface FormQuestion {
  id: number;
  title: string;
  role_id?: number | null;
}

interface CheckedGroup {
  ok: number[]; // question ids marked OK
  ng: number[]; // question ids marked NG
}

interface Props {
  formQuestions: FormQuestion[];
  roleId: number | null;
  /** Column headers. Each column renders two sub-columns: OK | NG */
  columns?: string[];
  /** For each column, the set of checked question ids for OK and NG */
  checkedQuestions: CheckedGroup[];
  /**
   * onToggle is called when a cell is pressed
   * @param id question id
   * @param columnIndex index of the column that was toggled
   * @param type 'ok' | 'ng'
   * @param checked new checked value for that cell
   */
  onToggle: (id: number, columnIndex: number, type: 'ok' | 'ng', checked: boolean) => void;
  /** When true, disables interactions */
  readOnly?: boolean;
  /** Optional style override for the container */
  style?: ViewStyle;
}

/**
 * SelectionQuestionTable (React Native)
 * - Alineación perfecta entre headers y body usando anchos fijos.
 * - Scroll horizontal cuando hay muchas columnas.
 */
const SelectionQuestionTable: React.FC<Props> = memo(({
  formQuestions,
  roleId,
  columns = ['Respuesta'],
  checkedQuestions,
  onToggle,
  readOnly = false,
  style,
}) => {
  const filtered = useMemo(
    () => formQuestions.filter((q) => q.role_id === roleId),
    [formQuestions, roleId]
  );

  const isChecked = useCallback(
    (questionId: number, colIndex: number, type: 'ok' | 'ng') => {
      const group = checkedQuestions[colIndex];
      if (!group) return false;
      return (type === 'ok' ? group.ok : group.ng).includes(questionId);
    },
    [checkedQuestions]
  );

  const handlePress = useCallback(
    (questionId: number, colIndex: number, type: 'ok' | 'ng') => {
      const next = !isChecked(questionId, colIndex, type);
      onToggle(questionId, colIndex, type, next);
    },
    [isChecked, onToggle]
  );

  return (
    <View style={[styles.card, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Top header row */}
          <View style={[styles.row, styles.headerRowTop]}>
            <View style={[styles.cell, styles.headerCell, styles.cellPregunta]}>
              <Text style={styles.headerText}>Pregunta</Text>
            </View>
            {columns.map((label, i) => (
              <View key={i} style={[styles.cell, styles.headerCell, styles.cellColSpan2]}>
                <Text style={styles.headerText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Sub-header row: OK | NG por columna */}
          <View style={[styles.row, styles.headerRowBottom]}>
            <View style={[styles.cell, styles.subHeaderSpacer]} />
            {columns.map((_, i) => (
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
          {filtered.map((q) => (
            <View key={q.id} style={[styles.row, styles.bodyRow]}>
              <View style={[styles.cell, styles.cellPreguntaBody]}>
                <Text style={styles.questionText}>{q.title}</Text>
              </View>
              {columns.map((_, colIndex) => (
                <View key={`${q.id}-${colIndex}`} style={styles.pair}>
                  <CheckboxCell
                    type="ok"
                    checked={isChecked(q.id, colIndex, 'ok')}
                    onPress={() => handlePress(q.id, colIndex, 'ok')}
                    disabled={readOnly}
                  />
                  <CheckboxCell
                    type="ng"
                    checked={isChecked(q.id, colIndex, 'ng')}
                    onPress={() => handlePress(q.id, colIndex, 'ng')}
                    disabled={readOnly}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
});

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

export default SelectionQuestionTable;
