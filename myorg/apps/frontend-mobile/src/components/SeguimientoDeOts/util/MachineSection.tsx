// MachineSection.tsx (versión con radio dots)
import React, {memo}from 'react';
import { View,   TouchableOpacity,
  Text, ScrollView, StyleSheet } from 'react-native';

export interface FormAnswerResponse {
  question_id: number;
  response_operator: boolean | null;
  response_cqm: boolean | null;
}

interface MachineSectionProps {
  machine: string;
  visible: boolean;
  questions: any[];
  areaId: number;
  roleId: string;
  filterRoleId: number | null;
  mode?: 'doble' | 'simple';
  columns?: string[];
  questionSlice?: [number, number];
  extras?: React.ReactNode;
  title?: string;
  answers: FormAnswerResponse[];
}

export const MachineSection: React.FC<MachineSectionProps> = memo(
  ({
    visible,
    questions,
    columns = ['Respuesta'],
    roleId,
    filterRoleId,
    mode = 'simple',
    questionSlice,
    extras,
    title,
    answers,
  }) => {
    if (!visible) return null;

    const filteredQuestions = (
      questionSlice
        ? questions.slice(questionSlice[0], questionSlice[1])
        : questions
      ).filter((q) => (filterRoleId == null ? true : q.role_id === filterRoleId));
    const getValues = (qid: number): (boolean | null | undefined)[] => {
      const rows = answers.filter((r) => r.question_id === qid);
      // aseguramos 2 slots (frente/vuelta). Para 'simple' usamos sólo el [0]
      const v0 =
        roleId === 'operator'
          ? rows[0]?.response_operator ?? false
          : rows[0]?.response_cqm ?? false;
      const v1 =
        roleId === 'operator'
          ? rows[1]?.response_operator ?? false
          : rows[1]?.response_cqm ?? false;
      return [v0, v1];
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
            {filteredQuestions.map((q) => {
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
                          onPress={() => {}}
                          disabled
                        />
                        <CheckboxCell
                          type="ng"
                          checked={ngChecked}
                          onPress={() => {}}
                          disabled
                        />
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {extras}
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
export const OperatorAdvancedMachineTable: React.FC<
  Omit<MachineSectionProps, 'roleId' | 'filterRoleId'>
> = (props) => (
  <MachineSection {...props} roleId="operator" filterRoleId={null} />
);
export const CqmAdvancedMachineTable: React.FC<
  Omit<MachineSectionProps, 'roleId' | 'filterRoleId'>
> = (props) => <MachineSection {...props} roleId="cqm" filterRoleId={3} />;
// ===== Styles =====
const OK_COLOR = '#0038A8';
const NG_COLOR = '#DC2626';
const BORDER = '#9A9DA1';

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
  subHeaderSpacer: {
    width: 200, // matches cellPregunta minWidth
    borderRightWidth: 1,
    borderColor: BORDER,
  },
  subHeaderPair: {
    flexDirection: 'row',
  },
  subHeaderCell: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: BORDER,
    minWidth: 50,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  subHeaderText: {
    color: '#374151',
    fontWeight: '600',
  },
  cell: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
  },
  cellPregunta: {
    maxWidth: 200,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  cellColSpan2: {
    maxWidth: 100, // two checkbox columns under this header
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyRow: {
    backgroundColor: '#FFFFFF',
  },
  questionText: {
    color: '#111827',
    fontSize: 15,
  },
  pair: {
    flexDirection: 'row',
  },
  cellCheckbox: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 50,
    alignItems: 'flex-start',
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
