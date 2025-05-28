// src/utils/jwt.ts
import { Buffer } from 'buffer';

export interface JwtPayload {
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Decodifica el payload de un JWT y elimina `exp` e `iat`.
 * @param token JWT completo (header.payload.signature)
 * @returns Objeto con todos los claims excepto exp e iat, o null si falla.
 */
export function decodeJwtClean<T = Omit<JwtPayload, 'exp' | 'iat'>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Formato de JWT inválido');
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded) as JwtPayload;
    // Extraemos exp e iat y devolvemos el resto
    // @ts-ignore
    const { exp, iat, ...rest } = parsed;
    return rest as T;
  } catch (error) {
    console.warn('decodeJwtClean error:', error);
    return null;
  }
}