import { create } from "zustand";
import type {
  AvailabilityRange,
  AvailabilityOverride,
} from "@/services/disponibilidad";
import { getAvailabilityExceptions, saveAvailabilityExceptions } from "@/services/disponibilidad";

interface AvailabilityStore {
  ranges: AvailabilityRange[];
  overrides: AvailabilityOverride[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchAvailability: (empleadoId: number) => Promise<void>;
  saveAvailability: (
    empleadoId: number,
    ranges: AvailabilityRange[],
    overrides: AvailabilityOverride[]
  ) => Promise<boolean>;
  addRange: (range: AvailabilityRange) => void;
  removeRange: (index: number) => void;
  addOverride: (override: AvailabilityOverride) => void;
  removeOverride: (index: number) => void;
  clearAll: () => void;
  reset: () => void;
}

export const useAvailabilityStore = create<AvailabilityStore>((set, get) => ({
  ranges: [],
  overrides: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchAvailability: async (empleadoId: number) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getAvailabilityExceptions(empleadoId);
      set({
        ranges: data.ranges || [],
        overrides: data.overrides || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al cargar disponibilidades",
        isLoading: false,
      });
    }
  },

  saveAvailability: async (
    empleadoId: number,
    ranges: AvailabilityRange[],
    overrides: AvailabilityOverride[]
  ) => {
    set({ isSaving: true, error: null });
    try {
      await saveAvailabilityExceptions(empleadoId, { ranges, overrides });
      set({ ranges, overrides, isSaving: false });
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error al guardar disponibilidades",
        isSaving: false,
      });
      return false;
    }
  },

  addRange: (range: AvailabilityRange) => {
    set((state) => ({
      ranges: [...state.ranges, range],
    }));
  },

  removeRange: (index: number) => {
    set((state) => ({
      ranges: state.ranges.filter((_, i) => i !== index),
    }));
  },

  addOverride: (override: AvailabilityOverride) => {
    set((state) => ({
      overrides: [...state.overrides, override],
    }));
  },

  removeOverride: (index: number) => {
    set((state) => ({
      overrides: state.overrides.filter((_, i) => i !== index),
    }));
  },

  clearAll: () => {
    set({ ranges: [], overrides: [] });
  },

  reset: () => {
    set({
      ranges: [],
      overrides: [],
      isLoading: false,
      isSaving: false,
      error: null,
    });
  },
}));
