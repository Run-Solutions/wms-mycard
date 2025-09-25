// myorg/apps/frontend-mobile/src/api/http.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
export const BASE_URL = "https://mycard.runsolutions-services.com/api/";

const API = axios.create({
  baseURL: "https://mycard.runsolutions-services.com/api/",
  timeout: 10000,
});

// Interceptor para token (opcional)
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("tokenRegister");
  console.log(token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
