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
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export type AppointmentFormData = Omit<
  Appointment,
  "id" | "createdAt" | "updatedAt"
>;
