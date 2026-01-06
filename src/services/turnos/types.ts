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
