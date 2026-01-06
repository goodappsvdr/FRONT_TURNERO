import axios from "axios";
import type { ApiTurnosResponse, ApiTurnoDetalle } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://apidragabrielagarcia.gestionconsultorios.com.ar/api";

const turnosApiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

turnosApiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const turnosApi = {
  getAll: async (
    estado?: string,
    idEmpleado?: number
  ): Promise<ApiTurnosResponse> => {
    const response = await turnosApiInstance.get<ApiTurnosResponse>("/turnos", {
      params: { estado, idEmpleado },
    });
    return response.data;
  },
};

export type { ApiTurnosResponse, ApiTurnoDetalle };
