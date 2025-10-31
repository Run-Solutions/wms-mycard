// myorg/apps/frontend-web/src/api/http.ts
import axios from "axios";
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mycard.runsolutions-services.com/api/"

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://mycard.runsolutions-services.com/api/",
  timeout: 10000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("tokenRegister");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Error en respuesta:', error);
    return Promise.reject(error);
  }
);

export default API;