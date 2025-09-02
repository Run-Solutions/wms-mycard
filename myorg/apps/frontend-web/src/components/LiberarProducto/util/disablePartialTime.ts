import React, { useEffect, useMemo, useState } from "react";

// ===== Tipos =====
export type PartialRelease = {
  id: number;
  work_order_flow_id: number;
  quantity?: number | null;
  observation?: string | null;
  created_at: string; // ISO
  updated_at?: string;
};

export type FlowObj = {
  id: number;
  status: string; // "En proceso", "Parcial", etc.
  areaResponse: any | null;
  workOrder: { quantity: number };
  partialReleases: PartialRelease[];
};

// ===== Constantes =====
const MS_24H = 24 * 60 * 60 * 1000;

// ===== Utilidades puras (compartibles Web / RN) =====
export function getLastPartialAt(partials: PartialRelease[]): Date | null {
  if (!partials || partials.length === 0) return null;
  const last = [...partials].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
  return new Date(last.created_at);
}

export function getPartialCooldown(flow: FlowObj) {
  const lastAt = getLastPartialAt(flow.partialReleases);
  if (!lastAt) {
    return {
      hasLastPartial: false,
      isLocked: false,
      lastPartialAt: null as Date | null,
      unlocksAt: null as Date | null,
      remainingMs: 0,
    };
  }
  const unlocksAt = new Date(lastAt.getTime() + MS_24H);
  const now = new Date();
  const remainingMs = Math.max(0, unlocksAt.getTime() - now.getTime());
  return {
    hasLastPartial: true,
    isLocked: remainingMs > 0,
    lastPartialAt: lastAt,
    unlocksAt,
    remainingMs,
  };
}

export function formatRemaining(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m}m ${s}s`;
}

// ===== Hook headless =====
export function usePartialReleaseControls(params: {
    flow: FlowObj;
    cantidadPorLiberar: number | string;
    withCountdown?: boolean;
  
    // pasar los estados a validar (current, next, last, etc.)
    statusesToCheck?: Array<string | undefined | null>;
  
    // listas de bloqueos personalizables 
    blockedForCQM?: string[];
    blockedForCQM_AfterCorte?: string[];
  }) {
    const {
      flow,
      cantidadPorLiberar,
      withCountdown,
      statusesToCheck = [],
  
      blockedForCQM = ["Enviado a CQM", "En Calidad", "Listo", "Pendiente parcial"],
      blockedForCQM_AfterCorte = [
        "Enviado a CQM",
        "En Calidad",
        "Listo",
        "Pendiente",
        "Pendiente parcial",
        "Enviado a auditoria parcial",
        "En inconformidad CQM",
        "Enviado a Auditoria",
      ],
    } = params;
  
    const [nowTick, setNowTick] = useState(0);
  
    useEffect(() => {
      if (!withCountdown) return;
      const i = setInterval(() => setNowTick((t) => t + 1), 1000);
      return () => clearInterval(i);
    }, [withCountdown]);
  
    const cooldown = useMemo(() => getPartialCooldown(flow), [flow, nowTick]);
  
    // Normaliza y trimea todos los statuses a revisar (pueden venir nulos)
    const cleanedStatuses = (statusesToCheck ?? [])
      .map((s) => s?.toString().trim?.() ?? "")
      .filter(Boolean);
  
    const hasAny = (blockedList: string[]) => {
      const set = new Set(blockedList.map((s) => s.trim()));
      return cleanedStatuses.some((s) => set.has(s));
    };
  
    const byStatusCQM = hasAny(blockedForCQM);
    const byStatusAfterCorte = hasAny(blockedForCQM_AfterCorte);
  
    const byCantidad = Number(cantidadPorLiberar) === 0;
  
    // Cooldown bloquea CQM sólo si no hay areaResponse y hubo parcial <24h
    const byCooldown = !flow.areaResponse && cooldown.isLocked;
  
    const disableCQM = byStatusCQM || byCantidad || byCooldown;
    const disableAfterCorteCQM = byStatusAfterCorte || byCantidad || byCooldown;
  
    // Parcial: bloquea si cantidad=0 o estados finales
    const estadosFinales = ["Enviado a CQM", "En Calidad", "Completado"];
    const disablePartial =
      Number(cantidadPorLiberar) === 0 || estadosFinales.includes(flow.status?.trim?.() ?? "");
  
    return {
      cooldown,              // { isLocked, unlocksAt, remainingMs }
      disableCQM,            // CQM con lista base (incluye 'Pendiente parcial')
      disableAfterCorteCQM,  // CQM con lista extendida AfterCorte
      disablePartial,        // Liberación parcial
    };
  }