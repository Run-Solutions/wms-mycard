import API from './http';

export const fetchWorkOrdersInProgress = async () => {
  const estados = ['En auditoria'];
  const query = estados.map(estado => encodeURIComponent(estado)).join(',');

  const res = await API.get(`/free-work-order-auditory/in-auditory?statuses=${query}`);
  return res.data;
};