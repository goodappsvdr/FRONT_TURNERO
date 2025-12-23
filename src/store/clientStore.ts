import { create } from "zustand";
import { clientesApi, type ApiCliente } from "@/services/api";

interface ClientStore {
  clients: ApiCliente[];
  isLoading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
}

export const useClientStore = create<ClientStore>()((set) => ({
  clients: [],
  isLoading: false,
  error: null,

  fetchClients: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await clientesApi.getAll();
      set({ clients: data, isLoading: false });
    } catch (error) {
      console.error("Error fetching clients:", error);
      set({ isLoading: false, error: "Error al cargar los clientes" });
    }
  },
}));
