import axios, { AxiosError } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://apidragabrielagarcia.gestionconsultorios.com.ar/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token a las requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ==================== INTERFACES ====================

// Respuesta de error de la API
interface ApiErrorResponse {
  message?: string;
  status?: string;
}

// Respuesta del POST /api/auth/login
export interface ApiLoginResponse {
  status: string;
  message: string;
  token: string;
  token_Type: string;
  expires_At: string;
  idUsuario: number;
  idEmpleado: number | null;
  idRol: number;
  idEmpresa: number | null;
  apiKey: string;
}

// Respuesta del GET /api/auth/decode-token
export interface ApiDecodeTokenResponse {
  status: string;
  usuario: {
    idUsuario: string;
    login: string;
    email: string;
    idEmpleado: string;
    idRol: string;
    idEmpresa: string;
    apiKey: string;
  };
  expira: string;
}

// Respuesta del GET /api/Calendar
export interface ApiCalendarEvent {
  id: number;
  titulo: string;
  inicio: string;
  fin: string;
  profesional: string;
  estado: string;
  celular: string;
}

// Payload para POST /api/Calendar/CreateTurno
export interface CreateTurnoPayload {
  id?: number;
  celular: string;
  nombre: string;
  fecha: string;
  horarioComienzo: string;
  horarioFin: string;
  horarioComienzoTexto: string;
  horarioFinTexto: string;
  duracionTexto: string;
  uidCal: string;
  nombrePeluquero: string;
}

// Payload para PUT /api/Calendar/UpdateTurnoFull
export interface UpdateTurnoFullPayload {
  celular: string;
  nombre: string;
  fecha: string;
  horarioComienzo: string;
  horarioFin: string;
  horarioComienzoTexto: string;
  horarioFinTexto: string;
  duracionTexto: string;
  nombrePeluquero: string;
  estado: string;
}

// Respuesta del GET /api/Clientes
export interface ApiCliente {
  celular: string;
  nombre: string;
}

// Respuesta del GET /api/turnos (con filtros)
export interface ApiTurnoDetalle {
  id: number;
  celular: string;
  nombre: string;
  fecha: string;
  horarioComienzo: string | null;
  horarioFin: string | null;
  horarioComienzoTexto: string;
  horarioFinTexto: string;
  duracionTexto: string;
  uidCal: string;
  nombrePeluquero: string;
}

export interface ApiTurnosResponse {
  status: number;
  data: ApiTurnoDetalle[];
}

// Disponibilidad del empleado
export interface ApiDisponibilidadResponse {
  status: string;
  data: {
    status: string;
    data: {
      id: number;
      ownerId: number;
      name: string;
      timeZone: string;
      availability: {
        days: string[];
        startTime: string;
        endTime: string;
      }[];
      isDefault: boolean;
      overrides: unknown[];
    };
  };
}

// Tipos de evento
export interface ApiTipoEvento {
  id: number;
  title: string;
  slug: string;
  length: number;
  hidden: boolean;
  link: string;
}

export interface ApiTiposEventoResponse {
  status: string;
  empleadoId: number;
  empleado: string;
  data: {
    event_types: ApiTipoEvento[];
  };
}

// ==================== API DE AUTENTICACIÓN ====================
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
      // Handle login errors specifically without triggering the interceptor
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          throw new Error("Usuario o contraseña incorrectos");
        }
        if (axiosError.response?.status === 400) {
          throw new Error("Datos de entrada inválidos");
        }
        if (axiosError.response && axiosError.response.status >= 500) {
          throw new Error("Error del servidor. Inténtalo más tarde");
        }
        if (!axiosError.response) {
          throw new Error("Error de conexión. Verifica tu conexión a internet");
        }
        const errorData = axiosError.response.data as ApiErrorResponse;
        throw new Error(errorData?.message || "Error al iniciar sesión");
      }
      // For non-axios errors
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

// ==================== API DE CALENDAR ====================
export const calendarApi = {
  getAll: async (): Promise<ApiCalendarEvent[]> => {
    const response = await api.get<ApiCalendarEvent[]>("/Calendar");
    return response.data;
  },

  create: async (turno: CreateTurnoPayload): Promise<void> => {
    await api.post("/Calendar/CreateTurno", turno);
  },

  updateEstado: async (id: number, estado: string): Promise<void> => {
    await api.put("/Calendar/UpdateEstado", null, {
      params: { id, estado },
    });
  },

  cancelAppointment: async (
    id: number,
    cancellationReason: string
  ): Promise<void> => {
    await api.post(
      "/Calendar/CancelarTurno",
      {
        cancellationReason,
      },
      {
        params: { id },
      }
    );
  },

  updateFull: async (
    id: number,
    turno: UpdateTurnoFullPayload
  ): Promise<void> => {
    await api.put("/Calendar/UpdateTurnoFull", turno, {
      params: { id },
    });
  },

  delete: async (id: number): Promise<void> => {
    await api.delete("/Calendar/DeleteTurno", {
      params: { id },
    });
  },

  getAvailableSlots: async (startTime: string, endTime: string) => {
    const response = await api.get(
      `/Schedules/AvailableSlots?startTime=${startTime}&endTime=${endTime}`
    );
    return response.data;
  },

  confirmarTurno: async (data: {
    startTime: string;
    duracion: number;
    duracionTexto: string;
    nombre: string;
    celular: string;
    timeZone: string;
  }) => {
    const response = await api.post("/Calendar/ConfirmarTurno", data);
    return response.data;
  },
};

// ==================== API DE TURNOS (CON FILTROS) ====================
export const turnosApi = {
  getAll: async (
    estado?: string,
    idEmpleado?: number
  ): Promise<ApiTurnosResponse> => {
    const response = await api.get<ApiTurnosResponse>("/turnos", {
      params: { estado, idEmpleado },
    });
    return response.data;
  },
};

// ==================== API DE CLIENTES ====================
export const clientesApi = {
  getAll: async (): Promise<ApiCliente[]> => {
    const response = await api.get<ApiCliente[]>("/Clientes");
    return response.data;
  },
};

// ==================== API DE SCHEDULES ====================
export const schedulesApi = {
  getDisponibilidad: async (
    empleadoId: number
  ): Promise<ApiDisponibilidadResponse> => {
    const response = await api.get<ApiDisponibilidadResponse>(
      "/Schedules/disponibilidad",
      {
        params: { empleadoId },
      }
    );
    return response.data;
  },

  createDisponibilidad: async (
    empleadoId: number,
    data: {
      scheduleId: number;
      days: number[];
      startTime: string;
      endTime: string;
    }
  ): Promise<void> => {
    await api.post("/Schedules/disponibilidad", data, {
      params: { empleadoId },
    });
  },

  getExcepciones: async (
    empleadoId: number
  ): Promise<{ status: string; data: unknown[] }> => {
    const response = await api.get("/Schedules/excepciones", {
      params: { empleadoId },
    });
    return response.data;
  },

  createExcepcion: async (
    empleadoId: number,
    data: { date: string; startTime: string; endTime: string }
  ): Promise<void> => {
    await api.post("/Schedules/excepciones", data, {
      params: { empleadoId },
    });
  },

  deleteExcepcion: async (
    availabilityId: number,
    empleadoId: number
  ): Promise<void> => {
    await api.delete(`/Schedules/excepciones/${availabilityId}`, {
      params: { empleadoId },
    });
  },
};

// ==================== API DE TIPOS DE EVENTO ====================
export const tiposEventoApi = {
  getByEmpleado: async (
    empleadoId: number
  ): Promise<ApiTiposEventoResponse> => {
    const response = await api.get<ApiTiposEventoResponse>(
      `/tipos-evento/${empleadoId}`
    );
    return response.data;
  },
};
