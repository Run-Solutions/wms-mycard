import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  ViewStyle,
} from 'react-native';

// ===== Config de columnas (ajusta a tu UI) =====
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
  columns?: string[];
  checkedQuestions: CheckedGroup[];
  onToggle: (
    id: number,
    columnIndex: number,
    type: 'ok' | 'ng',
    checked: boolean
  ) => void;
  readOnly?: boolean;
  style?: ViewStyle;
  /** Nuevo: si true, la tabla se expande para llenar el ancho disponible en pantallas grandes */
  autoFit?: boolean;
}

const SelectionQuestionTable: React.FC<Props> = memo(
  ({
    formQuestions,
    roleId,
    columns = ['Respuesta'],
    checkedQuestions,
    onToggle,
    readOnly = false,
    style,
    autoFit = true, // habilitado por defecto
  }) => {
    const { width: screenW } = useWindowDimensions();

    // 1) Filtrado por rol
    const filtered = useMemo(
      () => formQuestions.filter((q) => q.role_id === roleId),
      [formQuestions, roleId]
    );

    // 2) Cálculo de anchos responsivos -------------------------------
    // Valores base (los que ya usabas)
    const basePreguntaW = 280;
    const baseColW = 60;
    const numSubCols = columns.length * 2;
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

    // Ancho total final de la tabla (para que el ScrollView estire su contenido)
    const tableW = cellPreguntaW + numSubCols * cellColW;

    return (
      <View style={[styles.card, style]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ width: Math.max(tableW, availableW) }}
        >
          <View style={{ width: tableW }}>
            {/* Top header row */}
            <View style={[styles.row, styles.headerRowTop]}>
              <View
                style={[
                  styles.cell,
                  styles.headerCell,
                  { width: cellPreguntaW },
                ]}
              >
                <Text style={[styles.headerText, { fontSize: headerFont }]}>
                  Pregunta
                </Text>
              </View>
              {columns.map((label, i) => (
                <View
                  key={i}
                  style={[
                    styles.cell,
                    styles.headerCell,
                    {
                      width: cellColW * 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <Text style={[styles.headerText, { fontSize: headerFont }]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Sub-header row: OK | NG por columna */}
            <View style={[styles.row, styles.headerRowBottom]}>
              <View
                style={[
                  styles.cell,
                  {
                    width: cellPreguntaW,
                    borderRightWidth: 1,
                    borderColor: BORDER,
                  },
                ]}
              />
              {columns.map((_, i) => (
                <View
                  key={i}
                  style={{ flexDirection: 'row', width: cellColW * 2 }}
                >
                  <View
                    style={[
                      styles.cell,
                      styles.subHeaderCell,
                      { width: cellColW },
                    ]}
                  >
                    <Text
                      style={[
                        styles.subHeaderText,
                        { fontSize: subHeaderFont },
                      ]}
                    >
                      OK
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.cell,
                      styles.subHeaderCell,
                      { width: cellColW },
                    ]}
                  >
                    <Text
                      style={[
                        styles.subHeaderText,
                        { fontSize: subHeaderFont },
                      ]}
                    >
                      NG
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Body */}
            {filtered.map((q) => (
              <View key={q.id} style={[styles.row, styles.bodyRow]}>
                <View
                  style={[
                    styles.cell,
                    {
                      width: cellPreguntaW,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderBottomWidth: 1,
                      borderRightWidth: 1,
                      borderColor: BORDER,
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <Text
                    style={[styles.questionText, { fontSize: questionFont }]}
                  >
                    {q.title}
                  </Text>
                </View>
                {columns.map((_, colIndex) => (
                  <View
                    key={`${q.id}-${colIndex}`}
                    style={{ flexDirection: 'row', width: cellColW * 2 }}
                  >
                    <CheckboxCell
                      type="ok"
                      checked={isChecked(q.id, colIndex, 'ok')}
                      onPress={() => handlePress(q.id, colIndex, 'ok')}
                      disabled={readOnly}
                      cellW={cellColW}
                    />
                    <CheckboxCell
                      type="ng"
                      checked={isChecked(q.id, colIndex, 'ng')}
                      onPress={() => handlePress(q.id, colIndex, 'ng')}
                      disabled={readOnly}
                      cellW={cellColW}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }
);

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
  row: { flexDirection: 'row', alignItems: 'stretch' },
  headerRowTop: { backgroundColor: BORDER },
  headerRowBottom: { backgroundColor: BORDER },
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
  cell: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
  },
  bodyRow: { backgroundColor: '#FFFFFF' },
  questionText: { color: '#111827' },
  cellCheckbox: {
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
  checkboxOk: { borderColor: OK_COLOR },
  checkboxNg: { borderColor: NG_COLOR },
  checkboxOkChecked: { backgroundColor: OK_COLOR },
  checkboxNgChecked: { backgroundColor: NG_COLOR },
  checkboxMark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 14,
  },
  checkboxDisabled: { opacity: 0.6 },
});

export default SelectionQuestionTable;
