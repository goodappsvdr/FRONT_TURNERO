import { memo, useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import {
  Clock,
  Phone,
  User,
  CalendarCheck,
  Stethoscope,
  UserCircle,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
  X,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppointmentStore } from "@/store/appointmentStore";
import { EditAppointmentForm } from "@/components/EditAppointmentForm";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Appointment } from "@/types";

interface AppointmentListProps {
  selectedDate: Date;
}

interface DeleteTarget {
  id: number;
  name: string;
}

const statusConfig = {
  pending: {
    label: "Pendiente",
    apiValue: "pendiente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    hoverClassName: "hover:bg-amber-100",
    dotColor: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmado",
    apiValue: "si",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    hoverClassName: "hover:bg-blue-100",
    dotColor: "bg-blue-500",
  },
  completed: {
    label: "Completado",
    apiValue: "completado",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    hoverClassName: "hover:bg-emerald-100",
    dotColor: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelado",
    apiValue: "cancelado",
    className: "bg-red-50 text-red-700 border-red-200",
    hoverClassName: "hover:bg-red-100",
    dotColor: "bg-red-500",
  },
};

type StatusKey = keyof typeof statusConfig;

export const AppointmentList = memo(function AppointmentList({
  selectedDate,
}: AppointmentListProps) {
  const appointments = useAppointmentStore((state) => state.appointments);
  const isLoading = useAppointmentStore((state) => state.isLoading);
  const deleteAppointment = useAppointmentStore(
    (state) => state.deleteAppointment
  );
  const updateAppointmentStatus = useAppointmentStore(
    (state) => state.updateAppointmentStatus
  );

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">("all");
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    const success = await deleteAppointment(deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);

    if (success) {
      toast.success("Turno eliminado correctamente");
    } else {
      toast.error("Error al eliminar el turno");
    }
  };

  const handleStatusChange = async (
    id: number,
    estado: string,
    estadoLabel: string
  ) => {
    const success = await updateAppointmentStatus(id, estado);
    if (success) {
      toast.success(`Turno marcado como ${estadoLabel}`);
    } else {
      toast.error("Error al actualizar el estado");
    }
  };

  const isGlobalSearch = statusFilter !== "all" || searchQuery !== "";

  const filteredAppointments = useMemo(() => {
    let result = appointments;

    // Si hay filtro o búsqueda, mostrar todos. Si no, filtrar por día o semana
    if (!isGlobalSearch) {
      if (viewMode === "week") {
        result = result.filter((apt) => {
          const aptDate = new Date(apt.date + "T12:00:00");
          return isWithinInterval(aptDate, { start: weekStart, end: weekEnd });
        });
      } else {
        result = result.filter((apt) => apt.date === dateStr);
      }
    }

    // Aplicar filtro de estado
    if (statusFilter !== "all") {
      result = result.filter((apt) => apt.status === statusFilter);
    }

    // Aplicar búsqueda
    if (searchQuery !== "") {
      result = result.filter((apt) =>
        apt.patientName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Ordenar por fecha y hora
    return result.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [
    appointments,
    dateStr,
    statusFilter,
    searchQuery,
    isGlobalSearch,
    viewMode,
    weekStart,
    weekEnd,
  ]);

  const formattedDate = format(selectedDate, "EEEE d 'de' MMMM", {
    locale: es,
  });
  const formattedWeek = `${format(weekStart, "d MMM", {
    locale: es,
  })} - ${format(weekEnd, "d MMM", { locale: es })}`;

  const getHeaderTitle = () => {
    if (isGlobalSearch) return "Resultados de búsqueda";
    if (viewMode === "week") return `Semana: ${formattedWeek}`;
    return formattedDate;
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
      <div className="bg-linear-to-r from-primary/5 to-primary/10 px-5 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground capitalize">
                {getHeaderTitle()}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredAppointments.length}{" "}
                {filteredAppointments.length === 1 ? "turno" : "turnos"}
                {isGlobalSearch ? " encontrados" : " programados"}
              </p>
            </div>
          </div>
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("day")}
              className="text-xs h-7 px-3"
            >
              Día
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
              className="text-xs h-7 px-3"
            >
              Semana
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border/30 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="text-xs"
          >
            Todos
          </Button>
          {(Object.keys(statusConfig) as StatusKey[]).map((key) => {
            const config = statusConfig[key];
            return (
              <Button
                key={key}
                variant={statusFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "text-xs gap-1.5",
                  statusFilter !== key && config.className,
                  statusFilter !== key && "border"
                )}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    statusFilter === key ? "bg-white" : config.dotColor
                  )}
                />
                {config.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground mt-4">
              Cargando turnos...
            </p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-muted/50 rounded-full mb-4">
              {isGlobalSearch ? (
                <Search className="h-8 w-8 text-muted-foreground/50" />
              ) : (
                <CalendarCheck className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>
            <p className="text-muted-foreground font-medium">
              {isGlobalSearch
                ? "No se encontraron turnos"
                : "No hay turnos para este día"}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {isGlobalSearch
                ? "Intenta con otra búsqueda o filtro"
                : "Selecciona otra fecha en el calendario"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((appointment, index) => {
              const status = statusConfig[appointment.status];
              return (
                <div
                  key={appointment.id}
                  className={cn(
                    "group relative border rounded-xl p-4 transition-all duration-200",
                    "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5",
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
                      status.dotColor
                    )}
                  />

                  <div className="flex items-start justify-between gap-4 pl-3">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isGlobalSearch && (
                          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
                            <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">
                              {format(
                                new Date(appointment.date + "T12:00:00"),
                                "d MMM",
                                { locale: es }
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm font-semibold text-primary">
                            {appointment.startTime} - {appointment.endTime}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all",
                                status.className,
                                status.hoverClassName
                              )}
                            >
                              {status.label}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="min-w-[140px]"
                          >
                            {(Object.keys(statusConfig) as StatusKey[]).map(
                              (key) => {
                                const config = statusConfig[key];
                                const isCurrentStatus =
                                  key === appointment.status;
                                return (
                                  <DropdownMenuItem
                                    key={key}
                                    onClick={() =>
                                      !isCurrentStatus &&
                                      handleStatusChange(
                                        appointment.id,
                                        config.apiValue,
                                        config.label.toLowerCase()
                                      )
                                    }
                                    className={cn(
                                      "gap-2",
                                      isCurrentStatus && "bg-muted"
                                    )}
                                    disabled={isCurrentStatus}
                                  >
                                    <span
                                      className={cn(
                                        "w-2 h-2 rounded-full",
                                        config.dotColor
                                      )}
                                    />
                                    {config.label}
                                    {isCurrentStatus && (
                                      <CheckCircle2 className="h-3 w-3 ml-auto text-muted-foreground" />
                                    )}
                                  </DropdownMenuItem>
                                );
                              }
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-muted rounded-md">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="font-semibold text-foreground">
                            {appointment.patientName}
                          </span>
                        </div>
                        {appointment.patientPhone && (
                          <a
                            href={`tel:${appointment.patientPhone}`}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            <span>{appointment.patientPhone}</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-primary/70" />
                          <span className="text-sm font-medium text-foreground/80">
                            {appointment.treatment}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <UserCircle className="h-4 w-4" />
                          <span>{appointment.profesional}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditTarget(appointment)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        title="Editar turno"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDeleteClick(
                            appointment.id,
                            appointment.patientName
                          )
                        }
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Eliminar turno"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">
              ¿Eliminar turno?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Estás a punto de eliminar el turno de{" "}
              <strong>{deleteTarget?.name}</strong>.
              <br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditAppointmentForm
        key={editTarget?.id}
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        appointment={editTarget}
      />
    </div>
  );
});
