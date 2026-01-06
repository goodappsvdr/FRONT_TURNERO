import axios from "axios";
import { api } from "../api";
import type { ApiCalendarEvent, CreateTurnoPayload, UpdateTurnoFullPayload } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://apidragabrielagarcia.gestionconsultorios.com.ar/api";

const calendarApiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

calendarApiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const calendarApi = {
  getAll: async (): Promise<ApiCalendarEvent[]> => {
    const response = await calendarApiInstance.get<ApiCalendarEvent[]>("/Calendar");
    return response.data;
  },

  create: async (turno: CreateTurnoPayload): Promise<void> => {
    await calendarApiInstance.post("/Calendar/CreateTurno", turno);
  },

  updateEstado: async (id: number, estado: string): Promise<void> => {
    await calendarApiInstance.put("/Calendar/UpdateEstado", null, {
      params: { id, estado },
    });
  },

  cancelAppointment: async (
    id: number,
    cancellationReason: string
  ): Promise<void> => {
    await calendarApiInstance.post(
      "/Calendar/CancelarTurno",
      { cancellationReason },
      { params: { id } }
    );
  },

  updateFull: async (
    id: number,
    turno: UpdateTurnoFullPayload
  ): Promise<void> => {
    await calendarApiInstance.put("/Calendar/UpdateTurnoFull", turno, {
      params: { id },
    });
  },

  delete: async (id: number): Promise<void> => {
    await calendarApiInstance.delete("/Calendar/DeleteTurno", {
      params: { id },
    });
  },

  getAvailableSlots: async (startTime: string, endTime: string) => {
    const response = await calendarApiInstance.get(
      `/Schedules/AvailableSlots?startTime=${startTime}&endTime=${endTime}`
    );
    return response.data;
  },

  confirmarTurno: async (data: { startTime: string; nombre: string; celular: string }) => {
    const response = await calendarApiInstance.post("/Calendar/ConfirmarTurno", data);
    return response.data;
  },
};

export type { ApiCalendarEvent, CreateTurnoPayload, UpdateTurnoFullPayload };
