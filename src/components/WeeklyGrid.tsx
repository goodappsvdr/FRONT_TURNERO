import { memo, useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, User } from "lucide-react";
import { useAppointmentStore } from "@/store/appointmentStore";
import { cn } from "@/lib/utils";

interface WeeklyGridProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 border-l-amber-400",
  confirmed: "bg-emerald-100 border-l-emerald-400",
  completed: "bg-blue-100 border-l-blue-400",
  cancelled: "bg-red-100 border-l-red-400",
};

export const WeeklyGrid = memo(function WeeklyGrid({
  selectedDate,
  onDateSelect,
}: WeeklyGridProps) {
  const appointments = useAppointmentStore((state) => state.appointments);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const appointmentsByDayAndHour = useMemo(() => {
    const map = new Map<string, typeof appointments>();

    appointments.forEach((apt) => {
      const hour = parseInt(apt.startTime.split(":")[0]);
      const key = `${apt.date}-${hour}`;
      const existing = map.get(key) || [];
      map.set(key, [...existing, apt]);
    });

    return map;
  }, [appointments]);

  const getAppointmentsForSlot = (day: Date, hour: number) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return appointmentsByDayAndHour.get(`${dateStr}-${hour}`) || [];
  };

  const getDayStats = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayApts = appointments.filter((apt) => apt.date === dateStr);
    const totalHours = dayApts.reduce((acc, apt) => {
      const start = parseInt(apt.startTime.split(":")[0]);
      const end = parseInt(apt.endTime.split(":")[0]);
      return acc + (end - start);
    }, 0);
    return { count: dayApts.length, hours: totalHours };
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="grid grid-cols-8 border-b border-border">
        <div className="p-3 border-r border-border bg-muted/30">
          <div className="text-xs text-muted-foreground font-medium">
            Semana
          </div>
          <div className="text-lg font-bold text-foreground">
            {format(weekDays[0], "'W'w", { locale: es })}
          </div>
        </div>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const stats = getDayStats(day);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                "p-3 text-left border-r border-border last:border-r-0 transition-colors",
                "hover:bg-muted/50",
                isSelected && "bg-primary/5",
                isToday && "bg-primary/10"
              )}
            >
              <div className="text-xs text-muted-foreground uppercase">
                {format(day, "EEE", { locale: es })}
              </div>
              <div
                className={cn(
                  "text-2xl font-bold",
                  isToday ? "text-primary" : "text-foreground"
                )}
              >
                {format(day, "d")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.hours}h · {stats.count} turnos
              </div>
            </button>
          );
        })}
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-8 border-b border-border/50 last:border-b-0"
          >
            <div className="p-2 border-r border-border bg-muted/20 flex items-start justify-end">
              <span className="text-xs text-muted-foreground font-medium">
                {hour.toString().padStart(2, "0")}:00
              </span>
            </div>
            {weekDays.map((day) => {
              const slotApts = getAppointmentsForSlot(day, hour);
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-[80px] p-1 border-r border-border/50 last:border-r-0 bg-card hover:bg-muted/20 transition-colors"
                >
                  {slotApts.map((apt) => (
                    <div
                      key={apt.id}
                      className={cn(
                        "rounded-lg p-2 mb-1 border-l-4 cursor-pointer transition-all",
                        "hover:shadow-md hover:-translate-y-0.5",
                        statusColors[apt.status] ||
                          "bg-gray-100 border-l-gray-400"
                      )}
                    >
                      <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                        <Clock className="h-3 w-3" />
                        {apt.startTime}-{apt.endTime}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {apt.treatment}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs text-foreground truncate">
                          {apt.patientName}
                        </span>
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
  );
});
