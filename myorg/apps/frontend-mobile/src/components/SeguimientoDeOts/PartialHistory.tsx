'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

/** Enable LayoutAnimation on Android */
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type AreaTotalsForPartialHistory = {
  good_or_release_or_plates?: number | null;
  bad_quantity?: number | null;
  excess_quantity?: number | null;
  noprocess_quantity?: number | null;
  material_quantity?: number | null;
};

const COL_W = {
  date: 160,
  num: 110,
  user: 130,
} as const;

const HCell = ({
  w,
  children,
  align = 'center',
}: {
  w: number;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) => (
  <View style={[styles.hcellBox, { width: w }]}>
    <Text
      style={[
        styles.hcellText,
        align === 'left' && { textAlign: 'left' },
        align === 'right' && { textAlign: 'right' },
      ]}
      numberOfLines={1}
    >
      {children}
    </Text>
  </View>
);

const Cell = ({
  w,
  children,
  bold = false,
  align = 'center',
}: {
  w: number;
  children: React.ReactNode;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
}) => (
  <View style={[styles.cellBox, { width: w }]}>
    <Text
      style={[
        styles.cellText,
        bold && styles.boldCell,
        align === 'left' && { textAlign: 'left' },
        align === 'right' && { textAlign: 'right' },
      ]}
      numberOfLines={1}
    >
      {children}
    </Text>
  </View>
);

/** ==== Tipos ==== */
type UserLite = { username?: string | null };

export type PartialRelease = {
  id: number;
  quantity?: number | null;
  release_quantity?: number | null;
  bad_quantity?: number | null;
  excess_quantity?: number | null;
  noprocess_quantity?: number | null;
  material_quantity?: number | null;
  observation?: string | null;
  validated?: boolean | null;
  created_at?: string | null;
  user?: UserLite | null;
  formAuditory?: { user?: UserLite | null } | null;
};

type Flow = {
  id: number;
  status?: string | null;
  area?: { id: number; name?: string | null } | null;
  partialReleases?: PartialRelease[] | null;
};

type WorkOrder = {
  id: number;
  ot_id?: string | null;
  quantity: number;
  flow?: Flow[] | null;
};

/** Totales de bloque por área (para calcular Rem exacto por columna) */
type AreaTotals = {
  /** buenas totales del bloque (release_quantity | good_quantity | plates) */
  good_or_release_or_plates?: number | null;
  bad_quantity?: number | null;
  excess_quantity?: number | null;
  noprocess_quantity?: number | null;
  material_quantity?: number | null;
};

type Props = {
  workOrder: WorkOrder;
  /** Si true, solo muestra áreas que tengan parcialidades */
  onlyWithPartials?: boolean;
  /** Si true, inicia colapsado (oculto) */
  defaultCollapsed?: boolean;
  /** Estado global (controlado por el padre) */
  partialSectionOpen: boolean;
  /** Toggle global (controlado por el padre) */
  togglePartialSection: () => void;
  /**
   * (OPCIONAL) Totales de bloque por área (id -> totales).
   * Ej: { 2: { good_or_release_or_plates: 2640, ... } }
   */
  areaTotalsByAreaId?: Record<number, AreaTotals>;
};

export default function PartialHistory({
  workOrder,
  onlyWithPartials = false,
  defaultCollapsed = true,
  partialSectionOpen,
  togglePartialSection,
  areaTotalsByAreaId,
}: Props) {
  const flows = useMemo(
    () =>
      (workOrder?.flow ?? []).filter(
        (f) => !onlyWithPartials || (f.partialReleases?.length ?? 0) > 0
      ),
    [workOrder?.flow, onlyWithPartials]
  );

  // Estado de acordeones por área (como en web)
  const [openAreas, setOpenAreas] = useState<Set<string>>(() => new Set());

  // Key estable por área
  const areaKey = (f: Flow) => `area-${f.area?.id ?? f.id}`;

  // Inicializa acordeones por área cuando cambian flows o defaultCollapsed
  useEffect(() => {
    const next = new Set<string>();
    if (!defaultCollapsed) {
      flows.forEach((f) => next.add(areaKey(f)));
    }
    setOpenAreas(next);
  }, [defaultCollapsed, JSON.stringify(flows.map((f) => f.id))]);

  if (flows.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No hay historial de parcialidades.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header + toggle global (controlado vía props) */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Historial de Parcialidades</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut
            );
            togglePartialSection();
          }}
          accessibilityRole="button"
          accessibilityLabel={
            partialSectionOpen ? 'Ocultar historial' : 'Mostrar historial'
          }
        >
          <Text style={styles.toggleText}>
            {partialSectionOpen ? 'Ocultar' : 'Mostrar'}{' '}
            <Text style={styles.toggleIcon}>
              {partialSectionOpen ? '▼' : '▶'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido global colapsable */}
      {!partialSectionOpen ? null : (
        <View>
          {flows.map((f) => {
            const prs = (f.partialReleases ?? []).slice().sort(byDateAsc);

            // Sumas desde parciales (no totales de bloque)
            const sums = prs.reduce(
              (acc, p) => {
                acc.qty += num(p.quantity);
                acc.rel += num(p.release_quantity);
                acc.bad += num(p.bad_quantity);
                acc.excess += num(p.excess_quantity);
                acc.np += num(p.noprocess_quantity);
                acc.mat += num(p.material_quantity);
                return acc;
              },
              { qty: 0, rel: 0, bad: 0, excess: 0, np: 0, mat: 0 }
            );

            const areaId = f.area?.id ?? f.id;
            const totals = areaTotalsByAreaId?.[areaId];

            // --- Remanentes por columna (como en web) ---
            const remBuenas =
              totals?.good_or_release_or_plates != null
                ? Math.max(num(totals.good_or_release_or_plates) - sums.qty, 0)
                : null;

            const remMalas =
              totals?.bad_quantity != null
                ? Math.max(num(totals.bad_quantity) - sums.bad, 0)
                : null;

            const remExceso =
              totals?.excess_quantity != null
                ? Math.max(num(totals.excess_quantity) - sums.excess, 0)
                : null;

            const remNoProc =
              totals?.noprocess_quantity != null
                ? Math.max(num(totals.noprocess_quantity) - sums.np, 0)
                : null;

            const remMat =
              totals?.material_quantity != null
                ? Math.max(num(totals.material_quantity) - sums.mat, 0)
                : null;

            // Totales visibles por columna: response ↔ Σ parciales + Rem
            const totalBuenasVis =
              totals?.good_or_release_or_plates != null
                ? num(totals.good_or_release_or_plates)
                : sums.qty + num(remBuenas ?? 0);

            const totalMalasVis =
              totals?.bad_quantity != null
                ? num(totals.bad_quantity)
                : sums.bad + num(remMalas ?? 0);

            const totalExcesoVis =
              totals?.excess_quantity != null
                ? num(totals.excess_quantity)
                : sums.excess + num(remExceso ?? 0);

            const totalNoProcVis =
              totals?.noprocess_quantity != null
                ? num(totals.noprocess_quantity)
                : sums.np + num(remNoProc ?? 0);

            const totalMateriaVis =
              totals?.material_quantity != null
                ? num(totals.material_quantity)
                : sums.mat + num(remMat ?? 0);

            // Nota: "Liberadas" no tiene remanente; si tienes total de bloque, añádelo a AreaTotals y úsalo aquí.
            const totalLiberadasVis = sums.rel;

            const key = areaKey(f);
            const areaOpen = openAreas.has(key);

            const toggleArea = () => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut
              );
              setOpenAreas((prev) => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
              });
            };

            return (
              <View key={f.id} style={styles.flowBox}>
                {/* Header de área */}
                <View style={styles.flowHeader}>
                  <View style={{ flexShrink: 1 }}>
                    <TouchableOpacity
                      onPress={toggleArea}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={
                        areaOpen ? 'Colapsar área' : 'Expandir área'
                      }
                      accessibilityState={{ expanded: areaOpen }}
                      style={styles.areaToggle}
                    >
                      <Text style={styles.caret}>{areaOpen ? '▼' : '▶'}</Text>
                      <Text style={styles.flowTitle} numberOfLines={1}>
                        {f.area?.name ?? `Área #${f.area?.id ?? f.id}`}
                      </Text>
                    </TouchableOpacity>
                    <View
                      style={[styles.statusBadge, statusColorStyle(f.status)]}
                    >
                      <Text style={styles.statusText}>{f.status ?? '—'}</Text>
                    </View>
                  </View>
                  <Text style={styles.flowMeta}>Parciales: {prs.length}</Text>
                </View>

                {/* Contenido colapsable por área */}
                {areaOpen && (
                  <View style={styles.flowContent}>
                    {prs.length === 0 ? (
                      <Text style={styles.noPartials}>
                        Sin parcialidades registradas.
                      </Text>
                    ) : (
                      <>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                        >
                          <View>
                            <View style={styles.tableHeaderRow}>
                              <HCell w={COL_W.date} align="left">
                                Fecha
                              </HCell>
                              <HCell w={COL_W.num}>Cantidad</HCell>
                              <HCell w={COL_W.num}>Liberadas</HCell>
                              <HCell w={COL_W.num}>Malas</HCell>
                              <HCell w={COL_W.num}>Excedente</HCell>
                              <HCell w={COL_W.num}>Sin procesar</HCell>
                              <HCell w={COL_W.num}>Materia prima</HCell>
                              <HCell w={COL_W.user} align="left">
                                Operador
                              </HCell>
                              <HCell w={COL_W.user} align="left">
                                Auditor
                              </HCell>
                            </View>

                            {/* Filas de parciales */}
                            {prs.map((p) => (
                              <View key={p.id} style={styles.tableRow}>
                                <Cell w={COL_W.date} align="left">
                                  {fmt(p.created_at)}
                                </Cell>
                                <Cell w={COL_W.num}>{fmtN(p.quantity)}</Cell>
                                <Cell w={COL_W.num} bold>
                                  {fmtN(p.release_quantity)}
                                </Cell>
                                <Cell w={COL_W.num}>
                                  {fmtN(p.bad_quantity)}
                                </Cell>
                                <Cell w={COL_W.num}>
                                  {fmtN(p.excess_quantity)}
                                </Cell>
                                <Cell w={COL_W.num}>
                                  {fmtN(p.noprocess_quantity)}
                                </Cell>
                                <Cell w={COL_W.num}>
                                  {fmtN(p.material_quantity)}
                                </Cell>
                                <Cell w={COL_W.user} align="left">
                                  {p.user?.username ?? '—'}
                                </Cell>
                                <Cell w={COL_W.user} align="left">
                                  {p.formAuditory?.user?.username ?? '—'}
                                </Cell>
                              </View>
                            ))}

                            {/* Fila Remanente */}
                            {hasAnyRem(
                              remBuenas,
                              remMalas,
                              remExceso,
                              remNoProc,
                              remMat
                            ) && (
                              <View style={[styles.tableRow, styles.remRow]}>
                                <Cell w={COL_W.date} align="left">
                                  <Text style={styles.remPill}>Remanente</Text>
                                </Cell>
                                <Cell w={COL_W.num} bold>
                                  {renderRem(remBuenas)}
                                </Cell>
                                <Cell w={COL_W.num}>—</Cell>
                                <Cell w={COL_W.num}>{renderRem(remMalas)}</Cell>
                                <Cell w={COL_W.num}>
                                  {renderRem(remExceso)}
                                </Cell>
                                <Cell w={COL_W.num}>
                                  {renderRem(remNoProc)}
                                </Cell>
                                <Cell w={COL_W.num}>{renderRem(remMat)}</Cell>
                                <Cell w={COL_W.user} align="left">
                                  —
                                </Cell>
                                <Cell w={COL_W.user} align="left">
                                  —
                                </Cell>
                              </View>
                            )}

                            {/* Fila Totales (response ↔ Σ parciales + Rem) */}
                            <View style={[styles.tableRow, styles.footerRow]}>
                              <Cell w={COL_W.date} align="left" bold>
                                Totales
                              </Cell>
                              <Cell w={COL_W.num} bold>
                                {n2(totalBuenasVis)}
                              </Cell>
                              <Cell w={COL_W.num} bold>
                                {n2(totalLiberadasVis)}
                              </Cell>
                              <Cell w={COL_W.num} bold>
                                {n2(totalMalasVis)}
                              </Cell>
                              <Cell w={COL_W.num} bold>
                                {n2(totalExcesoVis)}
                              </Cell>
                              <Cell w={COL_W.num} bold>
                                {n2(totalNoProcVis)}
                              </Cell>
                              <Cell w={COL_W.num} bold>
                                {n2(totalMateriaVis)}
                              </Cell>
                              <Cell w={COL_W.user}>{''}</Cell>
                              <Cell w={COL_W.user}>{''}</Cell>
                            </View>
                          </View>
                        </ScrollView>

                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryText}>
                            Total liberadas en área:{' '}
                            <Text style={styles.boldInline}>
                              {n2(totalLiberadasVis)}
                            </Text>
                          </Text>
                          <Text style={styles.summaryText}>
                            Objetivo OT:{' '}
                            <Text style={styles.boldInline}>
                              {n2(workOrder.quantity)}
                            </Text>
                          </Text>
                          <Text style={styles.summaryText}>
                            Pendiente global:{' '}
                            <Text style={styles.boldInline}>
                              {n2(
                                Math.max(
                                  workOrder.quantity - totalLiberadasVis,
                                  0
                                )
                              )}
                            </Text>
                          </Text>
                          <Text style={styles.summaryText}>
                            Pendiente a liberar a cliente:{' '}
                            <Text style={styles.boldInline}>
                              {n2(
                                Math.max(totalBuenasVis - totalLiberadasVis, 0)
                              )}
                            </Text>
                          </Text>
                        </View>
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
}

/** ==== Helpers ==== */
function num(v: any): number {
  return Number(String(v ?? 0).replace(/[, ]/g, '')) || 0;
}
function n2(n: number): string {
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return `${n}`;
  }
}
function fmt(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}
function fmtN(v: any): string {
  return v === null || v === undefined ? '—' : n2(num(v));
}
function statusColorStyle(status?: string | null) {
  const s = (status ?? '').toLowerCase();
  if (s === 'completado') return styles.statusSuccess;
  if (s === 'parcial') return styles.statusWarning;
  if (s === 'en proceso') return styles.statusInfo;
  return styles.statusNeutral;
}
function byDateAsc(a: PartialRelease, b: PartialRelease) {
  const ta = new Date(a.created_at ?? 0).getTime();
  const tb = new Date(b.created_at ?? 0).getTime();
  return ta - tb;
}
function renderRem(v: number | null | undefined) {
  return v == null ? '—' : n2(Math.max(v, 0));
}
function hasAnyRem(
  buenas: number | null | undefined,
  malas: number | null | undefined,
  exceso: number | null | undefined,
  noproceso: number | null | undefined,
  materia: number | null | undefined
) {
  return (
    (buenas ?? 0) > 0 ||
    (malas ?? 0) > 0 ||
    (exceso ?? 0) > 0 ||
    (noproceso ?? 0) > 0 ||
    (materia ?? 0) > 0
  );
}

/** ==== Styles ==== */
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    padding: 10,
    borderRadius: 16,
    elevation: 3,
  },
  emptyBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  emptyText: { fontSize: 14, color: '#4b5563' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    color: '#111827',
  },
  toggleText: {
    fontSize: 14,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  toggleIcon: { fontWeight: '600' },
  flowBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  areaToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caret: { fontSize: 14, marginRight: 6, color: '#2563eb' },
  flowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    maxWidth: '90%',
  },
  statusBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusSuccess: { backgroundColor: '#dcfce7' },
  statusWarning: { backgroundColor: '#fef3c7' },
  statusInfo: { backgroundColor: '#dbeafe' },
  statusNeutral: { backgroundColor: '#f3f4f6' },
  flowMeta: { fontSize: 12, color: '#6b7280' },
  flowContent: { marginTop: 16, gap: 12 },
  noPartials: { fontSize: 14, color: '#6b7280' },
  tableHeaderCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    minWidth: 110,
    textAlign: 'center',
  },
  dateCol: { minWidth: 160, textAlign: 'left' },
  userCol: { minWidth: 130, textAlign: 'left' },

  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1f2937',
    textAlign: 'center',
  },
  summaryRow: { marginTop: 12, flexDirection: 'column', gap: 6 },
  summaryText: { fontSize: 13, color: '#374151' },
  boldInline: { fontWeight: '600' },

  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  hcellBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  hcellText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  cellBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 12,
    color: '#1f2937',
    textAlign: 'center',
  },
  boldCell: { fontWeight: '600' },
  remRow: { backgroundColor: '#fff7ed' },
  remPill: { fontWeight: '600', color: '#9a3412' },
  footerRow: { backgroundColor: '#f3f4f6' },
});
