// Types (ajusta según tu modelo)
interface PartialRelease {
  validated: boolean;
  noprocess_quantity: number;
  quantity: number;
}

interface AreaResponse {
  prepress?: { plates?: number };
  impression?: { release_quantity?: number };
  serigrafia?: { release_quantity?: number };
  empalme?: { release_quantity?: number };
  laminacion?: { release_quantity?: number };
  corte?: { good_quantity?: number };
  colorEdge?: { good_quantity?: number };
  hotStamping?: { good_quantity?: number };
  millingChip?: { good_quantity?: number };
  personalizacion?: { good_quantity?: number };
}

interface Flow {
  partialReleases?: PartialRelease[];
  workOrder?: { quantity?: number | null } | null;
}

interface Area {
  name?: string;
}

interface LastCompletedOrPartial {
  area?: Area;
  partialReleases?: PartialRelease[];
  areaResponse?: AreaResponse;
}

export type CalculoLiberacion = {
  cantidadPorLiberar: number;
  lastValidatedPartial: PartialRelease | null;
};

export function calcularCantidadPorLiberarYParcial(
  currentFlow?: Flow | null,
  lastCompletedOrPartial?: LastCompletedOrPartial | null
): CalculoLiberacion {
  if (!currentFlow) {
    return { cantidadPorLiberar: 0, lastValidatedPartial: null };
  }

  const safeLast = lastCompletedOrPartial ?? {};

  const getAreaResponseQuantity = (): number =>
    safeLast.areaResponse?.prepress?.plates ??
    safeLast.areaResponse?.impression?.release_quantity ??
    safeLast.areaResponse?.serigrafia?.release_quantity ??
    safeLast.areaResponse?.empalme?.release_quantity ??
    safeLast.areaResponse?.laminacion?.release_quantity ??
    safeLast.areaResponse?.corte?.good_quantity ??
    safeLast.areaResponse?.colorEdge?.good_quantity ??
    safeLast.areaResponse?.hotStamping?.good_quantity ??
    safeLast.areaResponse?.millingChip?.good_quantity ??
    safeLast.areaResponse?.personalizacion?.good_quantity ??
    currentFlow.workOrder?.quantity ??
    0;

  // 1) Buscar el último parcial VALIDADO dentro del flujo actual
  const lastValidatedPartial =
    currentFlow.partialReleases
      ?.slice()
      .reverse()
      .find((pr) => pr.validated) ?? null;

  // Si existe, la cantidad por liberar es su noprocess_quantity
  if (lastValidatedPartial && typeof lastValidatedPartial.noprocess_quantity === 'number') {
    return {
      cantidadPorLiberar: Math.max(lastValidatedPartial.noprocess_quantity ?? 0, 0),
      lastValidatedPartial,
    };
  }

  // 2) Fallback: misma lógica que ya tenías
  const totalLiberado =
    currentFlow.partialReleases?.reduce(
      (sum, release) => sum + (release.quantity ?? 0),
      0
    ) ?? 0;

  const totalValidados = getAreaResponseQuantity();

  let cantidadPorLiberar = 0;

  if (safeLast.area?.name === 'preprensa') {
    cantidadPorLiberar = (currentFlow.workOrder?.quantity ?? 0) - totalLiberado;
  } else if (totalValidados > 0) {
    const resta = totalValidados - totalLiberado;
    cantidadPorLiberar = Math.max(resta, 0);
  } else if (
    !safeLast.partialReleases ||
    safeLast.partialReleases.length === 0
  ) {
    cantidadPorLiberar = getAreaResponseQuantity();
  } else {
    cantidadPorLiberar = 0;
  }

  return { cantidadPorLiberar, lastValidatedPartial };
}
