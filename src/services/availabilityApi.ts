import { api } from "./api";
import type { AvailabilityResponse, OverridesResponse } from "@/types";
import type { AvailabilityConfig, OverridePayload } from "@/types/availability";

export const availabilityApi = {
  // Obtener configuración de disponibilidad desde la API real
  getAvailability: async (
    empleadoId: number
  ): Promise<AvailabilityResponse> => {
    const response = await api.get<AvailabilityResponse>(
      "/Schedules/disponibilidad",
      {
        params: { empleadoId },
      }
    );
    return response.data;
  },

  // Guardar configuración de disponibilidad (placeholder para implementación futura)
  saveAvailability: async (config: AvailabilityConfig): Promise<void> => {
    // TODO: Implementar endpoint para guardar configuración
    console.log("Saving availability config:", config);
    // await api.post("/Availability", config);
  },

  // Crear nueva configuración de disponibilidad
  createAvailability: async (
    empleadoId: number,
    days: number[],
    startTime: string,
    endTime: string
  ): Promise<void> => {
    await api.post(
      "/Schedules/disponibilidad",
      {
        days,
        StartTime: startTime,
        EndTime: endTime,
      },
      {
        params: { empleadoId },
      }
    );
  },
  updateAvailability: async (
    availabilityId: number,
    empleadoId: number,
    days: number[],
    startTime: string,
    endTime: string
  ): Promise<void> => {
    await api.patch(
      `/Schedules/disponibilidad/${availabilityId}`,
      {
        days,
        StartTime: startTime,
        EndTime: endTime,
      },
      {
        params: { empleadoId },
      }
    );
  },

  deleteAvailability: async (
    availabilityId: number,
    empleadoId: number
  ): Promise<void> => {
    await api.delete(`/Schedules/disponibilidad/${availabilityId}`, {
      params: { empleadoId },
    });
  },

  getOverrides: async (empleadoId: number): Promise<OverridesResponse> => {
    const response = await api.get<OverridesResponse>(
      "/Schedules/excepciones",
      {
        params: { empleadoId },
      }
    );
    return response.data;
  },

  createOverride: async (
    empleadoId: number,
    payload: OverridePayload
  ): Promise<void> => {
    await api.post("/Schedules/excepciones", payload, {
      params: { empleadoId },
    });
  },

  deleteOverride: async (
    availabilityId: number,
    empleadoId: number
  ): Promise<void> => {
    await api.delete(`/Schedules/excepciones/${availabilityId}`, {
      params: { empleadoId },
    });
  },
};
