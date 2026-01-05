export interface TimeRange {
  id: string;
  start: string; // "09:00"
  end: string; // "12:00"
}

export interface DayAvailability {
  day: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  enabled: boolean;
  timeRanges: TimeRange[];
}

export interface DateOverride {
  id: string;
  date: string; // "2024-12-31"
  timeRanges: TimeRange[];
  apiId?: number | null;
}

export interface OverridePayload {
  date: string;
  startTime: string;
  endTime: string;
}

export interface AvailabilityConfig {
  availabilityId: number | null;
  dailyAvailability: DayAvailability[];
  dateOverrides: DateOverride[];
}

export const DAYS_OF_WEEK = [
  { id: 1, name: "Lunes" },
  { id: 2, name: "Martes" },
  { id: 3, name: "Miércoles" },
  { id: 4, name: "Jueves" },
  { id: 5, name: "Viernes" },
  { id: 6, name: "Sábado" },
  { id: 7, name: "Domingo" },
] as const;

export const DEFAULT_TIME_RANGES: TimeRange[] = [
  { id: "1", start: "09:00", end: "12:00" },
  { id: "2", start: "14:00", end: "19:00" },
];

export const createDefaultDayAvailability = (day: number): DayAvailability => ({
  day,
  enabled: day >= 1 && day <= 5, // Lunes a Viernes habilitados por defecto
  timeRanges: [
    ...DEFAULT_TIME_RANGES.map((tr) => ({ ...tr, id: `${day}-${tr.id}` })),
  ],
});

export const createDefaultAvailabilityConfig = (): AvailabilityConfig => ({
  availabilityId: null,
  dailyAvailability: DAYS_OF_WEEK.map(({ id }) =>
    createDefaultDayAvailability(id)
  ),
  dateOverrides: [],
});
