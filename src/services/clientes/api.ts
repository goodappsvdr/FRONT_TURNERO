import axios from "axios";
import type { ApiCliente } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://apidragabrielagarcia.gestionconsultorios.com.ar/api";

const clientesApiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

clientesApiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const clientesApi = {
  getAll: async (): Promise<ApiCliente[]> => {
    const response = await clientesApiInstance.get<ApiCliente[]>("/Clientes");
    return response.data;
  },
};

export type { ApiCliente };
