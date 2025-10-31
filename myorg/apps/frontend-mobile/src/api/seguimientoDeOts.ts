import API from './http';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UpdateFlowUserPayload = {
  userId: number;
  note?: string;
};

export const fetchWorkOrdersInProgress = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Token no encontrado');

  const response = await API.get(
    '/work-orders/in-progress?statuses=En%20proceso',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

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

export const fetchAllUsers = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Token no encontrado');

  console.log('Buscando usuarios:');

  const response = await API.get(`/work-orders/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('Respuesta del servidor:', response.data);
  return response.data;
};

export const updateFlowAssignedUser = async (
  flowId: number,
  userId: number,
  note?: string
) => {
  const token = AsyncStorage.getItem('token');
  if (!token) throw new Error('Token no encontrado');

  try {
    const { data } = await API.post(
      `/work-orders/${flowId}/assign`,
      { userId, note } as UpdateFlowUserPayload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data; // debería ser el flow actualizado que devuelve tu servicio
  } catch (err: any) {
    // Propaga un error legible
    const msg =
      err?.response?.data?.message ??
      err?.message ??
      'Error al actualizar encargado';
    throw new Error(msg);
  }
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

export const getFileByName = async (filename: string) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Token no encontrado');

  const response = await API.get(`free-order-flow/file/${filename}`, {
    headers: {
      Authorization: `Bearer ${token}`,
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

export const updateWorkOrderAreasLiberar = async (ot_id: string, payload: any) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Token no encontrado');
  console.log(payload, 'payload')

  const response = await API.patch(`/work-orders/${ot_id}/areas/liberar`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};

export const updateAreaResponseData = async (
  ot_id: string,
  payload: any
) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Token no encontrado');

  const response = await API.patch(
    `/work-orders/${ot_id}/areas/data`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};
