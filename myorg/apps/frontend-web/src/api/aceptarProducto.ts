// myorg/apps/frontend-web/src/api/aceptarProducto.ts

import API from './http';

// GET /work-order-flow/pending
export const getPendingOrders = async () => {
  const response = await API.get('/work-order-flow/pending');
  return response.data;
};

// GET /work-order-flow/:flowId
export const getWorkOrderByFlowId = async (flowId: string) => {
  const response = await API.get(`/work-order-flow/${flowId}`);
  return response.data;
};

// PATCH /work-order-flow/:flowId/accept
export const acceptWorkOrderFlow = async (flowId: number) => {
    const response = await API.patch(`/work-order-flow/${flowId}/accept`);
    return response.data;
  };

// PATCH /work-order-flow/:flowId/inconformidad
export const registrarInconformidad = async (flowId: string | number, inconformidad: string) => {
  const response = await API.patch(`/work-order-flow/${flowId}/inconformidad`, {
    inconformidad,
  });
  return response.data;
};
export const registrarInconformidadAuditory = async (AuditoryId: string | number, inconformidad: string) => {
  const response = await API.patch(`/work-order-flow/${AuditoryId}/inconformidad-auditoria`, {
    inconformidad,
  });
  return response.data;
};