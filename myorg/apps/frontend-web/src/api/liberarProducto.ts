// myorg/apps/frontend-web/src/api/liberarProducto.ts
import API from './http';

export const fetchWorkOrdersInProgress = async () => {
  const estados = [
    'En proceso',
    'Enviado a CQM',
    'Listo',
    'En Calidad',
    'Parcial',
    'Enviado a Auditoria parcial',
  ];
  const query = estados.map((estado) => encodeURIComponent(estado)).join(',');

  const res = await API.get(`/free-order-flow/in-progress?statuses=${query}`);
  return res.data;
};

export const fetchWorkOrderById = async (id: string) => {
  const response = await API.get(`/free-order-flow/${id}`);
  return response.data;
};

interface PrepressPayload {
  workOrderId: number;
  workOrderFlowId: number;
  areaId: number;
  assignedUser: string | null;
  plates: number;
  positives: number;
  testType: string;
  comments: string;
}

export const submitPrepressForm = async (
  payload: PrepressPayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/prepress', payload);
  } catch (error: any) {
    console.error(
      'Error en submitPrepressForm:',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo liberar el producto desde Preprensa.');
  }
};

interface CQMImpressPayload {
  question_id: number[];
  work_order_flow_id: number;
  work_order_id: number;
  area_id: number;
  frente: boolean[];
  vuelta: boolean[];
  reviewed: boolean;
  user_id: number;
  sample_quantity: number;
}
interface CQMPayload {
  question_id: number[];
  work_order_flow_id: number;
  work_order_id: number;
  area_id: number;
  response: boolean[];
  reviewed: boolean;
  user_id: number;
  sample_quantity: number;
}

export const submitToCQMImpression = async (
  payload: CQMImpressPayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/cqm-impression', payload);
  } catch (error: any) {
    console.error(
      'Error en submitToCQMImpression:',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo enviar el formulario a CQM.');
  }
};
export const submitToCQMSerigrafia = async (
  payload: CQMPayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/cqm-serigrafia', payload);
  } catch (error: any) {
    console.error(
      'Error en submitToCQMSerigrafia:',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo enviar el formulario a CQM.');
  }
};
export const submitToCQMEmpalme = async (
  payload: CQMPayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/cqm-empalme', payload);
  } catch (error: any) {
    console.error(
      'Error en submitToCQMEmpalme:',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo enviar el formulario a CQM.');
  }
};
export const submitToCQMLaminacion = async (
  payload: CQMPayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/cqm-laminacion', payload);
  } catch (error: any) {
    console.error(
      'Error en submitToCQMLaminacion:',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo enviar el formulario a CQM.');
  }
};
export const submitToCQMCorte = async (payload: CQMPayload): Promise<void> => {
  try {
    await API.post('/free-order-flow/cqm-corte', payload);
  } catch (error: any) {
    console.error(
      'Error en submitToCQMCorte:',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo enviar el formulario a CQM.');
  }
};
export const submitToCQMColorEdge = async (
  payload: CQMPayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/cqm-color-edge', payload);
  } catch (error: any) {
    console.error(
      'Error en submitToCQMColorEdge:',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo enviar el formulario a CQM.');
  }
};
export const submitToCQMHotStamping = async (
  payload: CQMPayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/cqm-hot-stamping', payload);
  } catch (error: any) {
    console.error(
      'Error en submitToCQMHotStamping:',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo enviar el formulario a CQM.');
  }
};
export const submitToCQMMillingChip = async (
  payload: CQMPayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/cqm-milling-chip', payload);
  } catch (error: any) {
    console.error(
      'Error en submitToCQMHotStamping:',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo enviar el formulario a CQM.');
  }
};
export const submitToCQMPersonalizacion = async (
  payload: CQMPayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/cqm-personalizacion', payload);
  } catch (error: any) {
    console.error(
      'Error en submitToCQMPersonalizacion:',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo enviar el formulario a CQM.');
  }
};

interface ReleasePayload {
  workOrderId: number;
  workOrderFlowId: number;
  areaId: number;
  assignedUser: number;
  releaseQuantity: number;
  comments: string;
  formAnswerId?: number;
}
interface ReleasePayloadForAuditory {
  workOrderId: number;
  workOrderFlowId: number;
  areaId: number;
  assignedUser: number;
  goodQuantity: number;
  badQuantity: number;
  materialBadQuantity: number;
  excessQuantity: number;
  comments: string;
  formAnswerId?: number;
}

export const releaseProductFromImpress = async (
  payload: ReleasePayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/impress', payload);
  } catch (error: any) {
    console.error(
      'Error en releaseProductFromImpress:',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo liberar el producto desde Impresión.');
  }
};
export const releaseProductFromSerigrafia = async (
  payload: ReleasePayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/serigrafia', payload);
  } catch (error: any) {
    console.error(
      'Error en releaseProductFromSerigrafia',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo liberar el producto desde Serigrafia.');
  }
};
export const releaseProductFromEmpalme = async (
  payload: ReleasePayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/empalme', payload);
  } catch (error: any) {
    console.error(
      'Error en releaseProductFromEmpalme',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo liberar el producto desde Empalme.');
  }
};
export const releaseProductFromLaminacion = async (
  payload: ReleasePayload
): Promise<void> => {
  try {
    await API.post('/free-order-flow/laminacion', payload);
  } catch (error: any) {
    console.error(
      'Error en releaseProductFromLaminacion',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo liberar el producto desde Laminacion.');
  }
};
export const releaseProductFromCorte = async (
  payload: ReleasePayloadForAuditory
): Promise<void> => {
  try {
    await API.post('/free-order-flow/corte', payload);
  } catch (error: any) {
    console.error(
      'Error en releaseProductFromCorte',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo liberar el producto desde Corte.');
  }
};
export const releaseProductFromColorEdge = async (
  payload: ReleasePayloadForAuditory
): Promise<void> => {
  try {
    await API.post('/free-order-flow/color-edge', payload);
  } catch (error: any) {
    console.error(
      'Error en releaseProductFromColorEdge',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo liberar el producto desde Color Edge.');
  }
};
export const releaseProductFromHotStamping = async (
  payload: ReleasePayloadForAuditory
): Promise<void> => {
  try {
    await API.post('/free-order-flow/hot-stamping', payload);
  } catch (error: any) {
    console.error(
      'Error en releaseProductFromLaminacion',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo liberar el producto desde Hot Stamping.');
  }
};
export const releaseProductFromMillingChip = async (
  payload: ReleasePayloadForAuditory
): Promise<void> => {
  try {
    await API.post('/free-order-flow/milling-chip', payload);
  } catch (error: any) {
    console.error(
      'Error en releaseProductFromMillingChip',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo liberar el producto desde Milling Chip.');
  }
};
export const releaseProductFromPersonalizacion = async (
  payload: ReleasePayloadForAuditory
): Promise<void> => {
  try {
    await API.post('/free-order-flow/personalizacion', payload);
  } catch (error: any) {
    console.error(
      'Error en releaseProductFromPersonalizacion',
      error?.response?.data || error.message
    );
    throw new Error('No se pudo liberar el producto desde Personalizacion.');
  }
};
