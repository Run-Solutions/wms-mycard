// Types (ajusta según tu modelo)
interface PartialRelease {
  validated: boolean;
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
  workOrder: { quantity: number };
}

interface Area {
  name?: string;
}

interface LastCompletedOrPartial {
  area?: Area;
  partialReleases?: PartialRelease[];
  areaResponse?: AreaResponse;
}

export function calcularCantidadPorLiberar(
  currentFlow: Flow,
  lastCompletedOrPartial: LastCompletedOrPartial
): number {
  const sumValidatedQuantities = (releases?: PartialRelease[]): number =>
    releases?.filter((r) => r.validated).reduce((sum, r) => sum + (r.quantity ?? 0), 0) ?? 0;

  const getAreaResponseQuantity = (): number =>
    lastCompletedOrPartial.areaResponse?.prepress?.plates ??
    lastCompletedOrPartial.areaResponse?.impression?.release_quantity ??
    lastCompletedOrPartial.areaResponse?.serigrafia?.release_quantity ??
    lastCompletedOrPartial.areaResponse?.empalme?.release_quantity ??
    lastCompletedOrPartial.areaResponse?.laminacion?.release_quantity ??
    lastCompletedOrPartial.areaResponse?.corte?.good_quantity ??
    lastCompletedOrPartial.areaResponse?.colorEdge?.good_quantity ??
    lastCompletedOrPartial.areaResponse?.hotStamping?.good_quantity ??
    lastCompletedOrPartial.areaResponse?.millingChip?.good_quantity ??
    lastCompletedOrPartial.areaResponse?.personalizacion?.good_quantity ??
    currentFlow.workOrder.quantity ??
    0;

  const totalLiberado =
    currentFlow.partialReleases?.reduce(
      (sum, release) => sum + (release.quantity ?? 0),
      0
    ) ?? 0;

  console.log('Total liberado del current:', totalLiberado);

  // Aquí la diferencia clave:
  const totalValidados = getAreaResponseQuantity();
  console.log('Total validados (areaResponse):', totalValidados);

  let cantidadPorLiberar = 0;

  if (lastCompletedOrPartial.area?.name === 'preprensa') {
    cantidadPorLiberar = currentFlow.workOrder.quantity - totalLiberado;
    console.log('Preprensa: cantidad por liberar calculada.', cantidadPorLiberar);
  } else if (totalValidados > 0) {
    const resta = totalValidados - totalLiberado;
    cantidadPorLiberar = Math.max(resta, 0);
    console.log('Cantidad por liberar (validados - liberados):', cantidadPorLiberar);
  } else if (
    !lastCompletedOrPartial.partialReleases ||
    lastCompletedOrPartial.partialReleases.length === 0
  ) {
    cantidadPorLiberar = getAreaResponseQuantity();
    console.log('No hay parciales: usando cantidad entregada:', cantidadPorLiberar);
  } else {
    cantidadPorLiberar = 0;
    console.log('Caso por defecto: cantidad por liberar = 0');
  }

  return cantidadPorLiberar;
}