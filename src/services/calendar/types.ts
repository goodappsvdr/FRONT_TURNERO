export interface ApiCalendarEvent {
  id: number;
  titulo: string;
  inicio: string;
  fin: string;
  profesional: string;
  estado: string;
  celular: string;
}

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
