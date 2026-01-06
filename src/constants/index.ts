export const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [`${hour}:00`, `${hour}:30`];
}).flat();

export const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, '0')
);

export const DAYS_OF_WEEK = [
  { id: 1, name: 'Lunes', shortName: 'Lu' },
  { id: 2, name: 'Martes', shortName: 'Ma' },
  { id: 3, name: 'Miércoles', shortName: 'Mi' },
  { id: 4, name: 'Jueves', shortName: 'Ju' },
  { id: 5, name: 'Viernes', shortName: 'Vi' },
  { id: 6, name: 'Sábado', shortName: 'Sa' },
  { id: 7, name: 'Domingo', shortName: 'Do' },
] as const;

export const DEFAULT_TIME_RANGES = [
  { id: '1', start: '09:00', end: '12:00' },
  { id: '2', start: '14:00', end: '19:00' },
] as const;

export const API_DATE_FORMAT = 'yyyy-MM-dd';
export const API_TIME_FORMAT = 'HH:mm';
export const DISPLAY_DATE_FORMAT = 'dd/MM/yyyy';
export const DISPLAY_TIME_FORMAT = 'HH:mm';

export const QUERY_KEYS = {
  APPOINTMENTS: 'appointments',
  AVAILABILITY: 'availability',
  CLIENTS: 'clients',
  AUTH: 'auth',
  CALENDAR: 'calendar',
  SLOTS: 'availableSlots',
} as const;

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  THEME: 'theme',
  USER_PREFERENCES: 'user_preferences',
} as const;

export const TOAST_DURATION = 4000;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const DEBOUNCE_DELAY = 300;
export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000;
