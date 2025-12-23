import { useState, useEffect } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Clock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAppointmentStore } from "@/store/appointmentStore";
import { EditAppointmentForm } from "@/components/EditAppointmentForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Appointment } from "@/types";
import { toast } from "sonner";

interface DaySidebarProps {
  selectedDate: Date;
  appointments: Appointment[];
  // onAddAppointment: () => void;
}

export function DaySidebar({
  selectedDate,
  appointments,
}: // onAddAppointment,
DaySidebarProps) {
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(
    null
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");

  const {
    availableSlots,
    isLoadingSlots,
    fetchAvailableSlots,
    createAppointmentFromSlot,
    updateAppointmentStatus,
    cancelAppointment,
    error,
    isLoading,
    lastUpdated,
  } = useAppointmentStore();

  const dayAppointments = appointments
    .filter((appt) => isSameDay(parseISO(appt.date), selectedDate))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Fetch available slots when selected date changes or appointments are updated
  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [selectedDate, lastUpdated, fetchAvailableSlots]);

  const handleSlotClick = (slot: string) => {
    setSelectedSlot(slot);
    setBookingDialogOpen(true);
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !patientName || !patientPhone) return;

    const success = await createAppointmentFromSlot(
      selectedSlot,
      patientName,
      patientPhone
    );

    if (success) {
      setBookingDialogOpen(false);
      setPatientName("");
      setPatientPhone("");
      setSelectedSlot(null);
    }
  };

  const handleStatusUpdate = async (
    appointmentId: number,
    newStatus: string
  ) => {
    let success = false;

    if (newStatus === "cancelado") {
      // Mostrar diálogo de confirmación personalizado
      setAppointmentToCancel(appointmentId);
      setConfirmDialogOpen(true);
      return;
    } else {
      success = await updateAppointmentStatus(appointmentId, newStatus);
    }

    if (success) {
      toast.success("Estado del turno actualizado");
    }
  };

  const handleConfirmCancel = async () => {
    if (appointmentToCancel) {
      const success = await cancelAppointment(appointmentToCancel, "cancelado");
      if (success) {
        toast.success("Turno cancelado");
      }
    }
    setConfirmDialogOpen(false);
    setAppointmentToCancel(null);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditDialogOpen(true);
  };

  const formatSlotTime = (slot: string) => {
    const date = new Date(slot);
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <>
      <div className="w-80 border-l border-cal-gray-200 p-6 flex flex-col bg-white">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-cal-gray-900">
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </h2>
          <p className="text-sm text-cal-gray-500 mt-1">
            {format(selectedDate, "PPPP", { locale: es })}
          </p>
        </div>

        {/* <Button
          onClick={onAddAppointment}
          className="w-full mb-4 bg-cal-primary hover:bg-cal-primary-dark"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo turno
        </Button> */}

        {/* Available Slots Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-cal-gray-700 mb-3">
            Horarios disponibles
          </h3>
          {isLoadingSlots ? (
            <div className="text-center text-cal-gray-500 py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cal-primary mx-auto"></div>
              <p className="text-sm mt-2">Cargando horarios...</p>
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {availableSlots.map((slot) => (
                <Button
                  key={slot}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSlotClick(slot)}
                  className="h-10 text-sm border-cal-gray-300 hover:bg-cal-primary hover:text-white hover:border-cal-primary transition-colors"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {formatSlotTime(slot)}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-cal-gray-500 text-center py-4">
              No hay horarios disponibles para este día
            </p>
          )}
        </div>

        {/* Existing Appointments */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-cal-gray-700 mb-3">
            Turnos programados
          </h3>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {dayAppointments.length === 0 ? (
              <div className="text-center text-cal-gray-500 mt-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cal-gray-100 flex items-center justify-center">
                  <Plus className="h-8 w-8 text-cal-gray-400" />
                </div>
                <p>No hay turnos programados para hoy</p>
                <p className="text-sm mt-2">
                  Haz clic en "Nuevo turno" para agregar uno
                </p>
              </div>
            ) : (
              dayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors cursor-pointer hover:shadow-sm",
                    appt.status === "confirmed" &&
                      "border-emerald-200 bg-emerald-50",
                    appt.status === "pending" && "border-amber-200 bg-amber-50",
                    appt.status === "completed" && "border-blue-200 bg-blue-50",
                    appt.status === "cancelled" && "border-gray-200 bg-gray-50"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-cal-gray-900">
                        {appt.patientName}
                      </h3>
                      <p className="text-sm text-cal-gray-600">
                        {appt.treatment}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-cal-gray-900">
                        {appt.startTime}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-cal-gray-100"
                        onClick={() => handleEditAppointment(appt)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cal-gray-600">
                      {appt.profesional}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity",
                            appt.status === "confirmed" &&
                              "bg-emerald-100 text-emerald-800",
                            appt.status === "pending" &&
                              "bg-amber-100 text-amber-800",
                            appt.status === "completed" &&
                              "bg-blue-100 text-blue-800",
                            appt.status === "cancelled" &&
                              "bg-gray-100 text-gray-500"
                          )}
                        >
                          {appt.status === "confirmed" && "Confirmado"}
                          {appt.status === "pending" && "Pendiente"}
                          {appt.status === "completed" && "Completado"}
                          {appt.status === "cancelled" && "Cancelado"}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusUpdate(appt.id, "pendiente")
                          }
                          className="text-xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                          Pendiente
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(appt.id, "si")}
                          className="text-xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                          Confirmado
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusUpdate(appt.id, "finalizado")
                          }
                          className="text-xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                          Completado
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusUpdate(appt.id, "cancelado")
                          }
                          className="text-xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                          Cancelado
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {appt.notes && (
                    <p className="mt-2 text-sm text-cal-gray-600">
                      {appt.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar nuevo turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSlot && (
              <div className="p-3 bg-cal-gray-50 rounded-lg">
                <p className="text-sm text-cal-gray-600">
                  Horario seleccionado
                </p>
                <p className="font-semibold text-cal-gray-900">
                  {format(parseISO(selectedSlot), "EEEE d 'de' MMMM", {
                    locale: es,
                  })}
                </p>
                <p className="text-cal-gray-900">
                  {formatSlotTime(selectedSlot)} hs
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="patientName">Nombre del paciente</Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ingrese el nombre"
                className="border-cal-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientPhone">Teléfono de contacto</Label>
              <Input
                id="patientPhone"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="Ingrese el teléfono"
                className="border-cal-gray-300"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setBookingDialogOpen(false)}
                className="flex-1 border-cal-gray-300"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBookAppointment}
                disabled={!patientName || !patientPhone || isLoading}
                className="flex-1 bg-cal-primary hover:bg-cal-primary-dark"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Agendando...
                  </>
                ) : (
                  <>Confirmar turno</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <EditAppointmentForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        appointment={selectedAppointment}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmCancel}
        title="¿Cancelar turno?"
        description="¿Estás seguro que deseas cancelar este turno? Esta acción no se puede deshacer."
        confirmText="Sí, cancelar"
        cancelText="No, volver"
      />
    </>
  );
}
