// myorg/apps/frontend-mobile/src/api/inconformidades.ts
import API from './http';

// GET /work-order-flow/inconformidad?statuses=
export const getWorkOrdersWithInconformidad = async () => {
    const estados = ['En inconformidad', 'En inconformidad CQM'];
    const query = estados.map(estado => encodeURIComponent(estado)).join(',');
    const response = await API.get(`/work-order-flow/inconformidad?statuses=${query}`);
    return response.data;
};

export const getWorkOrderInconformidadById = async (id: string) => {
  try {
    const response = await API.get(`/work-orders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener la OT por inconformidad:', error);
    throw error;
  }
};

export const acceptPrepressInconformity = async (areaResponseId: number): Promise<void> => {
  try {
    await API.patch(`/inconformities/${areaResponseId}/prepress`);
  } catch (error: any) {
    console.error('Error en acceptPrepressInconformity:', error?.response?.data || error.message);
    throw new Error('No se pudo aceptar la inconformidad de preprensa.');
  }
};

export const acceptCQMInconformity = async (areaResponseId: number): Promise<void> => {
  try {
    await API.patch(`/inconformities/${areaResponseId}/cqm`);
  } catch (error: any) {
    console.error('Error en acceptCQMInconformity:', error?.response?.data || error.message);
    throw new Error('No se pudo aceptar la inconformidad desde CQM.');
  }
};

export const acceptImpressionInconformity = async (areaResponseFlowId: number): Promise<void> => {
  try {
    await API.patch(`/inconformities/${areaResponseFlowId}/impresion`);
  } catch (error: any) {
    console.error('Error en acceptImpressionInconformity:', error?.response?.data || error.message);
    throw new Error('No se pudo aceptar la inconformidad de impresion.');
  }
};