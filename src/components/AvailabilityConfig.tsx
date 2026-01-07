import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAvailabilityStore } from "@/store/availabilityStore";
import { DAYS_OF_WEEK } from "@/services/disponibilidad";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AvailabilityConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empleadoId: number;
}

export function AvailabilityConfig({
  open,
  onOpenChange,
  empleadoId,
}: AvailabilityConfigProps) {
  const {
    ranges,
    overrides,
    isLoading,
    isSaving,
    error,
    fetchAvailability,
    addRange,
    removeRange,
    addOverride,
    removeOverride,
    clearAll,
  } = useAvailabilityStore();

  const [newRangeDays, setNewRangeDays] = useState<number[]>([]);
  const [newRangeStartTime, setNewRangeStartTime] = useState("09:00");
  const [newRangeEndTime, setNewRangeEndTime] = useState("12:00");

  const [newOverrideDate, setNewOverrideDate] = useState("");
  const [newOverrideStartTime, setNewOverrideStartTime] = useState("09:00");
  const [newOverrideEndTime, setNewOverrideEndTime] = useState("12:00");

  useEffect(() => {
    if (open) {
      fetchAvailability(empleadoId);
    }
  }, [open, empleadoId, fetchAvailability]);

  const handleAddRange = () => {
    if (newRangeDays.length === 0) {
      toast.error("Selecciona al menos un día");
      return;
    }
    if (newRangeStartTime >= newRangeEndTime) {
      toast.error("La hora de inicio debe ser menor a la hora de fin");
      return;
    }

    addRange({
      days: newRangeDays,
      startTime: newRangeStartTime,
      endTime: newRangeEndTime,
    });

    setNewRangeDays([]);
    setNewRangeStartTime("09:00");
    setNewRangeEndTime("12:00");
    toast.success("Rango agregado");
  };

  const handleAddOverride = () => {
    if (!newOverrideDate) {
      toast.error("Selecciona una fecha");
      return;
    }
    if (newOverrideStartTime >= newOverrideEndTime) {
      toast.error("La hora de inicio debe ser menor a la hora de fin");
      return;
    }

    addOverride({
      date: newOverrideDate,
      startTime: newOverrideStartTime,
      endTime: newOverrideEndTime,
    });

    setNewOverrideDate("");
    setNewOverrideStartTime("09:00");
    setNewOverrideEndTime("12:00");
    toast.success("Anulación agregada");
  };

  const handleSave = async () => {
    const success = await useAvailabilityStore.getState().saveAvailability(
      empleadoId,
      ranges,
      overrides
    );
    if (success) {
      toast.success("Disponibilidades guardadas correctamente");
      onOpenChange(false);
    }
  };

  const toggleDay = (day: number) => {
    setNewRangeDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const formatDayLabel = (days: number[]) => {
    if (days.length === 0) return "Sin días";
    if (days.length === 7) return "Todos los días";
    return days
      .sort((a, b) => a - b)
      .map((d) => DAYS_OF_WEEK[d]?.label || d.toString())
      .join(", ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configurar Disponibilidad
          </DialogTitle>
          <DialogDescription>
            Define los horarios de disponibilidad y las anulaciones para este
            empleado. Los cambios se aplicarán inmediatamente.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horarios de Disponibilidad
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={ranges.length === 0 || isSaving}
              >
                Limpiar todo
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : ranges.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                No hay horarios configurados
              </p>
            ) : (
              <div className="space-y-2">
                {ranges.map((range, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {range.days.map((day) => (
                          <span
                            key={day}
                            className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary text-xs rounded"
                          >
                            {DAYS_OF_WEEK[day]?.label.charAt(0)}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm">
                        {range.startTime} - {range.endTime}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRange(index)}
                      disabled={isSaving}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="text-sm font-medium">Agregar horario</h4>

              <div className="space-y-2">
                <Label className="text-xs">Días</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={cn(
                        "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                        newRangeDays.includes(day.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {day.label.charAt(0)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {newRangeDays.length > 0
                    ? formatDayLabel(newRangeDays)
                    : "Selecciona los días"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="range-start" className="text-xs">
                    Hora inicio
                  </Label>
                  <Input
                    id="range-start"
                    type="time"
                    value={newRangeStartTime}
                    onChange={(e) => setNewRangeStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="range-end" className="text-xs">
                    Hora fin
                  </Label>
                  <Input
                    id="range-end"
                    type="time"
                    value={newRangeEndTime}
                    onChange={(e) => setNewRangeEndTime(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleAddRange}
                disabled={newRangeDays.length === 0 || isSaving}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar horario
              </Button>
            </div>
          </div>

          <div className="border-t" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Anulaciones (días no laborables)
              </h3>
            </div>

            {overrides.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                No hay anulaciones configuradas
              </p>
            ) : (
              <div className="space-y-2">
                {overrides.map((override, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{override.date}</span>
                      <span className="text-sm text-muted-foreground">
                        {override.startTime} - {override.endTime}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOverride(index)}
                      disabled={isSaving}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="text-sm font-medium">Agregar anulación</h4>

              <div className="space-y-2">
                <Label htmlFor="override-date" className="text-xs">
                  Fecha
                </Label>
                <Input
                  id="override-date"
                  type="date"
                  value={newOverrideDate}
                  onChange={(e) => setNewOverrideDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="override-start" className="text-xs">
                    Hora inicio
                  </Label>
                  <Input
                    id="override-start"
                    type="time"
                    value={newOverrideStartTime}
                    onChange={(e) => setNewOverrideStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="override-end" className="text-xs">
                    Hora fin
                  </Label>
                  <Input
                    id="override-end"
                    type="time"
                    value={newOverrideEndTime}
                    onChange={(e) => setNewOverrideEndTime(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleAddOverride}
                disabled={!newOverrideDate || isSaving}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar anulación
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
