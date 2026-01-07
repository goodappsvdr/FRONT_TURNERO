import type {
  AvailabilityExceptionsRequest,
  AvailabilityExceptionsResponse,
} from "./types";
import { dayNameToNumber, dayNumbersToNames } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  }

  return response;
}

export async function getAvailabilityExceptions(
  empleadoId: number
): Promise<AvailabilityExceptionsResponse> {
  const response = await fetchWithAuth(
    `/api/Schedules/disponibilidad?empleadoId=${empleadoId}`
  );

  if (!response.ok) {
    throw new Error("Error al obtener disponibilidades");
  }

  const apiResponse = await response.json();

  const data = apiResponse?.data?.data;

  if (!data) {
    return { ranges: [], overrides: [] };
  }

  const ranges = (data.availability || []).map((avail: any) => ({
    days: (avail.days || []).map((dayName: string) => dayNameToNumber(dayName)),
    startTime: avail.startTime,
    endTime: avail.endTime,
  }));

  const overrides = (data.overrides || []).map((override: any) => ({
    date: override.date,
    startTime: override.startTime,
    endTime: override.endTime,
  }));

  return { ranges, overrides };
}

export async function saveAvailabilityExceptions(
  empleadoId: number,
  data: AvailabilityExceptionsRequest
): Promise<AvailabilityExceptionsResponse> {
  const payload = {
    ranges: data.ranges.map((range) => ({
      days: dayNumbersToNames(range.days),
      startTime: range.startTime,
      endTime: range.endTime,
    })),
    overrides: data.overrides,
  };

  const response = await fetchWithAuth(
    `/api/Schedules/disponibilidad/excepciones?empleadoId=${empleadoId}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Error al guardar disponibilidades");
  }

  return response.json();
}
