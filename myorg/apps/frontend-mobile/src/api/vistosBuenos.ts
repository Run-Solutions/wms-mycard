// myorg/apps/frontend-mobile/src/api/vistosBuenos.ts
import API from './http';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchPendingOrders = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const res = await API.get('/work-order-cqm/pending', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = res.data;

    if (Array.isArray(data)) {
      return data.sort((a, b) => {
        if (a.workOrder.priority && !b.workOrder.priority) return -1;
        if (!a.workOrder.priority && b.workOrder.priority) return 1;
        return new Date(a.workOrder.createdAt).getTime() - new Date(b.workOrder.createdAt).getTime();
      });
    } else {
      return [];
    }
  } catch (err) {
    console.error('Error al obtener órdenes pendientes:', err);
    throw new Error('No se pudieron obtener las órdenes');
  }
};

export const acceptWorkOrder = async (selectedOrder: any) => {
  if (!selectedOrder) throw new Error('No hay orden seleccionada');

  // ✅ Igual que en web: inicializa index en 0
  let index: number = 0;

  if (selectedOrder.answers?.length) {
    for (let i = selectedOrder.answers.length - 1; i >= 0; i--) {
      if (selectedOrder.answers[i].accepted === false) {
        index = i;
        break;
      }
    }
  }

  const flowId = selectedOrder.answers?.[index]?.id;

  if (!flowId) {
    throw new Error('No se encontró un ID válido para FormAnswer');
  }

  try {
    const token = await AsyncStorage.getItem('token');

    await API.patch(`/work-order-cqm/${flowId}/accept`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Todo OK
    return;
  } catch (err: any) {
    console.error('Error al aceptar OT:', err);
    const message = err?.response?.data?.message || 'No se pudo aceptar la OT';
    throw new Error(message);
  }
};