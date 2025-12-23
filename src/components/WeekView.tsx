import { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  parseISO,
  isSameWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppointmentStore } from "@/store/appointmentStore";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";

interface WeekViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onViewChange?: (view: "month" | "week" | "day") => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23 horas

export function WeekView({
  selectedDate,
  onDateSelect,
  onViewChange,
}: WeekViewProps) {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);
  const appointments = useAppointmentStore((state) => state.appointments);

  // Calcular inicio y fin de la semana actual
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  // Generar los días de la semana
  const weekDays = useMemo(() => {
    const days = [];
    let day = weekStart;

    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [weekStart]);

  // Agrupar citas por día y hora
  const appointmentsByTimeSlot = useMemo(() => {
    const map = new Map<string, Appointment[]>();

    appointments.forEach((appt) => {
      const apptDate = parseISO(appt.date);
      const apptHour = parseInt(appt.startTime.split(":")[0], 10);

      // Solo incluir citas de la semana actual
      if (isSameWeek(apptDate, currentWeek, { weekStartsOn: 1 })) {
        const key = `${format(apptDate, "yyyy-MM-dd")}-${apptHour}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)?.push(appt);
      }
    });

    return map;
  }, [appointments, currentWeek]);

  // Navegación
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    onDateSelect(today);
  };

  // Obtener citas para un slot específico
  const getAppointmentsForTimeSlot = (day: Date, hour: number) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const key = `${dateKey}-${hour}`;
    return appointmentsByTimeSlot.get(key) || [];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header de la semana */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {format(weekStart, "d MMMM", { locale: es })} -{" "}
            {format(weekEnd, "d MMMM yyyy", { locale: es })}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevWeek}
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
              onClick={nextWeek}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewChange?.("day")}
          >
            Día
          </Button>
          <Button variant="default" size="sm" className="bg-primary/90">
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

      {/* Grid de la semana */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 border-b border-border/40">
          {/* Celda vacía para la columna de horas */}
          <div className="border-r border-border/40" />

          {/* Encabezados de los días */}
          {weekDays.map((day) => (
            <div
              key={day.toString()}
              className={cn(
                "p-2 text-center border-r border-border/40",
                isToday(day) && "bg-primary/10 font-medium",
                isSameDay(day, selectedDate) && "bg-primary/5"
              )}
            >
              <div className="text-sm font-medium">
                {format(day, "EEE", { locale: es })}
              </div>
              <div
                className={cn(
                  "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm",
                  isToday(day) && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Filas de horas */}
        <div className="grid grid-cols-8">
          {/* Columna de horas */}
          <div className="border-r border-border/40">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-border/20 flex items-start justify-end pr-2 text-xs text-muted-foreground"
              >
                {`${hour}:00`}
              </div>
            ))}
          </div>

          {/* Celdas de la semana */}
          {weekDays.map((day) => (
            <div
              key={day.toString()}
              className={cn(
                "border-r border-b border-border/20",
                isToday(day) && "bg-primary/5"
              )}
            >
              {HOURS.map((hour) => {
                const slotAppointments = getAppointmentsForTimeSlot(day, hour);

                return (
                  <div
                    key={`${day.toString()}-${hour}`}
                    className={cn(
                      "h-16 border-b border-border/10 relative transition-colors",
                      day < new Date(new Date().setHours(0, 0, 0, 0))
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-accent/20 cursor-pointer"
                    )}
                    onClick={() => {
                      const isPast =
                        day < new Date(new Date().setHours(0, 0, 0, 0));
                      if (!isPast) {
                        const newDate = new Date(day);
                        newDate.setHours(hour, 0, 0, 0);
                        onDateSelect(newDate);
                      }
                    }}
                  >
                    {slotAppointments.map((appt, idx) => (
                      <div
                        key={appt.id}
                        className={cn(
                          "absolute inset-1 rounded text-xs p-1 wrap-break-word leading-tight z-10",
                          appt.status === "confirmed" &&
                            "bg-emerald-100 text-emerald-800 border border-emerald-200",
                          appt.status === "pending" &&
                            "bg-amber-100 text-amber-800 border border-amber-200",
                          appt.status === "completed" &&
                            "bg-blue-100 text-blue-800 border border-blue-200",
                          appt.status === "cancelled" &&
                            "bg-gray-100 text-gray-500 border border-gray-200"
                        )}
                        style={{
                          top: `${idx * 2}px`,
                          left: `${idx * 2}px`,
                          right: `${idx * 2}px`,
                          zIndex: 10 + idx,
                        }}
                      >
                        <div className="font-medium wrap-break-word leading-tight">
                          {appt.patientName}
                        </div>
                        <div className="text-xs opacity-75">
                          {appt.startTime}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
