import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Copy,
  Plus,
  Edit2,
  Info,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import type {
  DayAvailability,
  DateOverride,
  TimeRange,
  AvailabilityConfig,
} from "@/types/availability";
import { DAYS_OF_WEEK } from "@/types/availability";

interface AvailabilityEditorProps {
  config: AvailabilityConfig;
  onChange: (config: AvailabilityConfig) => void;
  onCreate?: (
    days: number[],
    startTime: string,
    endTime: string
  ) => Promise<void> | void;
  onUpdate?: (
    availabilityId: number,
    days: number[],
    startTime: string,
    endTime: string
  ) => Promise<void> | void;
  onDelete?: () => void;
  onOverrideSave?: (
    override: DateOverride,
    originalOverride: DateOverride | null
  ) => Promise<void> | void;
  onOverrideDelete?: (override: DateOverride) => Promise<void> | void;
}

export function AvailabilityEditor({
  config,
  onChange,
  onCreate,
  onUpdate,
  onOverrideSave,
  onOverrideDelete,
}: AvailabilityEditorProps) {
  const [editingOverride, setEditingOverride] = useState<DateOverride | null>(
    null
  );
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [copyDialogData, setCopyDialogData] = useState<{
    sourceDayIndex: number;
    dayName: string;
    timeRanges: Array<{ start: string; end: string }>;
  } | null>(null);
  const [localConfig, setLocalConfig] = useState<AvailabilityConfig>(config);

  // Update local config when external config changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  let overrideIdSeed = 0;
  let timeRangeIdSeed = 0;

  const getNextOverrideId = () => {
    overrideIdSeed += 1;
    return `override-${overrideIdSeed}`;
  };

  const getNextRangeId = () => {
    timeRangeIdSeed += 1;
    return `range-${timeRangeIdSeed}`;
  };

  const updateDayAvailability = (
    dayIndex: number,
    updates: Partial<DayAvailability>
  ) => {
    const newDailyAvailability = config.dailyAvailability.map((day, index) =>
      index === dayIndex ? { ...day, ...updates } : day
    );
    onChange({ ...config, dailyAvailability: newDailyAvailability });
  };

  const removeTimeRange = (dayIndex: number, rangeId: string) => {
    const day = config.dailyAvailability[dayIndex];
    const newTimeRanges = day.timeRanges.filter(
      (range) => range.id !== rangeId
    );
    updateDayAvailability(dayIndex, { timeRanges: newTimeRanges });
  };

  const copyDayAvailability = (sourceDayIndex: number) => {
    const sourceDay = config.dailyAvailability[sourceDayIndex];

    if (!sourceDay.enabled) return;

    const sourceDayName = DAYS_OF_WEEK[sourceDayIndex].name;

    // Set dialog data and open dialog
    setCopyDialogData({
      sourceDayIndex,
      dayName: sourceDayName,
      timeRanges: sourceDay.timeRanges.map((range) => ({
        start: range.start,
        end: range.end,
      })),
    });
    setIsOverrideDialogOpen(true);
  };

  const pasteDayAvailability = (targetDayIndex: number) => {
    if (!copyDialogData) return;

    const newTimeRanges = copyDialogData.timeRanges.map(
      (range, index: number) => ({
        ...range,
        id: `${targetDayIndex}-${Date.now()}-${index}`,
      })
    );

    updateDayAvailability(targetDayIndex, {
      enabled: true,
      timeRanges: newTimeRanges,
    });

    // Close dialog and reset
    setIsOverrideDialogOpen(false);
    setCopyDialogData(null);
  };

  const addTimeRange = (dayIndex: number, dayId: number) => {
    console.log("=== addTimeRange DEBUG ===");
    console.log("dayIndex:", dayIndex);
    console.log("dayId:", dayId);
    console.log("config:", config);
    console.log("localConfig:", localConfig);
    console.log("dailyAvailability:", localConfig.dailyAvailability);
    console.log("day:", localConfig.dailyAvailability[dayIndex]);

    const day = localConfig.dailyAvailability[dayIndex];
    const newTimeRange: TimeRange = {
      id: `${dayIndex}-${Date.now()}`,
      start: "09:00",
      end: "17:00",
    };

    console.log("newTimeRange:", newTimeRange);
    console.log("day.timeRanges before:", day.timeRanges);

    // Always add locally first for immediate UI feedback
    const updatedTimeRanges = [...day.timeRanges, newTimeRange];
    console.log("updatedTimeRanges:", updatedTimeRanges);

    // Always call POST endpoint when onCreate is available
    if (onCreate) {
      console.log("Using onCreate (POST)");
      console.log("Sending dayId:", dayId);
      onCreate([dayId], newTimeRange.start, newTimeRange.end);
    } else {
      // Fallback to local state only
      console.log("Using local state update (no onCreate)");
      const newLocalConfig = {
        ...localConfig,
        dailyAvailability: localConfig.dailyAvailability.map((day, index) =>
          index === dayIndex ? { ...day, timeRanges: updatedTimeRanges } : day
        ),
      };
      setLocalConfig(newLocalConfig);
    }

    console.log("=== addTimeRange END ===");
  };

  const updateTimeRange = (
    dayIndex: number,
    rangeId: string,
    updates: Partial<TimeRange>,
    dayId: number
  ) => {
    const day = localConfig.dailyAvailability[dayIndex];
    const updatedRange = day.timeRanges.find((range) => range.id === rangeId);

    if (!updatedRange) return;

    const newTimeRange = { ...updatedRange, ...updates };
    console.log("=== updateTimeRange DEBUG ===");
    console.log("dayIndex:", dayIndex);
    console.log("dayId:", dayId);
    console.log("rangeId:", rangeId);
    console.log("updates:", updates);
    console.log("newTimeRange:", newTimeRange);

    // Always update locally first for immediate UI feedback
    const newTimeRanges = day.timeRanges.map((range) =>
      range.id === rangeId ? { ...range, ...updates } : range
    );

    const newLocalConfig = {
      ...localConfig,
      dailyAvailability: localConfig.dailyAvailability.map((day, index) =>
        index === dayIndex ? { ...day, timeRanges: newTimeRanges } : day
      ),
    };
    setLocalConfig(newLocalConfig);

    // Call PATCH endpoint when onUpdate is available and availability exists
    if (onUpdate && config.availabilityId) {
      console.log("Using onUpdate (PATCH)");
      console.log("Sending dayId:", dayId);
      onUpdate(
        config.availabilityId,
        [dayId],
        newTimeRange.start,
        newTimeRange.end
      );
    } else {
      console.log("Local update only (no onUpdate or no availabilityId)");
    }

    console.log("=== updateTimeRange END ===");
  };

  const addDateOverride = () => {
    setEditingOverride(null);
    setIsOverrideDialogOpen(true);
  };

  const updateDateOverride = (
    overrideId: string,
    updates: Partial<DateOverride>
  ) => {
    const newDateOverrides = config.dateOverrides.map((override) =>
      override.id === overrideId ? { ...override, ...updates } : override
    );
    onChange({ ...config, dateOverrides: newDateOverrides });
  };

  const removeDateOverrideLocally = (overrideId: string) => {
    onChange({
      ...config,
      dateOverrides: config.dateOverrides.filter(
        (override) => override.id !== overrideId
      ),
    });
  };

  const persistOverride = async (
    overrideData: DateOverride,
    originalOverride: DateOverride | null
  ) => {
    if (onOverrideSave) {
      await onOverrideSave(overrideData, originalOverride);
    } else if (originalOverride) {
      updateDateOverride(originalOverride.id, overrideData);
    } else {
      onChange({
        ...config,
        dateOverrides: [...config.dateOverrides, overrideData],
      });
    }
  };

  const deleteOverride = async (override: DateOverride) => {
    if (onOverrideDelete) {
      await onOverrideDelete(override);
    } else {
      removeDateOverrideLocally(override.id);
    }
  };

  const formatOverrideDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  };

  const formatTimeRange = (range: TimeRange) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "p.m." : "a.m.";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    return `${formatTime(range.start)} - ${formatTime(range.end)}`;
  };

  return (
    <div className="space-y-6">
      {/* {onDelete && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={!config.availabilityId}
            className="shadow-sm"
          >
            Eliminar disponibilidad
          </Button>
        </div>
      )} */}

      {/* Daily Availability */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Disponibilidad Diaria
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {DAYS_OF_WEEK.map(({ id, name }) => {
            // Convert from 1-7 (DAYS_OF_WEEK) to 0-6 (dailyAvailability array index)
            const dayIndex = id === 7 ? 0 : id - 1; // Sunday(7) -> 0, Monday(1) -> 0, Tuesday(2) -> 1, etc.
            const dayAvailability = localConfig.dailyAvailability[dayIndex];

            return (
              <div
                key={id}
                className={`border rounded-lg transition-all duration-200 ${
                  dayAvailability.enabled
                    ? "border-blue-200 bg-blue-50/30 shadow-sm"
                    : "border-gray-200 bg-gray-50/50"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          dayAvailability.enabled
                            ? "bg-blue-500"
                            : "bg-gray-300"
                        }`}
                      />
                      <Label
                        className={`font-medium ${
                          dayAvailability.enabled
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {name}
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={dayAvailability.enabled}
                        onCheckedChange={(enabled: boolean) =>
                          updateDayAvailability(dayIndex, { enabled })
                        }
                      />
                      {dayAvailability.enabled && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyDayAvailability(dayIndex)}
                          className="h-7 px-3 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          title="Copiar disponibilidad del día"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      )}
                    </div>
                  </div>

                  {dayAvailability.enabled && (
                    <div className="space-y-3 pl-5">
                      {localConfig.dailyAvailability[dayIndex].timeRanges.map(
                        (range) => (
                          <div
                            key={range.id}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="relative">
                                <Input
                                  type="time"
                                  value={range.start}
                                  onChange={(e) =>
                                    updateTimeRange(
                                      dayIndex,
                                      range.id,
                                      {
                                        start: e.target.value,
                                      },
                                      id
                                    )
                                  }
                                  className="w-28 pr-8 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                                  inicio
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-400">
                                <div className="w-8 h-0.5 bg-gray-300 rounded-full" />
                              </div>
                              <div className="relative">
                                <Input
                                  type="time"
                                  value={range.end}
                                  onChange={(e) =>
                                    updateTimeRange(
                                      dayIndex,
                                      range.id,
                                      {
                                        end: e.target.value,
                                      },
                                      id
                                    )
                                  }
                                  className="w-28 pr-8 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                                  fin
                                </span>
                              </div>
                              <span className="text-sm text-gray-600 font-medium px-3 py-1 bg-gray-100 rounded-full">
                                {formatTimeRange(range)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  removeTimeRange(dayIndex, range.id)
                                }
                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                title="Eliminar rango horario"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeRange(dayIndex, id)}
                        className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors py-2"
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Agregar rango horario
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Overrides */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-linear-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Anulaciones de fecha
            </h2>
            <Info className="h-4 w-4 text-amber-600" />
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Agrega fechas cuando tu disponibilidad cambie de tus horas diarias.
          </p>

          <div className="space-y-3">
            {config.dateOverrides.map((override) => (
              <div
                key={override.id}
                className="flex items-center justify-between p-4 bg-amber-50/30 border border-amber-200 rounded-lg hover:bg-amber-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {formatOverrideDate(override.date)}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      {override.timeRanges.map(formatTimeRange).join(", ")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingOverride(override);
                      setIsOverrideDialogOpen(true);
                    }}
                    className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100 transition-colors"
                    title="Editar anulación"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteOverride(override)}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    title="Eliminar anulación"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addDateOverride}
              className="w-full border-dashed border-amber-300 text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-colors py-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar una anulación
            </Button>
          </div>
        </div>
      </div>

      {/* Override Edit Dialog */}
      <Dialog
        open={isOverrideDialogOpen}
        onOpenChange={(open) => {
          setIsOverrideDialogOpen(open);
          if (!open) {
            setCopyDialogData(null);
            setEditingOverride(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl w-full">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">
              {copyDialogData
                ? `Copiar disponibilidad de ${copyDialogData.dayName}`
                : editingOverride
                ? "Editar anulación"
                : "Nueva anulación"}
            </DialogTitle>
          </DialogHeader>
          {copyDialogData ? (
            <div className="space-y-8">
              {/* Source Info Card */}
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
                  <h4 className="text-lg font-semibold text-gray-900">
                    Horarios de {copyDialogData.dayName}
                  </h4>
                </div>
                <div className="space-y-3">
                  {copyDialogData.timeRanges.map((range, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-blue-100 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-mono text-blue-600 font-medium">
                            {range.start}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-0.5 bg-linear-to-r from-blue-200 to-blue-400 rounded-full" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-mono text-blue-600 font-medium">
                            {range.end}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-blue-100 rounded-full">
                        <span className="text-sm font-medium text-blue-700">
                          {formatTimeRange({
                            start: range.start,
                            end: range.end,
                          } as TimeRange)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 text-center">
                  Seleccionar Día Destino
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {DAYS_OF_WEEK.filter(
                    (_, dayIndex) => dayIndex !== copyDialogData.sourceDayIndex
                  ).map(({ id, name }) => (
                    <Button
                      key={id}
                      onClick={() => pasteDayAvailability(id)}
                      className="group relative h-14 px-6 bg-white border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-blue-100 transition-colors duration-200 flex items-center justify-center">
                          <Copy className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                            {name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Click para copiar
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-center pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOverrideDialogOpen(false);
                    setCopyDialogData(null);
                  }}
                  className="px-8 py-3 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors rounded-lg"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <OverrideForm
              override={editingOverride}
              onSave={async (override) => {
                await persistOverride(override, editingOverride);
                setIsOverrideDialogOpen(false);
                setEditingOverride(null);
              }}
              onCancel={() => {
                setIsOverrideDialogOpen(false);
                setEditingOverride(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  interface OverrideFormProps {
    override: DateOverride | null;
    onSave: (override: DateOverride) => Promise<void> | void;
    onCancel: () => void;
  }

  function OverrideForm({ override, onSave, onCancel }: OverrideFormProps) {
    const createDefaultOverride = useCallback(
      () => ({
        id: getNextOverrideId(),
        date: format(new Date(), "yyyy-MM-dd"),
        timeRanges: [{ id: getNextRangeId(), start: "09:00", end: "17:00" }],
      }),
      []
    );

    const [formData, setFormData] = useState<DateOverride>(() =>
      override
        ? {
            ...override,
            timeRanges: override.timeRanges.map((range) => ({ ...range })),
          }
        : createDefaultOverride()
    );
    const [selectedDates, setSelectedDates] = useState<string[]>(() =>
      override ? [override.date] : [formData.date]
    );
    const [calendarMonth, setCalendarMonth] = useState<Date>(
      startOfMonth(parseISO(formData.date))
    );
    const [allDay, setAllDay] = useState(
      formData.timeRanges.length === 1 &&
        formData.timeRanges[0].start === "00:00" &&
        formData.timeRanges[0].end === "23:59"
    );

    useEffect(() => {
      if (override) {
        const cloned = {
          ...override,
          timeRanges: override.timeRanges.map((range) => ({ ...range })),
        };
        setFormData(cloned);
        setSelectedDates([override.date]);
        setCalendarMonth(startOfMonth(parseISO(override.date)));
        setAllDay(
          cloned.timeRanges.length === 1 &&
            cloned.timeRanges[0].start === "00:00" &&
            cloned.timeRanges[0].end === "23:59"
        );
      } else {
        const fresh = createDefaultOverride();
        setFormData(fresh);
        setSelectedDates([fresh.date]);
        setCalendarMonth(startOfMonth(parseISO(fresh.date)));
        setAllDay(false);
      }
    }, [override, createDefaultOverride]);

    const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const monthStart = startOfMonth(calendarMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(startDate, i));
    }

    const handleDaySelect = (day: Date) => {
      const dateString = format(day, "yyyy-MM-dd");
      if (override) {
        setFormData((prev) => ({ ...prev, date: dateString }));
        setSelectedDates([dateString]);
        return;
      }

      setSelectedDates((prev) => {
        if (prev.includes(dateString)) {
          const next = prev.filter((date) => date !== dateString);
          const ensured = next.length > 0 ? next : [dateString];
          setFormData((prevForm) => ({ ...prevForm, date: ensured[0] }));
          return ensured;
        }
        const next = [...prev, dateString];
        setFormData((prevForm) => ({ ...prevForm, date: dateString }));
        return next;
      });
    };

    const addTimeRange = () => {
      setFormData((prev) => ({
        ...prev,
        timeRanges: [
          ...prev.timeRanges,
          { id: getNextRangeId(), start: "09:00", end: "17:00" },
        ],
      }));
    };

    const removeTimeRange = (index: number) => {
      setFormData((prev) => ({
        ...prev,
        timeRanges: prev.timeRanges.filter((_, i) => i !== index),
      }));
    };

    const handleAllDayToggle = (checked: boolean) => {
      setAllDay(checked);
      if (checked) {
        setFormData((prev) => ({
          ...prev,
          timeRanges: [{ id: "all-day", start: "00:00", end: "23:59" }],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          timeRanges: [{ id: getNextRangeId(), start: "09:00", end: "17:00" }],
        }));
      }
    };

    const updateTimeRange = (index: number, updates: Partial<TimeRange>) => {
      setFormData((prev) => ({
        ...prev,
        timeRanges: prev.timeRanges.map((range, i) =>
          i === index ? { ...range, ...updates } : range
        ),
      }));
    };

    const handleSave = async () => {
      const datesToSave = override ? [formData.date] : selectedDates;

      for (const date of datesToSave) {
        const overridePayload: DateOverride = {
          id: override ? formData.id : getNextOverrideId(),
          date,
          timeRanges: formData.timeRanges.map((range) => ({
            ...range,
            id: override ? range.id : getNextRangeId(),
          })),
        };
        await onSave(overridePayload);
      }
    };

    const selectedDateSet = new Set(selectedDates);

    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)] items-start">
          <div className="space-y-3">
            <p className="text-[0.65rem] font-semibold text-cal-gray-500 uppercase tracking-[0.35em]">
              Selecciona las fechas para anular
            </p>
            <div className="bg-[#0f111b] text-white rounded-[30px] p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] space-y-5">
              <div className="flex items-center justify-between text-white">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-lg font-semibold tracking-wide capitalize">
                  {format(calendarMonth, "LLLL yyyy", { locale: es })}
                </div>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2 text-[0.65rem] uppercase tracking-[0.35em] text-white/60">
                {daysOfWeek.map((day) => (
                  <span key={day} className="text-center">
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-[6px] text-sm">
                {days.map((day) => {
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isSelected = selectedDateSet.has(
                    format(day, "yyyy-MM-dd")
                  );
                  return (
                    <button
                      type="button"
                      key={day.toISOString()}
                      onClick={() => handleDaySelect(day)}
                      className={`rounded-[18px] py-2 font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                        isSelected
                          ? "bg-white text-[#0f111b] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.8)]"
                          : isCurrentMonth
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "text-white/25"
                      }`}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-white rounded-[26px] border border-cal-gray-200 p-6 shadow-[0_25px_70px_-45px_rgba(15,17,27,1)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[0.65rem] font-semibold text-cal-gray-500 uppercase tracking-[0.35em]">
                ¿Qué horas estás libre?
              </p>
              <div className="flex items-center gap-2 text-sm text-cal-gray-500">
                <Switch checked={allDay} onCheckedChange={handleAllDayToggle} />
                <span>Marcar como no disponible (Todo el día)</span>
              </div>
            </div>

            <div className="space-y-3">
              {formData.timeRanges.map((range, index) => (
                <div
                  key={range.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 bg-cal-gray-50 rounded-2xl border border-cal-gray-100 px-4 py-3 shadow-inner"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Input
                      type="time"
                      value={range.start}
                      disabled={allDay}
                      onChange={(e) =>
                        updateTimeRange(index, { start: e.target.value })
                      }
                      className="w-28 rounded-xl border-cal-gray-200"
                    />
                    <span className="text-cal-gray-400 font-semibold">-</span>
                    <Input
                      type="time"
                      value={range.end}
                      disabled={allDay}
                      onChange={(e) =>
                        updateTimeRange(index, { end: e.target.value })
                      }
                      className="w-28 rounded-xl border-cal-gray-200"
                    />
                  </div>
                  {!allDay && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeRange(index)}
                      className="h-9 w-9 text-cal-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                      aria-label="Eliminar horario"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {!allDay && (
              <Button
                variant="outline"
                onClick={addTimeRange}
                className="w-full border-dashed border-cal-gray-300 text-cal-gray-600 rounded-2xl py-5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar horario
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-cal-gray-300 rounded-2xl py-5"
          >
            Cerrar
          </Button>
          <Button onClick={handleSave} className="flex-1 rounded-2xl py-5">
            Guardar excepción
          </Button>
        </div>
      </div>
    );
  }
}
