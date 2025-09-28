import API from './http';

export const subirArchivoOrden = async (
  orderId: number,              
  fileOrFiles: File | File[],  
  type?: string                
) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Token no encontrado');

  const formData = new FormData();
  if (type) formData.append('type', type);

  (Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles]).forEach((f) =>
    formData.append('files', f)
  );

  const { data } = await API.post(`/work-order-file/${orderId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
};