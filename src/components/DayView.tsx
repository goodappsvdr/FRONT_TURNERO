// src/components/DayView.tsx
import { useMemo } from "react";
import { format, addDays, subDays, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppointmentStore } from "@/store/appointmentStore";
import type { Appointment } from "@/types";

interface DayViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onViewChange?: (view: "month" | "week" | "day") => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23 horas

export function DayView({
  selectedDate,
  onDateSelect,
  onViewChange,
}: DayViewProps) {
  const appointments = useAppointmentStore((state) => state.appointments);

  // Navegación
  const nextDay = () => onDateSelect(addDays(selectedDate, 1));
  const prevDay = () => onDateSelect(subDays(selectedDate, 1));
  const goToToday = () => onDateSelect(new Date());

  // Obtener citas para el día seleccionado
  const dayAppointments = useMemo(() => {
    return appointments
      .filter((appt) => isSameDay(parseISO(appt.date), selectedDate))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDate]);

  // Agrupar citas por hora
  const appointmentsByHour = useMemo(() => {
    const hoursMap = new Map<number, Appointment[]>();
    HOURS.forEach((hour) => hoursMap.set(hour, []));

    dayAppointments.forEach((appt) => {
      const hour = parseInt(appt.startTime.split(":")[0], 10);
      hoursMap.get(hour)?.push(appt);
    });

    return hoursMap;
  }, [dayAppointments]);

  return (
    <div className="flex flex-col h-full">
      {/* Header del día */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevDay}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8"
            >
              Hoy
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextDay}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-primary/90"
            onClick={() => onViewChange?.("day")}
          >
            Día
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewChange?.("week")}
          >
            Semana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewChange?.("month")}
          >
            Mes
          </Button>
        </div>
      </div>

      {/* Grid del día */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-24 border-b border-border/20 grid grid-cols-12"
            >
              {/* Hora */}
              <div className="col-span-1 pt-1 pr-2 text-right text-sm text-muted-foreground">
                {`${hour}:00`}
              </div>

              {/* Área de citas */}
              <div
                className={cn(
                  "col-span-11 border-l border-border/20 p-1 relative",
                  selectedDate < new Date(new Date().setHours(0, 0, 0, 0))
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-accent/20 cursor-pointer"
                )}
                onClick={() => {
                  const isPast =
                    selectedDate < new Date(new Date().setHours(0, 0, 0, 0));
                  if (!isPast) {
                    const newDate = new Date(selectedDate);
                    newDate.setHours(hour, 0, 0, 0);
                    onDateSelect(newDate);
                  }
                }}
              >
                {appointmentsByHour.get(hour)?.map((appt) => (
                  <div
                    key={appt.id}
                    className={cn(
                      "p-2 mb-1 rounded text-xs truncate",
                      "border-l-4",
                      appt.status === "confirmed" &&
                        "bg-emerald-50 border-emerald-500 text-emerald-800",
                      appt.status === "pending" &&
                        "bg-amber-50 border-amber-500 text-amber-800",
                      appt.status === "completed" &&
                        "bg-blue-50 border-blue-500 text-blue-800",
                      appt.status === "cancelled" &&
                        "bg-gray-50 border-gray-300 text-gray-500"
                    )}
                  >
                    <div className="font-medium">{appt.patientName}</div>
                    <div className="text-xs opacity-75">
                      {appt.startTime} - {appt.endTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
