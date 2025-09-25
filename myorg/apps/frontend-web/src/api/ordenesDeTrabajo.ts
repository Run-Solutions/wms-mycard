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
  files: { ot: File; sku: File; op: File; attachments?: File[]; cardImage?: File }
) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Token no disponible');

  const fd = new FormData();
  fd.append('ot', files.ot);
  fd.append('sku', files.sku);
  fd.append('op', files.op);

  // ✅ Sólo si existe
  if (files.cardImage) fd.append('cardImage', files.cardImage);

  (files.attachments || []).forEach((f) => fd.append('attachments', f));

  (formData.areasOperatorIds || []).forEach((area: string | number) =>
    fd.append('areasOperatorIds', String(area))
  );

  fd.append('ot_id', String(formData.ot_id));
  fd.append('mycard_id', String(formData.mycard_id));
  fd.append('quantity', String(formData.quantity));
  fd.append('comments', String(formData.comments));
  fd.append('priority', String(!!formData.priority));
  fd.append('total_sheets', String(formData.total_sheets));
  fd.append('quantity_contacts', String(formData.quantity_contacts));
  fd.append('isCollator', String(formData.tipoSeleccion)); // '0' | '1'

  const response = await API.post('/work-orders', fd, {
    headers: { Authorization: `Bearer ${token}` }, // ❌ sin Content-Type
  });

  return response.data;
};
