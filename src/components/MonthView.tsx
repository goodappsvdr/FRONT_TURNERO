import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppointmentStore } from "@/store/appointmentStore";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";

interface MonthViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  view?: "month";
  onViewChange?: (view: "month") => void;
}

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function MonthView({ selectedDate, onDateSelect }: MonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const appointments = useAppointmentStore((state) => state.appointments);

  // Agrupar citas por fecha para un acceso rápido
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((appt) => {
      const dateKey = appt.date; // Already in yyyy-MM-dd format
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(appt);
    });
    return map;
  }, [appointments]);

  // Generar los días del mes actual
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const daysArray: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      daysArray.push(day);
      day = addDays(day, 1);
    }

    return daysArray;
  }, [currentMonth]);

  // Navegación entre meses
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  // Estilos para los días
  const getDayClasses = (day: Date) => {
    const isSelected = isSameDay(day, selectedDate);
    const isDayToday = isToday(day);
    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

    return cn(
      "relative p-3 h-28 overflow-hidden border border-cal-gray-200 rounded-lg transition-all duration-200 bg-white",
      isSameMonth(day, currentMonth)
        ? "text-cal-gray-900"
        : "text-cal-gray-400 bg-cal-gray-50",
      isSelected && "ring-2 ring-cal-primary ring-offset-2 bg-cal-primary/5",
      isDayToday && "border-cal-primary/50 bg-cal-primary/10",
      isPast && "opacity-50 cursor-not-allowed",
      !isPast &&
        "hover:shadow-sm hover:border-cal-primary/30 hover:cursor-pointer",
      "flex flex-col"
    );
  };

  // Contar eventos por día
  const getAppointmentCount = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return appointmentsByDate.get(dateKey)?.length || 0;
  };

  // Renderizar miniaturas de eventos
  const renderEventPreviews = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dayAppointments = appointmentsByDate.get(dateKey) || [];

    return dayAppointments.slice(0, 2).map((appt, idx) => (
      <div
        key={idx}
        className={cn(
          "text-xs px-1 rounded mb-0.5 leading-tight wrap-break-word",
          appt.status === "confirmed" && "bg-emerald-100 text-emerald-800",
          appt.status === "pending" && "bg-amber-100 text-amber-800",
          appt.status === "completed" && "bg-blue-100 text-blue-800",
          appt.status === "cancelled" && "bg-gray-100 text-gray-500"
        )}
      >
        {appt.patientName}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
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
              onClick={nextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" className="bg-primary/90">
            Mes
          </Button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="text-sm font-medium text-center text-cal-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-2 flex-1">
        {days.map((day) => {
          const dayNumber = format(day, "d");
          const isDayToday = isToday(day);
          const appointmentCount = getAppointmentCount(day);
          const hasMoreAppointments = appointmentCount > 2;

          return (
            <div
              key={day.toString()}
              onClick={() => {
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                if (!isPast) {
                  onDateSelect(day);
                }
              }}
              className={getDayClasses(day)}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full h-6 w-6 text-sm font-medium",
                    isDayToday && "bg-cal-primary text-white font-bold"
                  )}
                >
                  {dayNumber}
                </span>
                {hasMoreAppointments && (
                  <span className="text-xs bg-cal-gray-100 text-cal-gray-600 rounded-full px-1.5">
                    +{appointmentCount - 2}
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-0.5 flex-1 overflow-hidden">
                {renderEventPreviews(day)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
