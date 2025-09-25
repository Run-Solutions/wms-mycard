// src/utils/file.ts
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';

export const guessMimeFromName = (filename: string): string => {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
};

export const sniffImageMime = (bytes: Uint8Array): string | null => {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // 'RIFF'
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // 'WEBP'
  ) return 'image/webp';
  return null;
};

export const extFromMime = (mime: string) => {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'application/pdf') return 'pdf';
  return 'bin';
};

// Normaliza lo que te devuelva el backend: ArrayBuffer | Uint8Array | base64 string
export const normalizeToBase64 = (data: ArrayBuffer | Uint8Array | string): { base64: string; bytes: Uint8Array } => {
  if (typeof data === 'string') {
    // Si ya es base64 (o binario en string), lo convertimos a bytes también
    try {
      const bytes = Uint8Array.from(Buffer.from(data, 'base64'));
      return { base64: data, bytes };
    } catch {
      // si es string binario, pasar a base64
      const b64 = Buffer.from(data, 'binary').toString('base64');
      const bytes = Uint8Array.from(Buffer.from(b64, 'base64'));
      return { base64: b64, bytes };
    }
  }
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const base64 = Buffer.from(bytes).toString('base64');
  return { base64, bytes };
};

// Escribe un archivo base64 en cache/doc
export const writeBase64 = async (uri: string, base64: string) => {
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
};