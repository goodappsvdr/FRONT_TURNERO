export interface AvailabilityRange {
  days: number[];
  startTime: string;
  endTime: string;
}

export interface AvailabilityOverride {
  date: string;
  startTime: string;
  endTime: string;
}

export interface AvailabilityExceptionsRequest {
  ranges: AvailabilityRange[];
  overrides: AvailabilityOverride[];
}

export interface AvailabilityExceptionsResponse {
  ranges: AvailabilityRange[];
  overrides: AvailabilityOverride[];
}

export const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo", english: "Sunday" },
  { value: 1, label: "Lunes", english: "Monday" },
  { value: 2, label: "Martes", english: "Tuesday" },
  { value: 3, label: "Miércoles", english: "Wednesday" },
  { value: 4, label: "Jueves", english: "Thursday" },
  { value: 5, label: "Viernes", english: "Friday" },
  { value: 6, label: "Sábado", english: "Saturday" },
];

export const TIME_FORMAT = "HH:mm";

export function dayNameToNumber(dayName: string): number {
  const day = DAYS_OF_WEEK.find((d) => d.english === dayName);
  return day?.value ?? 0;
}

export function dayNumbersToNames(days: number[]): string[] {
  return days.map((day) => DAYS_OF_WEEK[day]?.english ?? "");
}
