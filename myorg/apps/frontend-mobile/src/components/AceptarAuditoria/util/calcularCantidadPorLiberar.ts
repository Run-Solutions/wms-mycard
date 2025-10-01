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

/*export function calcularCantidadPorLiberar(
    currentFlow?: Flow | null,
    lastCompletedOrPartial?: LastCompletedOrPartial | null
  ): number {
    if (!currentFlow) {
      return 0;
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
  
    const totalLiberado =
      currentFlow.partialReleases?.reduce(
        (sum, release) => sum + (release.quantity ?? 0),
        0
      ) ?? 0;
  
    //console.log('Total liberado del current:', totalLiberado);
  
    const totalValidados = getAreaResponseQuantity();
    //console.log('Total validados (areaResponse):', totalValidados);
  
    let cantidadPorLiberar = 0;
  
    if (safeLast.area?.name === 'preprensa') {
      cantidadPorLiberar = (currentFlow.workOrder?.quantity ?? 0) - totalLiberado;
      //console.log('Preprensa: cantidad por liberar calculada.', cantidadPorLiberar);
    } else if (totalValidados > 0) {
      const resta = totalValidados - totalLiberado;
      cantidadPorLiberar = Math.max(resta, 0);
      //console.log('Cantidad por liberar (validados - liberados):', cantidadPorLiberar);
    } else if (
      !safeLast.partialReleases ||
      safeLast.partialReleases.length === 0
    ) {
      cantidadPorLiberar = getAreaResponseQuantity();
      //console.log('No hay parciales: usando cantidad entregada:', cantidadPorLiberar);
    } else {
      cantidadPorLiberar = 0;
      //console.log('Caso por defecto: cantidad por liberar = 0');
    }
  
    return cantidadPorLiberar;
  }*/

export function calcularCantidadPorLiberar(
  currentFlow?: Flow | null,
  lastCompletedOrPartial?: LastCompletedOrPartial | null
): number {
  if (!currentFlow) return 0;

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

  // 1) Si hay un parcial validado, usar su no procesado
  const lastPartial = currentFlow.partialReleases
    ?.slice() // copiamos para no mutar
    .reverse()
    .find((pr) => pr.validated);

  console.log('lastValidatedPartial', lastPartial);

  if (lastPartial && typeof lastPartial.noprocess_quantity === 'number') {
    return Math.max(lastPartial.noprocess_quantity ?? 0, 0);
  }

  // 2) Comportamiento previo (fallback)
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
  return cantidadPorLiberar;
}
