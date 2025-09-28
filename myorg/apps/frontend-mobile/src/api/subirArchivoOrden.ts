// myorg/apps/frontend-mobile/src/api/subirArchivoOrden.ts
export type RNUploadFile = { uri: string; name?: string; type?: string };
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./http";

type AnyUpload = File | RNUploadFile | (File | RNUploadFile)[];

const toRNPart = (f: File | RNUploadFile, i: number) => {
  if ((f as RNUploadFile).uri) {
    const rn = f as RNUploadFile;
    return {
      uri: rn.uri,
      name: rn.name ?? rn.uri.split('/').pop() ?? `archivo_${i}.bin`,
      type: rn.type ?? 'application/octet-stream',
    } as any;
  } else {
    // ⚠️ En RN puro no existe File; esto es útil si compartes código con web/Expo web.
    const file = f as File;
    return {
      // para web, axios usa Blob directamente; en RN necesitarías uri
      // solo uses esto si también corres en web
      uri: (URL.createObjectURL as any)?.(file) ?? '',
      name: file.name ?? `archivo_${i}.bin`,
      type: file.type || 'application/octet-stream',
    } as any;
  }
};

export const subirArchivoOrden = async (
  orderId: number,
  fileOrFiles: AnyUpload,
  type?: string
) => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Token no encontrado');

  const formData = new FormData();
  if (type) formData.append('type', type);

  const arr = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
  arr.forEach((f, i) => formData.append('files', toRNPart(f, i)));

  const { data } = await API.post(`/work-order-file/${orderId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      // 'Content-Type': 'multipart/form-data' // axios suele setearlo solo
    },
  });

  return data;
};