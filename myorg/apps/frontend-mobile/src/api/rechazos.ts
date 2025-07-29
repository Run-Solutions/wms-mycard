// myorg/apps/frontend-mobile/src/api/rechazos.ts
import API from './http';

// GET /work-order-flow/inconformidad?statuses=
export const getWorkOrdersWithInconformidadAuditory = async () => {
    const estados = ['En inconformidad auditoria'];
    const query = estados.map((estado) => encodeURIComponent(estado)).join(',');
    const response = await API.get(
      `/work-order-flow/inconformidad?statuses=${query}`
    );
    return response.data;
  };
  export const acceptCorteInconformityAuditory = async (areaResponseFlowId: number): Promise<void> => {
    try {
      await API.patch(`/inconformities/${areaResponseFlowId}/corte-auditory`);
    } catch (error: any) {
      console.error('Error en acceptCorteInconformityAuditory:', error?.response?.data || error.message);
      throw new Error('No se pudo aceptar la inconformidad de corte.');
    }
  };
  export const acceptColorEdgeInconformityAuditory = async (areaResponseFlowId: number): Promise<void> => {
    try {
      await API.patch(`/inconformities/${areaResponseFlowId}/color-edge-auditory`);
    } catch (error: any) {
      console.error('Error en acceptColorEdgeInconformityAuditory:', error?.response?.data || error.message);
      throw new Error('No se pudo aceptar la inconformidad de corte.');
    }
  };
  export const acceptHotStampingInconformityAuditory = async (areaResponseFlowId: number): Promise<void> => {
    try {
      await API.patch(`/inconformities/${areaResponseFlowId}/hot-stamping-auditory`);
    } catch (error: any) {
      console.error('Error en acceptHotStampingInconformityAuditory:', error?.response?.data || error.message);
      throw new Error('No se pudo aceptar la inconformidad de corte.');
    }
  };
  export const acceptMillingChipInconformityAuditory = async (areaResponseFlowId: number): Promise<void> => {
    try {
      await API.patch(`/inconformities/${areaResponseFlowId}/milling-chip-auditory`);
    } catch (error: any) {
      console.error('Error en acceptMillingChipInconformityAuditory:', error?.response?.data || error.message);
      throw new Error('No se pudo aceptar la inconformidad de corte.');
    }
  };
  export const acceptPersonalizacionInconformityAuditory = async (areaResponseFlowId: number): Promise<void> => {
    try {
      await API.patch(`/inconformities/${areaResponseFlowId}/personalizacion-auditory`);
    } catch (error: any) {
      console.error('Error en acceptPersonalizacionInconformityAuditory:', error?.response?.data || error.message);
      throw new Error('No se pudo aceptar la inconformidad de corte.');
    }
  };
  