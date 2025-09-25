'use client';
import * as React from 'react';

/** ==== Tipos (los tuyos) ==== */
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
  /** Si true, solo muestra áreas que tengan parcialidades */
  onlyWithPartials?: boolean;
  /** Si true, inicia colapsado (oculto) */
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
      <div className="rounded-xl border p-4 text-sm text-gray-600">
        No hay historial de parcialidades.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + toggle global */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Historial de Parcialidades</h3>
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-1 text-sm text-blue-600 underline-offset-2 hover:underline"
        >
          {isOpen ? 'Ocultar' : 'Mostrar'}
          <span
            className={`inline-block transition-transform ${isOpen ? 'rotate-90' : ''}`}
            aria-hidden
          >
            ▶️
          </span>
        </button>
      </div>

      {/* Lista de áreas (headers siempre visibles; detalle colapsa globalmente) */}
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
          <section key={f.id} className="rounded-2xl border p-4 shadow-sm">
            <header className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h4 className="text-base font-medium capitalize">
                  {f.area?.name ?? `Área #${f.area?.id ?? f.id}`}
                </h4>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor(f.status)}`}>
                  {f.status ?? '—'}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Parciales: <b>{prs.length}</b>
              </div>
            </header>

            {/* Contenido colapsable global */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isOpen ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
              }`}
            >
              {prs.length === 0 ? (
                <p className="text-sm text-gray-500">Sin parcialidades registradas.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-1">
                      <thead className="text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-3 py-2 text-left">Fecha</th>
                          <th className="px-3 py-2 text-right">Cantidad</th>
                          <th className="px-3 py-2 text-right">Liberadas</th>
                          <th className="px-3 py-2 text-right">Malas</th>
                          <th className="px-3 py-2 text-right">Excedente</th>
                          <th className="px-3 py-2 text-right">Sin procesar</th>
                          <th className="px-3 py-2 text-right">Materia prima</th>
                          <th className="px-3 py-2 text-left">Operador</th>
                          <th className="px-3 py-2 text-left">Auditor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prs.map((p) => (
                          <tr key={p.id} className="bg-white">
                            <td className="px-3 py-2">{fmt(p.created_at)}</td>
                            <td className="px-3 py-2 text-right">{fmtN(p.quantity)}</td>
                            <td className="px-3 py-2 text-right font-medium">
                              {fmtN(p.release_quantity)}
                            </td>
                            <td className="px-3 py-2 text-right">{fmtN(p.bad_quantity)}</td>
                            <td className="px-3 py-2 text-right">{fmtN(p.excess_quantity)}</td>
                            <td className="px-3 py-2 text-right">{fmtN(p.noprocess_quantity)}</td>
                            <td className="px-3 py-2 text-right">{fmtN(p.material_quantity)}</td>
                            <td className="px-3 py-2">{p.user?.username ?? '—'}</td>
                            <td className="px-3 py-2">{p.formAuditory?.user?.username ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="text-sm font-semibold">
                          <td className="px-3 py-2 text-right">Totales</td>
                          <td className="px-3 py-2 text-right">{n2(totals.qty)}</td>
                          <td className="px-3 py-2 text-right">{n2(totals.rel)}</td>
                          <td className="px-3 py-2 text-right">{n2(totals.bad)}</td>
                          <td className="px-3 py-2 text-right">{n2(totals.excess)}</td>
                          <td className="px-3 py-2 text-right">{n2(totals.np)}</td>
                          <td className="px-3 py-2 text-right">{n2(totals.mat)}</td>
                          <td className="px-3 py-2" colSpan={4}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mt-3 text-sm text-gray-600">
                    <span className="mr-4">
                      Total liberadas en área: <b>{n2(totals.rel)}</b>
                    </span>
                    <span className="mr-4">
                      Objetivo OT: <b>{n2(workOrder.quantity)}</b>
                    </span>
                    <span className="mr-4">
                      Pendiente global: <b>{n2(Math.max(workOrder.quantity - totals.rel, 0))}</b>
                    </span>
                    <span>
                      Pendiente a liberar a cliente <b>{n2(Math.max(totals.qty - totals.rel, 0))}</b>
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
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(d);
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