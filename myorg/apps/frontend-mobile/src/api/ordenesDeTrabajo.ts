import API from './http';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FileLike =
  | File // Web
  | {
      uri: string; // RN
      name: string;
      type: string;
    };

export const getAreasOperator = async () => {
  const response = await API.get('/auth/areas_operator');
  const transformed = response.data
    .map((item: any) => ({
      label: item.name,
      value: String(item.id),
      sheets: item.sheets,
    }))
    .sort(
      (a: { value: string }, b: { value: string }) =>
        Number(a.value) - Number(b.value)
    );
  return transformed;
};

// ✅ Firma acepta FileLike en lugar de File
export const createWorkOrder = async (
  formData: any,
  files: { ot: FileLike; sku: FileLike; op: FileLike; attachments?: FileLike[], cardImage?: FileLike }
) => {
  console.log('🔹 [createWorkOrder] Iniciando...');
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Token no disponible');
  
  console.log('🔹 [createWorkOrder] Token encontrado:', token.substring(0, 20) + '...');

  const formDataToSend = new FormData();

  // Helper para RN vs Web
  const appendFile = (key: string, f: FileLike) => {
    const maybeRN = f as any;
    if (maybeRN && typeof maybeRN.uri === 'string') {
      // React Native - formato correcto
      formDataToSend.append(key, {
        uri: maybeRN.uri,
        name: maybeRN.name || 'file',
        type: maybeRN.type || 'application/octet-stream',
      } as any);
    } else {
      // Web (File/Blob con name)
      formDataToSend.append(key, f as any);
    }
  };

  appendFile('ot', files.ot);
  appendFile('sku', files.sku);
  appendFile('op', files.op);
  if (files.cardImage) appendFile('cardImage', files.cardImage);

  (files.attachments || []).forEach((f) => appendFile('attachments', f));

  formData.areasOperatorIds.forEach((area: string) =>
    formDataToSend.append('areasOperatorIds', area)
  );
  formDataToSend.append('ot_id', formData.ot_id);
  formDataToSend.append('mycard_id', formData.mycard_id);
  formDataToSend.append('quantity', formData.quantity);
  formDataToSend.append('comments', formData.comments ?? '');
  formDataToSend.append('priority', String(formData.priority));
  formDataToSend.append('total_sheets', formData.total_sheets);
  formDataToSend.append('quantity_contacts', formData.quantity_contacts);
  formDataToSend.append('isCollator', formData.tipoSeleccion );
  
  console.log('🔹 [createWorkOrder] Enviando request a:', 'http://10.0.2.2:3003/work-orders');
  console.log('🔹 [createWorkOrder] FormData preparado, enviando...');
  
  try {
    const response = await API.post('/work-orders', formDataToSend, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('✅ [createWorkOrder] Response exitosa:', response.status);
    return response.data;
  } catch (error: any) {
    console.log('❌ [createWorkOrder] Error detallado:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      }
    });
    throw error;
  }
};