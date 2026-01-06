import axios from "axios";
import type { ApiLoginResponse, ApiDecodeTokenResponse } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://apidragabrielagarcia.gestionconsultorios.com.ar/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url ?? "";
      const isLoginOrDecode =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/decode-token");

      if (!isLoginOrDecode) {
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (
    usuario: string,
    password: string
  ): Promise<ApiLoginResponse> => {
    try {
      const response = await api.post<ApiLoginResponse>("/auth/login", {
        usuario,
        password,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Usuario o contraseña incorrectos");
        }
        if (error.response?.status === 400) {
          throw new Error("Datos de entrada inválidos");
        }
        if (error.response && error.response.status >= 500) {
          throw new Error("Error del servidor. Inténtalo más tarde");
        }
        if (!error.response) {
          throw new Error("Error de conexión. Verifica tu conexión a internet");
        }
        const errorData = error.response.data as { message?: string };
        throw new Error(errorData?.message || "Error al iniciar sesión");
      }
      throw new Error("Error desconocido al iniciar sesión");
    }
  },

  decodeToken: async (): Promise<ApiDecodeTokenResponse> => {
    const response = await api.get<ApiDecodeTokenResponse>(
      "/auth/decode-token"
    );
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("auth_token");
  },
};

export default api;
