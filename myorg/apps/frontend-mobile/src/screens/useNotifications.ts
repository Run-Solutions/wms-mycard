// myorg/apps/frontend-mobile/src/screens/useNotifications.ts
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getNotificationHistory,
  markNotificationAsRead,
} from '../api/notifications';
import { AuthContext } from '../contexts/AuthContext';
import { MODULE_CONFIG } from '../navigation/moduleConfig';

export type AppNotification = {
  id: string;
  title: string;
  body?: string;
  date?: string | null;
  isRead?: boolean;
  type?: string | null;
  payload?: {
    workOrderId?: string | null;
    inconformityId?: number | string | null;
  };
  inconformity?: {
    id: number;
    comments: string;
    reviewed: boolean;
  } | null;
};


/* ------------------------- Utils internos ------------------------- */

function extractWorkOrderId(body?: string, title?: string): string | null {
  const m = `${title ?? ''} ${body ?? ''}`.match(/orden\s+(\d+)/i);
  return m?.[1] ?? null;
}

function sortNotifs(a: AppNotification, b: AppNotification) {
  if (!!a.isRead !== !!b.isRead) return a.isRead ? 1 : -1; // no leídas primero
  const ta = a.date ? new Date(a.date).getTime() : 0;
  const tb = b.date ? new Date(b.date).getTime() : 0;
  return tb - ta; // recientes primero
}

function normalize(txt?: string) {
  return (txt ?? '')
    .toLowerCase()
    .normalize('NFD')                  // separa diacríticos
    .replace(/\p{Diacritic}/gu, '')    // elimina diacríticos (tildes)
    .replace(/\s+/g, ' ')              // colapsa espacios
    .trim();
}

// Heurística simple a partir de textos
function inferTypeFromTexts(title?: string, body?: string): string | null {
  const raw = `${title ?? ''} ${body ?? ''}`;
  const txt = normalize(raw);

  // 🧠 Orden IMPORTA: primero lo más específico

  // ——— AUDITORÍA (con/sin tilde, distintas redacciones) ———
  if (
    txt.includes('inconformidad de auditoria') ||
    txt.includes('inconformidad auditoria') ||
    txt.includes('auditoria reporta una inconformidad') ||
    txt.includes('tiene una inconformidad de auditoria') ||
    // por si llega en título sin cuerpo claro:
    (txt.includes('nueva inconformidad auditoria') || txt.includes('inconformidad auditoria'))
  ) {
    return 'inconformidades_auditor_planeador';
  }

  // ——— CQM ———
  if (
    txt.includes('inconformidad cqm') ||
    txt.includes('reporta una inconformidad cqm') ||
    txt.includes('cqm te ha reportado')
  ) {
    return 'inconformidades_cqm_planeador';
  }

  if (
    txt.includes('reporta una inconformidad del area receptora o auditoria a area previa') 
  ) {
    return 'inconformidades_operadores_planeador';
  }

  // ——— Vistos buenos ———
  if (txt.includes('pendiente de aceptacion en recepcion de vistos buenos')) {
    return 'recepcion_vistos_buenos';
  }

  // ——— Liberar producto ———
  if (txt.includes('estado listo')) {
    return 'liberar_producto';
  }

  // ——— Rechazos ———
  if (txt.includes('inconformidad de auditoria por parte del usuario')) {
    return 'rechazos';
  }

  // ——— Genérico (dejarlo al final para no “robar” los casos específicos) ———
  if (txt.includes('tiene una inconformidad') || txt.includes('nueva inconformidad')) {
    return 'inconformidades';
  }

  return null;
}

/* ------------------------- Roles del usuario ------------------------- */

export function getUserRoles(user: any): string[] {
  if (!user) return [];

  // role como string
  if (typeof user.role === 'string' && user.role.trim()) {
    return [user.role.toLowerCase()];
  }

  // role como objeto con name string
  if (user.role?.name && typeof user.role.name === 'string') {
    return [user.role.name.toLowerCase()];
  }

  // role como objeto con name array
  if (Array.isArray(user.role?.name)) {
    return user.role.name.map((r: any) => String(r).toLowerCase());
  }

  // Fallback: inferir desde módulos visibles
  if (Array.isArray(user.modules)) {
    const mods = user.modules.map((m: any) => String(m).toLowerCase());
    const inferred: string[] = [];
    if (mods.some((m: any) => m.includes('rechazos'))) inferred.push('auditor');
    if (mods.some((m: any) => m.includes('aceptar auditoria') || m.includes('cerrar orden'))) {
      inferred.push('operador');
    }
    if (mods.some((m: any) => m.includes('recepción') || m.includes('vistos buenos'))) {
      inferred.push('calidad');
    }
    if (mods.some((m: any) => m.includes('planeador') || m.includes('planificación') || m.includes('planeación'))) {
      inferred.push('planeador');
    }
    if (inferred.length) return Array.from(new Set(inferred));
  }

  return [];
}

/* ---------------------- Mapeos a módulos/rutas ---------------------- */

const MODULE_BY_TYPE: Record<string, string> = {
  rechazos: 'Rechazos',
  inconformidades: 'Inconformidades',
  liberar_producto: 'Liberar Producto',
  recepcion_vistos_buenos: 'Liberación de Vistos Buenos',
};

function routeFromModuleName(moduleName: string | null): string | null {
  if (!moduleName) return null;
  const cfg = MODULE_CONFIG.find((c) => c.name === moduleName);
  return cfg?.route ?? null;
}

/* --------------------------- Hook principal -------------------------- */

export function useNotifications() {
  const { user } = useContext(AuthContext);
  const [list, setList] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const userId = (user as any).sub ?? (user as any).id;

      const raw = await getNotificationHistory(userId);
      const normalized = (Array.isArray(raw) ? raw : []).map((n: any) => {
        const data = n.data ?? {};
        const type =
          data.type ??
          inferTypeFromTexts(n.title ?? n.subject, n.body ?? n.message);
          console.log("Texto notificación:", n.title, n.body, "=> type:", type);

        const workOrderId =
          data.workOrderId ??
          extractWorkOrderId(n.body ?? n.message, n.title ?? n.subject);

        const inconformity = n.inconformity
          ? {
              id: n.inconformity.id,
              comments: n.inconformity.comments ?? '',
              reviewed: n.inconformity.reviewed ?? false,
            }
          : null;

        return {
          id: String(n.id),
          title: n.title ?? n.subject ?? 'Notificación',
          body: n.body ?? n.message ?? '',
          date: n.date ?? n.createdAt ?? n.timestamp ?? n.created_at ?? null,
          isRead: Boolean(n.isRead ?? n.read ?? n.status === 'READ'),
          type,
          payload: {
            workOrderId: workOrderId ?? null,
            inconformityId: data.inconformityId ?? n.inconformity?.id ?? null,
          },
          inconformity,
        } as AppNotification;
      });

      normalized.sort(sortNotifs);
      setList(normalized);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => list.filter((n) => !n.isRead).length, [list]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)).sort(sortNotifs));
    } catch {}
  }, []);

  return { list, loading, error, unreadCount, fetchNotifications, markAsRead };
}

/* ---------------------- Resolución de destino ------------------------ */

/**
 * Si es auditor y tipo 'rechazos' ⇒ navega a 'RechazosScreen'.
 * Si es planeador y tipo 'rechazos' ⇒ NO navegar; usa shouldShowPlannerRechazosModal(...) en la UI.
 * En otros casos, reutiliza MODULE_CONFIG.route (igual que Dashboard) o fallbacks.
 */
export function getNotificationRoute(n: AppNotification, user: any): string | null {
  const roles = getUserRoles(user);
  const t = (n.type ?? '').toLowerCase();

  // Caso especial: auditor + rechazos -> RechazosScreen (nombre exacto de tu stack)
  if (roles.includes('auditor') && t === 'rechazos') {
    return 'RechazosScreen';
  }

  // Caso especial: planeador + rechazos -> se maneja con modal (no devolver ruta)
  if (roles.includes('planeador') && t === 'rechazos') {
    return null; // la UI mostrará modal con shouldShowPlannerRechazosModal(...)
  }

  // Resto por rol
  if (roles.includes('calidad')) {
    switch (t) {
      case 'recepcion_vistos_buenos':
        return routeFromModuleName('Recepcion de Vistos Buenos');
      case 'workorder_updated':
        return routeFromModuleName('Seguimiento de OTs') ?? 'WorkOrderDetailScreen';
      default:
        return routeFromModuleName('Dashboard') ?? 'DashboardScreen';
    }
  }

  if (roles.includes('operador')) {
    switch (t) {
      case 'liberar_producto':
        return routeFromModuleName('Liberar Producto');
      case 'inconformidades':
        return routeFromModuleName('Inconformidades');
      default:
        return routeFromModuleName('Dashboard') ?? 'DashboardScreen';
    }
  }

  if (roles.includes('auditor')) {
    switch (t) {
      case 'inconformidades':
        return routeFromModuleName('Inconformidades');
      default:
        return routeFromModuleName('Rechazos') ?? routeFromModuleName('Dashboard') ?? 'DashboardScreen';
    }
  }

  // Fallback por tipo
  const byType = routeFromModuleName(MODULE_BY_TYPE[t] ?? null);
  if (byType) return byType;

  // Fallback final
  return routeFromModuleName('Dashboard') ?? 'DashboardScreen';
}

/* ---------------------- Ayudante para el modal ----------------------- */

/** Úsalo en NotificationsScreen para decidir si abrir el modal. */
export function shouldShowPlannerCqmModal(n: AppNotification, user: any): boolean {
  const roles = getUserRoles(user);
  console.log('shouldShowPlannerCqmModal roles=', roles, ' notif=', n);
  return roles.includes('planeador') && (n.type ?? '').toLowerCase() === 'inconformidades_cqm_planeador';
}
export function shouldShowPlannerAuditorModal(n: AppNotification, user: any): boolean {
  const roles = getUserRoles(user);
  console.log('shouldShowPlannerAuditorModal roles=', roles, ' notif=', n);
  return roles.includes('planeador') && (n.type ?? '').toLowerCase() === 'inconformidades_auditor_planeador';
}
export function shouldShowPlannerOpersModal(n: AppNotification, user: any): boolean {
  const roles = getUserRoles(user);
  console.log('shouldShowPlannerOpersModal roles=', roles, ' notif=', n);
  return roles.includes('planeador') && (n.type ?? '').toLowerCase() === 'inconformidades_operadores_planeador';
}