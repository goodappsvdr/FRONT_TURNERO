import { useState, useMemo, useCallback, memo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppointmentStore } from "@/store/appointmentStore";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const Calendar = memo(function Calendar({
  selectedDate,
  onDateSelect,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const appointments = useAppointmentStore((state) => state.appointments);

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

  const appointmentsByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        pending: number;
        confirmed: number;
        completed: number;
        cancelled: number;
      }
    >();
    appointments.forEach((apt) => {
      const current = map.get(apt.date) || {
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      };
      current.total++;
      current[apt.status]++;
      map.set(apt.date, current);
    });
    return map;
  }, [appointments]);

  const getAppointmentInfo = useCallback(
    (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return (
        appointmentsByDate.get(dateStr) || {
          total: 0,
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
        }
      );
    },
    [appointmentsByDate]
  );

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
    onDateSelect(new Date());
  }, [onDateSelect]);

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
      <div className="bg-linear-to-r from-primary/5 to-primary/10 px-4 py-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold capitalize text-foreground">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Hoy
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8 hover:bg-primary/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 hover:bg-primary/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const info = getAppointmentInfo(day);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);

            return (
              <button
                key={idx}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "relative h-11 rounded-lg text-sm font-medium transition-all duration-150",
                  "hover:bg-accent hover:scale-105 active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  !isCurrentMonth && "text-muted-foreground/40",
                  isTodayDate &&
                    !isSelected &&
                    "bg-accent text-accent-foreground ring-1 ring-primary/30",
                  isSelected &&
                    "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                )}
              >
                <span className={cn(isTodayDate && !isSelected && "font-bold")}>
                  {format(day, "d")}
                </span>
                {info.total > 0 && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {info.pending > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                    {info.confirmed > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                    {info.completed > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                    {info.cancelled > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
