import API from './http';

// Obtener áreas operativas
export const getAreasOperator = async () => {
  const response = await API.get('/auth/areas_operator');
  const transformed = response.data
    .map((item: any) => ({
      label: item.name,
      value: String(item.id),
      sheets: item.sheets
    }))
    .sort(
      (a: { value: string }, b: { value: string }) =>
        Number(a.value) - Number(b.value)
    );
  return transformed;
};

// Crear orden de trabajo
export const createWorkOrder = async (
  formData: any,
  files: { ot: File; sku: File; op: File; attachments?: File[] }
) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Token no disponible');

  const formDataToSend = new FormData();
  formDataToSend.append('ot', files.ot);
  formDataToSend.append('sku', files.sku);
  formDataToSend.append('op', files.op);

  (files.attachments || []).forEach((f) => {
    formDataToSend.append('attachments', f);
  });

  formData.areasOperatorIds.forEach((area: string) =>
    formDataToSend.append('areasOperatorIds', area)
  );
  formDataToSend.append('ot_id', formData.ot_id);
  formDataToSend.append('mycard_id', formData.mycard_id);
  formDataToSend.append('quantity', formData.quantity);
  formDataToSend.append('comments', formData.comments);
  formDataToSend.append('priority', String(formData.priority));
  formDataToSend.append('total_sheets', formData.total_sheets);
  formDataToSend.append('quantity_contacts', formData.quantity_contacts);

  const response = await API.post('/work-orders', formDataToSend, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
