// hooks/useModuleCounts.ts
import { useEffect, useMemo, useState } from 'react';

// TODO: reemplaza con tus API móviles reales (o reusa tus hooks existentes)
import { getPendingOrders as getPendingOrdersProducto } from '../api/aceptarProducto';
import { getPendingOrders as getPendingOrdersAuditoria } from '../api/aceptarAuditoria';
import { fetchPendingOrders as fetchVistosBuenosPend } from '../api/vistosBuenos';
import { getOrdersInCalidad } from '../api/recepcionCQM';
import { fetchWorkOrdersInProgress as fetchLiberar } from '../api/liberarProducto';
import { fetchWorkOrdersInProgress as fetchSeguimiento } from '../api/seguimientoDeOts';
import { getWorkOrders as getFinalizacion } from '../api/finalizacion';
import { fetchWorkOrdersInProgress as fetchCerrarOT } from '../api/cerrarOrdenDeTrabajo';
import { getWorkOrdersWithInconformidad } from '../api/inconformidades';
import { getWorkOrdersWithInconformidadAuditory } from '../api/rechazos';

type CountMap = Record<string, number>;
type PendingObj = { pendingOrders: any[] };

const getPendingCount = (data: unknown): number => {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object' && 'pendingOrders' in data) {
    const po = (data as PendingObj).pendingOrders;
    return Array.isArray(po) ? po.length : 0;
  }
  return 0;
};

const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function useModuleCounts(moduleNames: string[]) {
  const [counts, setCounts] = useState<CountMap>({});
  const [loading, setLoading] = useState(true);

  const resolvers = useMemo(() => {
    const map: Record<string, () => Promise<number>> = {
      'aceptar producto': async () => {
        try { return getPendingCount(await getPendingOrdersProducto()); } catch { return 0; }
      },
      'aceptar auditoria': async () => {
        try { return getPendingCount(await getPendingOrdersAuditoria()); } catch { return 0; }
      },
      'recepcion de vistos buenos': async () => {
        try { return getPendingCount(await fetchVistosBuenosPend()); } catch { return 0; }
      },
      'liberacion de vistos buenos': async () => {
        try { return getPendingCount(await getOrdersInCalidad()); } catch { return 0; }
      },
      'liberar producto': async () => {
        try { return getPendingCount(await fetchLiberar()); } catch { return 0; }
      },
      'seguimiento de ots': async () => {
        try { return getPendingCount(await fetchSeguimiento()); } catch { return 0; }
      },
      'finalizacion': async () => {
        try { return getPendingCount(await getFinalizacion()); } catch { return 0; }
      },
      'cerrar orden de trabajo': async () => {
        try { return getPendingCount(await fetchCerrarOT()); } catch { return 0; }
      },
      'inconformidades': async () => {
        try { return getPendingCount(await getWorkOrdersWithInconformidad()); } catch { return 0; }
      },
      'rechazos': async () => {
        try {
          const res = await getWorkOrdersWithInconformidadAuditory();
          // Une ambas fuentes
          const allFlows = Array.isArray(res?.pendingOrders)
          ? res.pendingOrders
          : [];
          const count = getPendingCount(allFlows);
          return typeof count === 'number' ? count : 0; // siempre número
        } catch (err) {
          console.warn('rechazos error:', err);
          return 0;
        }
      },
    };
    return map;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pairs = await Promise.all(
          moduleNames.map(async (name) => {
            const key = normalize(name);
            const resolver = resolvers[key];
            const count = resolver ? await resolver() : 0;
            return [name, count] as const;
          })
        );
        if (!cancelled) setCounts(Object.fromEntries(pairs));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [moduleNames, resolvers]);

  return { counts, loading };
}