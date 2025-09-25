'use client';

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

/** ==== Tipos ==== */
type UserLite = { username?: string | null };

type PartialRelease = {
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

type Props = {
  workOrder: WorkOrder;
  onlyWithPartials?: boolean;
  defaultCollapsed?: boolean;
};

export default function PartialHistory({
  workOrder,
  onlyWithPartials = false,
  defaultCollapsed = true,
}: Props) {
  const flows = (workOrder?.flow ?? []).filter(
    (f) => !onlyWithPartials || (f.partialReleases?.length ?? 0) > 0
  );

  const [isOpen, setIsOpen] = React.useState<boolean>(() => !defaultCollapsed);

  if (flows.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No hay historial de parcialidades.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Historial de Parcialidades</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsOpen((v) => !v)}
        >
          <Text style={styles.toggleText}>
            {isOpen ? 'Ocultar' : 'Mostrar'}
            <Text style={styles.toggleIcon}>{isOpen ? ' ▶️' : ' ▶️'}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {flows.map((f) => {
        const prs = (f.partialReleases ?? []).slice().sort(byDateAsc);
        const totals = prs.reduce(
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

        return (
          <View key={f.id} style={styles.flowBox}>
            <View style={styles.flowHeader}>
              <View>
                <Text style={styles.flowTitle}>
                  {f.area?.name ?? `Área #${f.area?.id ?? f.id}`}
                </Text>
                <View style={[styles.statusBadge, statusColor(f.status)]}>
                  <Text style={styles.statusText}>{f.status ?? '—'}</Text>
                </View>
              </View>
              <Text style={styles.flowMeta}>Parciales: {prs.length}</Text>
            </View>

            {isOpen && (
              <View style={styles.flowContent}>
                {prs.length === 0 ? (
                  <Text style={styles.noPartials}>Sin parcialidades registradas.</Text>
                ) : (
                  <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View>
                        <View style={styles.tableHeaderRow}>
                          <Text style={[styles.tableHeaderCell, styles.dateCol]}>Fecha</Text>
                          <Text style={styles.tableHeaderCell}>Cantidad</Text>
                          <Text style={styles.tableHeaderCell}>Liberadas</Text>
                          <Text style={styles.tableHeaderCell}>Malas</Text>
                          <Text style={styles.tableHeaderCell}>Excedente</Text>
                          <Text style={styles.tableHeaderCell}>Sin procesar</Text>
                          <Text style={styles.tableHeaderCell}>Materia prima</Text>
                          <Text style={[styles.tableHeaderCell, styles.userCol]}>Operador</Text>
                          <Text style={[styles.tableHeaderCell, styles.userCol]}>Auditor</Text>
                        </View>
                        {prs.map((p) => (
                          <View key={p.id} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.dateCol]}>{fmt(p.created_at)}</Text>
                            <Text style={styles.tableCell}>{fmtN(p.quantity)}</Text>
                            <Text style={[styles.tableCell, styles.boldCell]}>{fmtN(p.release_quantity)}</Text>
                            <Text style={styles.tableCell}>{fmtN(p.bad_quantity)}</Text>
                            <Text style={styles.tableCell}>{fmtN(p.excess_quantity)}</Text>
                            <Text style={styles.tableCell}>{fmtN(p.noprocess_quantity)}</Text>
                            <Text style={styles.tableCell}>{fmtN(p.material_quantity)}</Text>
                            <Text style={[styles.tableCell, styles.userCol]}>{p.user?.username ?? '—'}</Text>
                            <Text style={[styles.tableCell, styles.userCol]}>
                              {p.formAuditory?.user?.username ?? '—'}
                            </Text>
                          </View>
                        ))}
                        <View style={[styles.tableRow, styles.footerRow]}>
                          <Text style={[styles.tableCell, styles.dateCol, styles.boldCell]}>Totales</Text>
                          <Text style={[styles.tableCell, styles.boldCell]}>{n2(totals.qty)}</Text>
                          <Text style={[styles.tableCell, styles.boldCell]}>{n2(totals.rel)}</Text>
                          <Text style={[styles.tableCell, styles.boldCell]}>{n2(totals.bad)}</Text>
                          <Text style={[styles.tableCell, styles.boldCell]}>{n2(totals.excess)}</Text>
                          <Text style={[styles.tableCell, styles.boldCell]}>{n2(totals.np)}</Text>
                          <Text style={[styles.tableCell, styles.boldCell]}>{n2(totals.mat)}</Text>
                          <Text style={[styles.tableCell, styles.userCol]}></Text>
                          <Text style={[styles.tableCell, styles.userCol]}></Text>
                        </View>
                      </View>
                    </ScrollView>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryText}>
                        Total liberadas en área: <Text style={styles.boldInline}>{n2(totals.rel)}</Text>
                      </Text>
                      <Text style={styles.summaryText}>
                        Objetivo OT: <Text style={styles.boldInline}>{n2(workOrder.quantity)}</Text>
                      </Text>
                      <Text style={styles.summaryText}>
                        Pendiente global: <Text style={styles.boldInline}>{n2(Math.max(workOrder.quantity - totals.rel, 0))}</Text>
                      </Text>
                      <Text style={styles.summaryText}>
                        Pendiente a liberar a cliente: <Text style={styles.boldInline}>{n2(Math.max(totals.qty - totals.rel, 0))}</Text>
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
  );
}

/** ==== Helpers ==== */
function num(v: any): number {
  return Number(String(v ?? 0).replace(/[, ]/g, '')) || 0;
}
function n2(n: number): string {
  try {
    return new Intl.NumberFormat().format(n);
  } catch (err) {
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
  } catch (err) {
    return d.toLocaleString();
  }
}
function fmtN(v: any): string {
  return v === null || v === undefined ? '—' : n2(num(v));
}
function statusColor(status?: string | null) {
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

/** ==== Styles ==== */
const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    gap: 16,
  },
  emptyBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: '#4b5563',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  toggleText: {
    fontSize: 14,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  toggleIcon: {
    fontWeight: '600',
  },
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
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusSuccess: {
    backgroundColor: '#dcfce7',
  },
  statusWarning: {
    backgroundColor: '#fef3c7',
  },
  statusInfo: {
    backgroundColor: '#dbeafe',
  },
  statusNeutral: {
    backgroundColor: '#f3f4f6',
  },
  flowMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  flowContent: {
    marginTop: 16,
    gap: 12,
  },
  noPartials: {
    fontSize: 14,
    color: '#6b7280',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableHeaderCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    minWidth: 110,
    textAlign: 'center',
  },
  dateCol: {
    minWidth: 160,
    textAlign: 'left',
  },
  userCol: {
    minWidth: 130,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  footerRow: {
    backgroundColor: '#f3f4f6',
  },
  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1f2937',
    textAlign: 'center',
  },
  boldCell: {
    fontWeight: '600',
  },
  summaryRow: {
    marginTop: 12,
    flexDirection: 'column',
    gap: 6,
  },
  summaryText: {
    fontSize: 13,
    color: '#374151',
  },
  boldInline: {
    fontWeight: '600',
  },
});

export type { PartialRelease };