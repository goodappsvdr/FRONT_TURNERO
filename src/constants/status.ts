export const STATUS_MAP = {
  pendiente: 'pending' as const,
  confirmado: 'confirmed' as const,
  completado: 'completed' as const,
  cancelado: 'cancelled' as const,
  si: 'confirmed' as const,
  confirmado_lower: 'confirmed' as const,
  finalizado: 'completed' as const,
  cancelado_lower: 'cancelled' as const,
} as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: 'yellow' },
  { value: 'confirmed', label: 'Confirmado', color: 'green' },
  { value: 'completed', label: 'Completado', color: 'gray' },
  { value: 'cancelled', label: 'Cancelado', color: 'red' },
];

export function mapStatusToApi(status: string): string {
  const statusToApi: Record<string, string> = {
    pending: 'pendiente',
    confirmed: 'confirmado',
    completed: 'finalizado',
    cancelled: 'cancelado',
  };
  return statusToApi[status] || 'pendiente';
}

export function mapStatusFromApi(apiStatus: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' {
  const normalizedStatus = apiStatus.toLowerCase().trim();
  return STATUS_MAP[normalizedStatus as keyof typeof STATUS_MAP] || 'pending';
}
