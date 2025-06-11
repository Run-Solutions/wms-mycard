// myorg/apps/frontend-mobile/src/api/aceptarAuditoria.ts

import API from './http';

export const getPendingOrders = async () => {
  const response = await API.get('/work-order-flow-auditory/pending-auditory');
  return response.data;
};
export const getWorkOrderByFlowId = async (flowId: string) => {
  const response = await API.get(`/work-order-flow/${flowId}`);
  return response.data;
};
export const acceptWorkOrderFlowAuditory = async (
  corteResponseId: string | number,
  sampleAuditory: string
) => {
  const response = await API.post(`/work-order-flow-auditory/${corteResponseId}`, {
    sample_auditory: Number(sampleAuditory),
  });
  return response.data;
};
export const acceptWorkOrderFlowColorEdgeAuditory = async (
  colorEdgeResponseId: string | number,
  sampleAuditory: string
) => {
  const response = await API.post(`/work-order-flow-auditory/color-edge/${colorEdgeResponseId}`, {
    sample_auditory: Number(sampleAuditory),
  });
  return response.data;
};
export const acceptWorkOrderFlowHotStampingAuditory = async (
  hotStampingResponseId: string | number,
  sampleAuditory: string
) => {
  const response = await API.post(`/work-order-flow-auditory/hot-stamping/${hotStampingResponseId}`, {
    sample_auditory: Number(sampleAuditory),
  });
  return response.data;
};
export const acceptWorkOrderFlowMillingChipAuditory = async (
  millingChipResponseResponseId: string | number,
  sampleAuditory: string
) => {
  const response = await API.post(`/work-order-flow-auditory/milling-chip/${millingChipResponseResponseId}`, {
    sample_auditory: Number(sampleAuditory),
  });
  return response.data;
};
export const acceptWorkOrderFlowPersonalizacionAuditory = async (
  personalizacionResponseResponseId: string | number,
  sampleAuditory: string
) => {
  const response = await API.post(`/work-order-flow-auditory/personalizacion/${personalizacionResponseResponseId}`, {
    sample_auditory: Number(sampleAuditory),
  });
  return response.data;
};

export const registrarInconformidadAuditory = async (flowId: string | number, inconformidad: string) => {
  const response = await API.patch(`/work-order-flow/${flowId}/inconformidad`, {
    inconformidad,
  });
  return response.data;
};