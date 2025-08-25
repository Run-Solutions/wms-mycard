import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

// ===== Types =====
interface Area {
  id: number;
  name: string;
}

interface FormQuestion {
  id: number;
  title: string;
  role_id: number | null;
  areas: Area[];
}

type CellState = 'ok' | 'ng' | null;
/** Mapa: questionId -> arreglo por columna con 'ok' | 'ng' | null */
type SelectionMap = Record<number, CellState[]>;

interface Props {
  formQuestions: FormQuestion[];
  title: string;
  areaId: number;
  roleId: number | null; // null => no filtrar por rol
  columns?: string[]; // p.ej. ['Frente','Vuelta'] o ['Respuesta']
  readOnly?: boolean;
  /** Estado controlado opcional */
  valueMap?: SelectionMap;
  /** Callback opcional cuando cambia algo */
  onChangeSelection?: (next: SelectionMap) => void;
  onEdit: (id: number, currentTitle: string) => void;
  onDelete: (id: number) => void;
}

/**
 * AdvancedQuestionTable (React Native)
 * - Dos niveles de header: Nombre de columna y subheader OK/NG.
 * - Body con celdas OK/NG por columna.
 * - Scroll horizontal cuando hay muchas columnas.
 */
export const AdvancedQuestionTable: React.FC<Props> = memo(
  ({
    formQuestions,
    areaId,
    roleId,
    title,
    columns = ['Respuesta'],
    readOnly = false,
    valueMap,
    onChangeSelection,
    onEdit,
    onDelete,
  }) => {
    // Filtrado por área y rol (si roleId es null, no filtra por rol)
    const filtered = useMemo(
      () =>
        formQuestions.filter(
          (q) =>
            (roleId == null || Number(q.role_id) === Number(roleId)) &&
            q.areas?.some((a) => a.id === areaId)
        ),
      [formQuestions, roleId, areaId]
    );

    // ===== Estado interno no controlado (fallback si no se pasa valueMap) =====
    const [internalMap, setInternalMap] = useState<SelectionMap>({});

    // Inicializa filas nuevas o cambia el largo al cambiar columns
    useEffect(() => {
      setInternalMap((prev) => {
        const next: SelectionMap = { ...prev };
        for (const q of filtered) {
          const current = next[q.id] ?? Array(columns.length).fill(null);
          // Ajusta longitud si cambió la cantidad de columnas
          if (current.length !== columns.length) {
            const resized = Array<CellState>(columns.length).fill(null);
            for (let i = 0; i < Math.min(current.length, columns.length); i++) {
              resized[i] = current[i];
            }
            next[q.id] = resized;
          } else {
            next[q.id] = current;
          }
        }
        // Limpia ids que ya no están
        Object.keys(next).forEach((idStr) => {
          const id = Number(idStr);
          if (!filtered.some((q) => q.id === id)) {
            delete next[id];
          }
        });
        return next;
      });
    }, [filtered, columns.length]);

    const effectiveMap = valueMap ?? internalMap;

    const setMap = useCallback(
      (updater: (prev: SelectionMap) => SelectionMap) => {
        if (valueMap) {
          // controlado → notifica al padre
          const next = updater(valueMap);
          onChangeSelection?.(next);
        } else {
          // no controlado → actualiza local y notifica
          setInternalMap((prev) => {
            const next = updater(prev);
            onChangeSelection?.(next);
            return next;
          });
        }
      },
      [valueMap, onChangeSelection]
    );

    // Toggle manteniendo exclusión OK/NG
    const toggle = (qId: number, colIndex: number, kind: 'ok' | 'ng') => {
      if (readOnly) return;
      setMap((prev) => {
        const next = { ...prev };
        const row = [...(next[qId] ?? Array(columns.length).fill(null))];
        const current = row[colIndex];
        // si ya está seleccionado ese mismo, desmarcamos; si no, marcamos ese y anulamos el otro
        row[colIndex] = current === kind ? null : kind;
        next[qId] = row;
        return next;
      });
    };

    return (
      <View style={styles.card}>
        <Text style={styles.modalTitle}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header superior */}
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
              {columns.map((label, i) => (
                <View
                  key={i}
                  style={[styles.cell, styles.headerCell, styles.cellColSpan2]}
                >
                  <Text style={styles.headerText}>{label}</Text>
                </View>
              ))}
              <View
                style={[styles.cell, styles.headerCell, styles.actionsHeader]}
              >
                <Text style={styles.headerText}>Acciones</Text>
              </View>
            </View>

            {/* Sub-header: OK | NG por columna */}
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
              <View
                style={[styles.cell, styles.subHeaderCell, { width: 120 }]}
              />
            </View>

            {/* Body */}
            {filtered.map((q) => {
              const row =
                effectiveMap[q.id] ?? Array(columns.length).fill(null);
              return (
                <View key={q.id} style={[styles.row, styles.bodyRow]}>
                  {/* Pregunta */}
                  <View
                    style={[
                      styles.cell,
                      styles.cellPregunta,
                      { minWidth: 200, flexShrink: 0 },
                    ]}
                  >
                    <Text style={styles.questionText}>{q.title}</Text>
                  </View>

                  {/* Pares OK/NG por columna */}
                  {columns.map((_, colIndex) => {
                    const okChecked = row[colIndex] === 'ok';
                    const ngChecked = row[colIndex] === 'ng';
                    return (
                      <View key={`${q.id}-${colIndex}`} style={styles.pair}>
                        <CheckboxCell
                          type="ok"
                          checked={!!okChecked}
                          disabled={readOnly}
                          onPress={() => toggle(q.id, colIndex, 'ok')}
                        />
                        <CheckboxCell
                          type="ng"
                          checked={!!ngChecked}
                          disabled={readOnly}
                          onPress={() => toggle(q.id, colIndex, 'ng')}
                        />
                      </View>
                    );
                  })}

                  {/* Acciones */}
                  <View style={[styles.cell, styles.actionsCell, { width: 120 }]}>
                    <TouchableOpacity
                      onPress={() => onEdit(q.id, q.title)}
                      disabled={readOnly}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onDelete(q.id)}
                      disabled={readOnly}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionTextDelete}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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
}> = ({ type, checked, disabled, onPress }) => {
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityLabel={type === 'ok' ? 'Marcar OK' : 'Marcar NG'}
      accessibilityState={{ checked, disabled: !!disabled }}
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

// ===== Styles =====
const OK_COLOR = '#0038A8';
const NG_COLOR = '#DC2626';
const BORDER = '#9A9DA1';
const HEADER_BG = '#F3F4F6';

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  card: {
    backgroundColor: '#fdfaf6',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  headerRowTop: {
    backgroundColor: BORDER,
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
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
    width: 200, // debe coincidir con minWidth de cellPregunta
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
    minWidth: 60,
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
    minWidth: 120, // two checkbox columns under this header
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
    minWidth: 60,
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
  actionsHeader: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsCell: {
    width: 120,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 18,
    maxWidth: 60,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  actionText: {
    fontSize: 12.5,
    color: '#1F2937',
    fontWeight: '600',
  },
  actionTextDelete: {
    fontSize: 12.5,
    color: NG_COLOR,
    fontWeight: '700',

  },
});
