'use client';
import * as React from 'react';
import { useEffect, useState } from 'react';

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

// Totales de bloque por área usados por <PartialHistory />
export type AreaTotalsForPartialHistory = {
  good_or_release_or_plates?: number | null;
  bad_quantity?: number | null;
  excess_quantity?: number | null;
  noprocess_quantity?: number | null;
  material_quantity?: number | null;
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
  onlyWithPartials?: boolean;
  defaultCollapsed?: boolean;
  partialSectionOpen: boolean;
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
  const flows = (workOrder?.flow ?? []).filter(
    (f) => !onlyWithPartials || (f.partialReleases?.length ?? 0) > 0
  );

  const [openAreas, setOpenAreas] = useState<Set<string>>(() => new Set());

  // clave estable por área
  const areaKey = (f: Flow) => `area-${f.area?.id ?? f.id}`;

  // controlar colapsado por defecto
  useEffect(() => {
    if (!defaultCollapsed) {
      const all = new Set<string>(flows.map((f) => areaKey(f)));
      setOpenAreas(all);
    } else {
      setOpenAreas(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(flows.map((f) => f.id)), defaultCollapsed]);

  if (flows.length === 0) {
    return (
      <div className="rounded-xl border p-4 text-sm text-gray-600">
        No hay historial de parcialidades.
      </div>
    );
  }

  return (
    <div className="mt-10">
      {/* Header + toggle global */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">
          Historial de Parcialidades
        </h3>
        <button
          onClick={togglePartialSection}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          {partialSectionOpen ? 'Ocultar' : 'Mostrar'}
          <span>{partialSectionOpen ? '▼' : '▶'}</span>
        </button>
      </div>

      {!partialSectionOpen
        ? null
        : flows.map((f) => {
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

            // --- Remanentes por columna ---
            // Buenas (Rem) CORRECTO: total_bloque - Σ parciales.quantity
            const remBuenas =
              totals?.good_or_release_or_plates != null
                ? Math.max(num(totals.good_or_release_or_plates) - sums.qty, 0)
                : null; // si no hay total de bloque, no inventamos

            // Otras columnas necesitan total de bloque también
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

            const totalLiberadasVis = sums.rel;

            const key = areaKey(f);
            const areaOpen = openAreas.has(key);

            const toggleArea = () => {
              setOpenAreas((prev) => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
              });
            };

            return (
              <section
                key={f.id}
                className="rounded-2xl border p-4 shadow-sm mb-3"
              >
                <header className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleArea}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      aria-expanded={areaOpen}
                      aria-controls={`${key}-content`}
                      title={areaOpen ? 'Colapsar área' : 'Expandir área'}
                    >
                      <span>{areaOpen ? '▼' : '▶'}</span>
                      <h4 className="text-base font-medium capitalize">
                        {f.area?.name ?? `Área #${f.area?.id ?? f.id}`}
                      </h4>
                    </button>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${statusColor(
                        f.status
                      )}`}
                    >
                      {f.status ?? '—'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Parciales: <b>{prs.length}</b>
                  </div>
                </header>

                {/* Contenido colapsable por área */}
                <div
                  id={`${key}-content`}
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    areaOpen
                      ? 'max-h-[2000px] opacity-100 mt-3'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  {prs.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Sin parcialidades registradas.
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-y-1">
                          <thead className="text-xs uppercase text-gray-500">
                            <tr>
                              <th className="px-3 py-2 text-left">Fecha</th>
                              <th className="px-3 py-2 text-right">Cantidad</th>
                              <th className="px-3 py-2 text-right">
                                Liberadas
                              </th>
                              <th className="px-3 py-2 text-right">Malas</th>
                              <th className="px-3 py-2 text-right">
                                Excedente
                              </th>
                              <th className="px-3 py-2 text-right">
                                Sin procesar
                              </th>
                              <th className="px-3 py-2 text-right">
                                Materia prima
                              </th>
                              <th className="px-3 py-2 text-left">Operador</th>
                              <th className="px-3 py-2 text-left">Auditor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prs.map((p) => (
                              <tr key={p.id} className="bg-white">
                                <td className="px-3 py-2">
                                  {fmt(p.created_at)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {fmtN(p.quantity)}
                                </td>
                                <td className="px-3 py-2 text-right font-medium">
                                  {fmtN(p.release_quantity)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {fmtN(p.bad_quantity)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {fmtN(p.excess_quantity)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {fmtN(p.noprocess_quantity)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {fmtN(p.material_quantity)}
                                </td>
                                <td className="px-3 py-2">
                                  {p.user?.username ?? '—'}
                                </td>
                                <td className="px-3 py-2">
                                  {p.formAuditory?.user?.username ?? '—'}
                                </td>
                              </tr>
                            ))}

                            {/* Fila Remanente (alineada a totales de bloque si vienen) */}
                            {hasAnyRem(
                              remBuenas,
                              remMalas,
                              remExceso,
                              remNoProc,
                              remMat
                            ) && (
                              <tr className="bg-yellow-50">
                                <td className="px-3 py-2 font-medium">
                                  <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-medium">
                                    Remanente
                                  </span>
                                </td>

                                {/* Buenas: correcto = total bloque - Σ parciales.quantity */}
                                <td className="px-3 py-2 text-right font-semibold">
                                  {renderRem(remBuenas)}
                                </td>

                                {/* Liberadas: rem no aplica (lo pendiente es por liberar) */}
                                <td className="px-3 py-2 text-right">—</td>

                                {/* Otras columnas: solo si hay totales de bloque */}
                                <td className="px-3 py-2 text-right">
                                  {renderRem(remMalas)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {renderRem(remExceso)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {renderRem(remNoProc)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {renderRem(remMat)}
                                </td>
                                <td className="px-3 py-2">—</td>
                                <td className="px-3 py-2">—</td>
                              </tr>
                            )}
                          </tbody>

                          <tfoot>
                            <tr className="text-sm font-semibold">
                              <td className="px-3 py-2 text-right">Totales</td>
                              <td className="px-3 py-2 text-right">
                                {n2(totalBuenasVis)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {n2(totalLiberadasVis)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {n2(totalMalasVis)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {n2(totalExcesoVis)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {n2(totalNoProcVis)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {n2(totalMateriaVis)}
                              </td>
                              <td className="px-3 py-2" colSpan={4}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      <div className="mt-3 text-sm text-gray-600">
                        <span className="mr-4">
                          Total liberadas en área: <b>{n2(sums.rel)}</b>
                        </span>
                        <span className="mr-4">
                          Objetivo OT: <b>{n2(workOrder.quantity)}</b>
                        </span>
                        <span className="mr-4">
                          Pendiente global:{' '}
                          <b>
                            {n2(Math.max(workOrder.quantity - sums.rel, 0))}
                          </b>
                        </span>
                        <span>
                          Pendiente a liberar a cliente{' '}
                          <b>{n2(Math.max(sums.qty - sums.rel, 0))}</b>
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </section>
            );
          })}
    </div>
  );
}

/** ==== Helpers ==== */
function num(v: any): number {
  return Number(String(v ?? 0).replace(/[, ]/g, '')) || 0;
}
function n2(n: number): string {
  return new Intl.NumberFormat().format(n);
}
function fmt(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}
function fmtN(v: any): string {
  return v === null || v === undefined ? '—' : n2(num(v));
}
function statusColor(status?: string | null) {
  const s = (status ?? '').toLowerCase();
  if (s === 'completado') return 'bg-green-100 text-green-700';
  if (s === 'parcial') return 'bg-yellow-100 text-yellow-700';
  if (s === 'en proceso') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
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
