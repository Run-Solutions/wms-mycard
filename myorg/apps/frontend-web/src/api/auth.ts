// myorg/apps/frontend-web/src/api/auth.ts
import API from "./http";

export interface Role {
  id: number;
  name: string;
}

interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    role_id?: number;
    areas_operator_id?: number;
    biometric_public_key?: string;
}

export const login = (username: string, password: string) =>
  API.post("/auth/login", { username, password });

export const register = (data: RegisterRequest) =>
  API.post("/auth/register", data);

export const getBiometricChallenge = (username: string) =>
  API.post("/auth/biometric-challenge", { username });

export const getRoles = () => API.get<Role[]>("/auth/roles");

export const getAreas = () => API.get<Role[]>("/auth/areas_operator");

export const verifyUsername = (username: string) => API.get(`/auth/verify-username/${username}`);