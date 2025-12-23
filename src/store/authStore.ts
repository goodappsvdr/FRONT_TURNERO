import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/services/api";
import type { User } from "@/types";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login(username, password);

          if (response.status === "200" && response.token) {
            // Obtener datos del usuario decodificando el token
            const decoded = await authApi.decodeToken();
            const user: User = {
              id: parseInt(decoded.usuario.idUsuario),
              login: decoded.usuario.login,
              email: decoded.usuario.email,
              rol: parseInt(decoded.usuario.idRol),
            };
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.message || "Credenciales incorrectas",
          });
          return false;
        } catch (error: unknown) {
          console.error("Login error:", error);
          const message =
            error instanceof Error
              ? error.message
              : "Error al conectar con el servidor";
          set({ isLoading: false, error: message });
          return false;
        }
      },

      logout: () => {
        authApi.logout();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
