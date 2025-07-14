import API from "./http";

import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchWorkOrdersInProgress = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Token no encontrado');

  const response = await API.get('/work-orders/in-progress?statuses=En%20proceso', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const fetchWorkOrderById = async (id: number | string) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Token no encontrado');

  console.log('Buscando OT con ID:', id);

  const response = await API.get(`/work-orders/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('Respuesta del servidor:', response.data);
  return response.data;
};

export const closeWorkOrder = async (ot_id: string) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Token no encontrado');

  const payload = { ot_id };

  const response = await API.patch('/work-orders/cerrar-work-order', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};

export const updateWorkOrderAreas = async (ot_id: string, payload: any) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Token no encontrado');

  const response = await API.patch(`/work-orders/${ot_id}/areas`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};
