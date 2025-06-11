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
export const acceptSerigrafiaInconformity = async (areaResponseFlowId: number): Promise<void> => {
  try {
    await API.patch(`/inconformities/${areaResponseFlowId}/serigrafia`);
  } catch (error: any) {
    console.error('Error en acceptSerigrafiaInconformity:', error?.response?.data || error.message);
    throw new Error('No se pudo aceptar la inconformidad de serigrafia.');
  }
};
export const acceptEmpalmeInconformity = async (areaResponseFlowId: number): Promise<void> => {
  try {
    await API.patch(`/inconformities/${areaResponseFlowId}/empalme`);
  } catch (error: any) {
    console.error('Error en acceptSerigrafiaInconformity:', error?.response?.data || error.message);
    throw new Error('No se pudo aceptar la inconformidad de empalme.');
  }
};
export const acceptLaminacionInconformity = async (areaResponseFlowId: number): Promise<void> => {
  try {
    await API.patch(`/inconformities/${areaResponseFlowId}/laminacion`);
  } catch (error: any) {
    console.error('Error en acceptLaminacionInconformity:', error?.response?.data || error.message);
    throw new Error('No se pudo aceptar la inconformidad de laminacion.');
  }
};
export const acceptCorteInconformity = async (areaResponseFlowId: number): Promise<void> => {
  try {
    await API.patch(`/inconformities/${areaResponseFlowId}/corte`);
  } catch (error: any) {
    console.error('Error en acceptCorteInconformity:', error?.response?.data || error.message);
    throw new Error('No se pudo aceptar la inconformidad de corte.');
  }
};
export const acceptColorEdgeInconformity = async (areaResponseFlowId: number): Promise<void> => {
  try {
    await API.patch(`/inconformities/${areaResponseFlowId}/color-edge`);
  } catch (error: any) {
    console.error('Error en acceptColorEdgeInconformity:', error?.response?.data || error.message);
    throw new Error('No se pudo aceptar la inconformidad de color edge.');
  }
};
export const acceptHotStampingInconformity = async (areaResponseFlowId: number): Promise<void> => {
  try {
    await API.patch(`/inconformities/${areaResponseFlowId}/hot-stamping`);
  } catch (error: any) {
    console.error('Error en acceptHotStampingInconformity:', error?.response?.data || error.message);
    throw new Error('No se pudo aceptar la inconformidad de hot stamping.');
  }
};
export const acceptMillingChipInconformity = async (areaResponseFlowId: number): Promise<void> => {
  try {
    await API.patch(`/inconformities/${areaResponseFlowId}/milling-chip`);
  } catch (error: any) {
    console.error('Error en acceptMillingChipInconformity:', error?.response?.data || error.message);
    throw new Error('No se pudo aceptar la inconformidad de hot stamping.');
  }
};
export const acceptPersonalizacionInconformity = async (areaResponseFlowId: number): Promise<void> => {
  try {
    await API.patch(`/inconformities/${areaResponseFlowId}/personalizacion`);
  } catch (error: any) {
    console.error('Error en acceptPersonalizacionInconformity:', error?.response?.data || error.message);
    throw new Error('No se pudo aceptar la inconformidad de hot stamping.');
  }
};