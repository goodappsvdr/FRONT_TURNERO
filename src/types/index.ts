export interface Appointment {
  id: number;
  patientName: string;
  patientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  treatment: string;
  profesional: string;
  notes?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  login: string;
  email: string;
  rol: number;
  IdEmpleado?: number; // ID del empleado para la API de disponibilidad
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export type AppointmentFormData = Omit<
  Appointment,
  "id" | "createdAt" | "updatedAt"
>;

// API Response types for availability
export interface AvailabilityTimeRange {
  days: string[];
  startTime: string;
  endTime: string;
}

export interface AvailabilityData {
  id: number;
  ownerId: number;
  name: string;
  timeZone: string;
  availability: AvailabilityTimeRange[];
  isDefault?: boolean;
  overrides?: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface AvailabilityResponse {
  status: string;
  data: {
    status: string;
    data: AvailabilityData;
  };
}

export interface OverrideApiItem {
  id?: number;
  availabilityId?: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface OverridesResponse {
  status: string;
  data: OverrideApiItem[];
}
