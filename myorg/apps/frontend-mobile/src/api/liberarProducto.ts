// myorg/apps/frontend-mobile/src/api/liberarProducto.ts
import API from './http';

export const fetchWorkOrdersInProgress = async () => {
  const estados = ['En proceso', 'Enviado a CQM', 'Listo', 'En Calidad', 'Parcial', 'Enviado a Auditoria parcial'];
  const query = estados.map(estado => encodeURIComponent(estado)).join(',');

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

export const submitPrepressForm = async (payload: PrepressPayload): Promise<void> => {
  try {
    await API.post('/free-order-flow/prepress', payload);
  } catch (error: any) {
    console.error('Error en submitPrepressForm:', error?.response?.data || error.message);
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

export const submitToCQMImpression = async (payload: CQMImpressPayload): Promise<void> => {
  try {
    await API.post('/free-order-flow/cqm-impression', payload);
  } catch (error: any) {
    console.error('Error en submitToCQMImpression:', error?.response?.data || error.message);
    throw new Error('No se pudo enviar el formulario a CQM.');
  }
};
export const submitToCQMSerigrafia = async (payload: CQMPayload): Promise<void> => {
  try {
    await API.post('/free-order-flow/cqm-serigrafia', payload);
  } catch (error: any) {
    console.error('Error en submitToCQMSerigrafia:', error?.response?.data || error.message);
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

export const releaseProductFromImpress = async (payload: ReleasePayload): Promise<void> => {
  try {
    await API.post('/free-order-flow/impress', payload);
  } catch (error: any) {
    console.error('Error en releaseProductFromImpress:', error?.response?.data || error.message);
    throw new Error('No se pudo liberar el producto desde Impresión.');
  }
};
export const releaseProductFromSerigrafia = async (payload: ReleasePayload): Promise<void> => {
  try {
    await API.post('/free-order-flow/serigrafia', payload);
  } catch (error: any) {
    console.error('Error en releaseProductFromSerigrafia', error?.response?.data || error.message);
    throw new Error('No se pudo liberar el producto desde Impresión.');
  }
};