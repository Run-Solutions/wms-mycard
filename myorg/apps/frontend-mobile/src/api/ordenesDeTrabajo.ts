import API from './http';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Obtener áreas operativas
export const getAreasOperator = async () => {
    const response = await API.get('/auth/areas_operator');
    const transformed = response.data
      .map((item: any) => ({
        label: item.name,
        value: String(item.id),
      }))
      .sort((a: { value: string }, b: { value: string }) => Number(a.value) - Number(b.value));
  
    return transformed;
  };
  
  // Crear orden de trabajo
  export const createWorkOrder = async (
    formData: any,
    files: { ot: any; sku: any; op: any }
  ) => {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Token no disponible');
  
    const formDataToSend = new FormData();
    formDataToSend.append('ot', {
      uri: files.ot.uri,
      type: 'application/pdf',
      name: files.ot.name,
    } as any);
    formDataToSend.append('sku', {
      uri: files.sku.uri,
      type: 'application/pdf',
      name: files.sku.name,
    } as any);
    formDataToSend.append('op', {
      uri: files.op.uri,
      type: 'application/pdf',
      name: files.op.name,
    } as any);
  
    formData.areasOperatorIds.forEach((area: string) =>
      formDataToSend.append('areasOperatorIds', area)
    );
  
    formDataToSend.append('ot_id', formData.ot_id);
    formDataToSend.append('mycard_id', formData.mycard_id);
    formDataToSend.append('quantity', formData.quantity);
    formDataToSend.append('comments', formData.comments);
    formDataToSend.append('priority', String(formData.priority));
  
    const response = await API.post('/work-orders', formDataToSend, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
  
    return response.data;
  };