// myorg/apps/frontend-mobile/src/api/recepcionCQM.ts
import API from './http';

export interface WorkOrder {
  id: number;
  ot_id: string;
  mycard_id: string;
  quantity: number;
  status: string;
  validated: boolean;
  createdAt: string;
  user: any;
  flow: {
    area_id: number;
    status: string;
    area: { name: string };
  }[];
}

export const getOrdersInCalidad = async (): Promise<WorkOrder[]> => {
  const query = encodeURIComponent('En calidad');

  try {
    const res = await API.get(`/free-order-cqm/in-progress?statuses=${query}`);
    const data = res.data;

    if (!Array.isArray(data)) {
      console.warn('La API no devolvió un array válido:', data);
      return [];
    }

    return data.map((item: any): WorkOrder => ({
      id: item.id,
      ot_id: item.workOrder.ot_id,
      mycard_id: item.workOrder.mycard_id,
      quantity: item.workOrder.quantity,
      status: item.status,
      validated: item.workOrder.validated,
      createdAt: item.workOrder.createdAt,
      user: item.workOrder.user,
      flow: item.workOrder.flow.map((f: any) => ({
        area_id: f.area?.id,
        status: f.status,
        area: { name: f.area?.name },
      })),
    }));
  } catch (error: any) {
    console.error('Error en getOrdersInCalidad:', error?.message || error);
    return [];
  }
};

export const getWorkOrderById = async (id: string): Promise<WorkOrder | null> => {
    try {
      const res = await API.get(`/free-order-cqm/${id}`);
      const data = res.data;
      console.log('Orden:', data);
      return data;
    } catch (error: any) {
      console.error('Error al obtener la orden por ID:', error?.message || error);
      return null;
    }
};

export interface ImpresionPayload {
    form_answer_id: number;
    frente: { question_id: number }[];
    vuelta: { question_id: number }[];
    radio: {
      value: string; // o el tipo que uses para testTypes
    };
}
  
export const submitExtraImpresion = async (payload: ImpresionPayload): Promise<boolean> => {
    try {
      const res = await API.post('/free-order-cqm/form-extra-impresion', payload);
      return res.status === 200;
    } catch (error: any) {
      console.error('Error en submitExtraImpresion:', error?.response?.data || error.message);
      throw new Error('Error al liberar el producto.');
    }
};

export const sendInconformidadCQM = async (workOrderId: number, inconformidad: string): Promise<void> => {
    try {
      await API.patch(`/work-order-flow/${workOrderId}/inconformidad-cqm`, { inconformidad });
    } catch (error: any) {
      console.error('Error en sendInconformidadCQM:', error?.response?.data || error.message);
      throw new Error('No se pudo enviar la inconformidad');
    }
  };