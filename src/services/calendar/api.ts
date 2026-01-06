import axios from "axios";
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

/**
 * Calendar API service for managing appointments and schedules.
 * @namespace calendarApi
 */
export const calendarApi = {
  /**
   * Fetches all calendar events from the API.
   * @returns {Promise<ApiCalendarEvent[]>} Array of calendar events
   * @throws {Error} When API request fails
   * @example
   * const events = await calendarApi.getAll();
   */
  getAll: async (): Promise<ApiCalendarEvent[]> => {
    const response = await calendarApiInstance.get<ApiCalendarEvent[]>("/Calendar");
    return response.data;
  },

  /**
   * Creates a new appointment/turno in the system.
   * @param {CreateTurnoPayload} turno - The appointment data to create
   * @returns {Promise<void>} Resolves when appointment is created
   * @throws {Error} When API request fails or validation fails
   * @example
   * await calendarApi.create({
   *   celular: "5493573...",
   *   nombre: "Juan Perez",
   *   fecha: "06-01-2026",
   *   ...
   * });
   */
  create: async (turno: CreateTurnoPayload): Promise<void> => {
    await calendarApiInstance.post("/Calendar/CreateTurno", turno);
  },

  /**
   * Updates the status of an existing appointment.
   * @param {number} id - The appointment ID to update
   * @param {string} estado - The new status (pendiente, confirmado, completado, cancelado)
   * @returns {Promise<void>} Resolves when status is updated
   * @throws {Error} When API request fails
   * @example
   * await calendarApi.updateEstado(123, "confirmado");
   */
  updateEstado: async (id: number, estado: string): Promise<void> => {
    await calendarApiInstance.put("/Calendar/UpdateEstado", null, {
      params: { id, estado },
    });
  },

  /**
   * Cancels an existing appointment with a reason.
   * @param {number} id - The appointment ID to cancel
   * @param {string} cancellationReason - The reason for cancellation
   * @returns {Promise<void>} Resolves when appointment is cancelled
   * @throws {Error} When API request fails
   * @example
   * await calendarApi.cancelAppointment(123, "Paciente solicito cancelar");
   */
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

  /**
   * Fully updates an appointment with all fields.
   * @param {number} id - The appointment ID to update
   * @param {UpdateTurnoFullPayload} turno - Complete appointment data
   * @returns {Promise<void>} Resolves when appointment is updated
   * @throws {Error} When API request fails
   * @example
   * await calendarApi.updateFull(123, { nombre: "Nuevo Nombre", ... });
   */
  updateFull: async (
    id: number,
    turno: UpdateTurnoFullPayload
  ): Promise<void> => {
    await calendarApiInstance.put("/Calendar/UpdateTurnoFull", turno, {
      params: { id },
    });
  },

  /**
   * Deletes an appointment from the system.
   * @param {number} id - The appointment ID to delete
   * @returns {Promise<void>} Resolves when appointment is deleted
   * @throws {Error} When API request fails
   * @example
   * await calendarApi.delete(123);
   */
  delete: async (id: number): Promise<void> => {
    await calendarApiInstance.delete("/Calendar/DeleteTurno", {
      params: { id },
    });
  },

  /**
   * Fetches available time slots for a given date range.
   * @param {string} startTime - Start of the range (ISO datetime)
   * @param {string} endTime - End of the range (ISO datetime)
   * @returns {Promise<Array>} Array of available time slots
   * @throws {Error} When API request fails
   * @example
   * const slots = await calendarApi.getAvailableSlots(
   *   "2026-01-06T00:00:00",
   *   "2026-01-07T00:00:00"
   * );
   */
  getAvailableSlots: async (startTime: string, endTime: string) => {
    const response = await calendarApiInstance.get(
      `/Schedules/AvailableSlots?startTime=${startTime}&endTime=${endTime}`
    );
    return response.data;
  },

  /**
   * Confirms a turn appointment with customer details.
   * @param {Object} data - Confirmation data
   * @param {string} data.startTime - Appointment start time
   * @param {string} data.nombre - Customer name
   * @param {string} data.celular - Customer phone
   * @returns {Promise<any>} API response data
   * @throws {Error} When API request fails
   * @example
   * await calendarApi.confirmarTurno({
   *   startTime: "10:00",
   *   nombre: "Maria Garcia",
   *   celular: "5493573..."
   * });
   */
  confirmarTurno: async (data: { startTime: string; nombre: string; celular: string }) => {
    const response = await calendarApiInstance.post("/Calendar/ConfirmarTurno", data);
    return response.data;
  },
};

export type { ApiCalendarEvent, CreateTurnoPayload, UpdateTurnoFullPayload };
