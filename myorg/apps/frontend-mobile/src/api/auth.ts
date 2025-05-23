import API from "./http";

interface Role {
  id: number;
  name: string;
}

interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    role_id?: number;
    areas_operator_id?: number;
}

export const login = (username: string, password: string) =>
  API.post("/auth/login", { username, password });

export const register = (data: RegisterRequest) =>
  API.post("/auth/register", data);

export const getRoles = () => API.get<Role[]>("/auth/roles");
