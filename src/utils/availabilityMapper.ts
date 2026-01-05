import type { AvailabilityResponse, OverrideApiItem } from "@/types";
import type { AvailabilityConfig, DayAvailability } from "@/types/availability";
import { DAYS_OF_WEEK } from "@/types/availability";

const ENGLISH_DAY_TO_ID: Record<string, number> = {
  Sunday: 7,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export const mapApiResponseToConfig = (
  response: AvailabilityResponse
): AvailabilityConfig => {
  // Inicializar mapa con todos los días
  const dailyAvailabilityMap: Record<number, DayAvailability> = {};
  DAYS_OF_WEEK.forEach(({ id }) => {
    dailyAvailabilityMap[id] = {
      day: id,
      enabled: false,
      timeRanges: [],
    };
  });

  // Procesar rangos de disponibilidad de la API
  const availabilityEntries = response.data.data.availability ?? [];
  availabilityEntries.forEach((range) => {
    range.days.forEach((englishDay) => {
      const dayId = ENGLISH_DAY_TO_ID[englishDay];
      if (dayId === undefined) return;

      const dayAvailability = dailyAvailabilityMap[dayId];
      if (!dayAvailability) return;

      dayAvailability.enabled = true;
      dayAvailability.timeRanges = [
        ...dayAvailability.timeRanges,
        {
          id: `${dayId}-${dayAvailability.timeRanges.length}`,
          start: range.startTime,
          end: range.endTime,
        },
      ];
    });
  });

  // Convertir mapa a arreglo en orden
  const dailyAvailability = DAYS_OF_WEEK.map(
    ({ id }) => dailyAvailabilityMap[id]
  );

  return {
    availabilityId: response.data.data.id ?? null,
    dailyAvailability,
    dateOverrides: [],
  };
};

export const mapOverridesToDateOverrides = (
  overrides: ReadonlyArray<OverrideApiItem>
): AvailabilityConfig["dateOverrides"] => {
  return overrides.map((override, index) => ({
    id: `override-${override.id ?? override.availabilityId ?? index}`,
    date: override.date,
    apiId: override.id ?? override.availabilityId ?? null,
    timeRanges: [
      {
        id: `${override.id ?? index}-0`,
        start: override.startTime,
        end: override.endTime,
      },
    ],
  }));
};
