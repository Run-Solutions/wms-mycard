import API from './http';

export const fetchWorkOrdersInProgress = async () => {
  const estados = ['En auditoria'];
  const query = estados.map(estado => encodeURIComponent(estado)).join(',');

  const res = await API.get(`/free-work-order-auditory/in-auditory?statuses=${query}`);
  return res.data;
};

export const fetchWorkOrderById = async (id: string) => {
  const response = await API.get(`/free-work-order-auditory/${id}`);
  return response.data;
};

export const liberarWorkOrderAuditory = async (payload: {
  workOrderFlowId: number;
  workOrderId: number;
}) => {
  const res = await API.patch('/free-work-order-auditory/cerrar-auditoria', payload);
  return res.data;
};