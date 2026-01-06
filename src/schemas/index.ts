import { z } from 'zod';

export const appointmentFormSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/, 'El nombre solo puede contener letras y espacios'),
  
  celular: z
    .string()
    .min(10, 'El celular debe tener al menos 10 dígitos')
    .max(15, 'El celular no puede exceder 15 dígitos')
    .regex(/^\+?[0-9]+$/, 'El celular solo puede contener números'),
  
  fecha: z
    .string()
    .min(1, 'La fecha es requerida')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  
  horarioComienzo: z
    .string()
    .min(1, 'El horario de inicio es requerido')
    .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  
  horarioFin: z
    .string()
    .min(1, 'El horario de fin es requerido')
    .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  
  nombrePeluquero: z
    .string()
    .min(2, 'El nombre del profesional es requerido'),
}).refine((data) => {
  const inicio = data.horarioComienzo;
  const fin = data.horarioFin;
  return inicio < fin;
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['horarioFin'],
});

export const loginSchema = z.object({
  usuario: z
    .string()
    .min(1, 'El usuario es requerido')
    .max(50, 'El usuario no puede exceder 50 caracteres'),
  
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(4, 'La contraseña debe tener al menos 4 caracteres'),
});

export const availabilitySchema = z.object({
  days: z
    .array(z.number().min(1).max(7))
    .min(1, 'Debe seleccionar al menos un día'),
  
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
}).refine((data) => data.startTime < data.endTime, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['endTime'],
});

export const overrideSchema = z.object({
  date: z
    .string()
    .min(1, 'La fecha es requerida')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
}).refine((data) => data.startTime < data.endTime, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['endTime'],
});

export type AppointmentFormData = z.infer<typeof appointmentFormSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type AvailabilityFormData = z.infer<typeof availabilitySchema>;
export type OverrideFormData = z.infer<typeof overrideSchema>;
