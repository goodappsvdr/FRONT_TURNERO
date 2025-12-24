import { create } from "zustand";
import {
  calendarApi,
  type ApiCalendarEvent,
  type CreateTurnoPayload,
  type UpdateTurnoFullPayload,
} from "@/services/api";
import { parseISO } from "date-fns";
import type { Appointment } from "@/types";

interface AppointmentStore {
  appointments: Appointment[];
  availableSlots: string[];
  isLoadingSlots: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
  fetchAppointments: () => Promise<void>;
  fetchAvailableSlots: (date: Date) => Promise<void>;
  createAppointment: (data: CreateTurnoPayload) => Promise<boolean>;
  createAppointmentFromSlot: (
    slot: string,
    patientName: string,
    patientPhone: string
  ) => Promise<boolean>;
  updateAppointmentStatus: (id: number, estado: string) => Promise<boolean>;
  cancelAppointment: (
    id: number,
    cancellationReason: string
  ) => Promise<boolean>;
  updateAppointmentFull: (
    id: number,
    data: UpdateTurnoFullPayload
  ) => Promise<boolean>;
  deleteAppointment: (id: number) => Promise<boolean>;
  getAppointmentsByDate: (date: string) => Appointment[];
  getAppointmentById: (id: number) => Appointment | undefined;
}

function mapApiToAppointment(api: ApiCalendarEvent): Appointment {
  const inicio = parseISO(api.inicio);
  const fin = parseISO(api.fin);

  const mapStatus = (estado: string): Appointment["status"] => {
    if (estado === "cancelado") return "cancelled";
    if (estado === "si" || estado === "confirmado") return "confirmed";
    if (estado === "finalizado" || estado === "completado") return "completed";
    return "pending";
  };

  // Extract date directly from ISO string to avoid timezone issues
  const dateKey = api.inicio.split("T")[0];

  return {
    id: api.id,
    patientName: api.titulo,
    patientPhone: api.celular,
    date: dateKey,
    startTime: inicio.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    endTime: fin.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    treatment: "Consulta",
    profesional: api.profesional,
    status: mapStatus(api.estado),
  };
}

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: [],
  availableSlots: [],
  isLoadingSlots: false,
  isLoading: false,
  error: null,
  lastUpdated: Date.now(),

  fetchAppointments: async () => {
    set({ isLoading: true, error: null });
    try {
      const events = await calendarApi.getAll();
      const appointments = events.map(mapApiToAppointment);
      set({ appointments, isLoading: false, lastUpdated: Date.now() });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      set({ error: "Error al cargar los turnos", isLoading: false });
    }
  },

  fetchAvailableSlots: async (date: Date) => {
    set({ isLoadingSlots: true, error: null });
    try {
      // Create start and end times for the selected date (Argentina timezone)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      // Convert to UTC for API
      const startTime = startDate.toISOString();
      const endTime = endDate.toISOString();

      const response = await calendarApi.getAvailableSlots(startTime, endTime);

      // Extract slots for the selected date
      const dateKey = date.toISOString().split("T")[0];
      const slots = response.slots[dateKey] || [];

      set({ availableSlots: slots, isLoadingSlots: false });
    } catch (error) {
      console.error("Error fetching available slots:", error);
      set({
        error: "Error al cargar horarios disponibles",
        isLoadingSlots: false,
      });
    }
  },

  createAppointmentFromSlot: async (
    slot: string,
    patientName: string,
    patientPhone: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      await calendarApi.confirmarTurno({
        startTime: slot,
        nombre: patientName,
        celular: patientPhone,
      });

      // Refresh appointments and available slots
      await get().fetchAppointments();
      const slotDate = new Date(slot);
      await get().fetchAvailableSlots(slotDate);

      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error("Error creating appointment from slot:", error);
      set({ error: "Error al crear turno", isLoading: false });
      return false;
    }
  },

  createAppointment: async (data: CreateTurnoPayload) => {
    set({ isLoading: true, error: null });
    try {
      await calendarApi.create(data);
      await get().fetchAppointments();
      return true;
    } catch (error) {
      console.error("Error creating appointment:", error);
      set({ isLoading: false, error: "Error al crear el turno" });
      return false;
    }
  },

  updateAppointmentStatus: async (id: number, estado: string) => {
    try {
      await calendarApi.updateEstado(id, estado);
      await get().fetchAppointments();
      return true;
    } catch (error) {
      console.error("Error updating appointment status:", error);
      set({ error: "Error al actualizar el estado del turno" });
      return false;
    }
  },

  updateAppointmentFull: async (id: number, data: UpdateTurnoFullPayload) => {
    try {
      await calendarApi.updateFull(id, data);
      await get().fetchAppointments();
      return true;
    } catch (error) {
      console.error("Error updating appointment:", error);
      set({ error: "Error al actualizar el turno" });
      return false;
    }
  },

  cancelAppointment: async (id: number, cancellationReason: string) => {
    try {
      await calendarApi.cancelAppointment(id, cancellationReason);
      await get().fetchAppointments();
      return true;
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      set({ error: "Error al cancelar el turno" });
      return false;
    }
  },

  deleteAppointment: async (id: number) => {
    try {
      await calendarApi.delete(id);
      await get().fetchAppointments();
      return true;
    } catch (error) {
      console.error("Error deleting appointment:", error);
      set({ error: "Error al eliminar el turno" });
      return false;
    }
  },

  getAppointmentsByDate: (date: string) => {
    return get().appointments.filter((apt) => apt.date === date);
  },

  getAppointmentById: (id: number) => {
    return get().appointments.find((apt) => apt.id === id);
  },
}));
