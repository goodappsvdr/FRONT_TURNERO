import { useState, useEffect } from "react";
import { format, parse, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, User, Phone, UserCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppointmentStore } from "@/store/appointmentStore";
import { toast } from "sonner";
import type { UpdateTurnoFullPayload } from "@/services/api";
import type { Appointment } from "@/types";

interface EditAppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return [`${hour}:00`, `${hour}:30`];
}).flat();

const STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "si", label: "Confirmado" },
  { value: "finalizado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
];

export function EditAppointmentForm({
  open,
  onOpenChange,
  appointment,
}: EditAppointmentFormProps) {
  const updateAppointmentFull = useAppointmentStore(
    (state) => state.updateAppointmentFull
  );
  const isLoading = useAppointmentStore((state) => state.isLoading);

  const [formData, setFormData] = useState({
    nombre: "",
    celular: "",
    fecha: "",
    horarioComienzo: "09:00",
    horarioFin: "09:30",
    nombrePeluquero: "",
    estado: "pendiente",
  });

  // Cargar datos del turno cuando se abre el modal
  useEffect(() => {
    if (open && appointment) {
      // Mapear estado interno a valor de API
      const mapStatusToApi = (status: Appointment["status"]): string => {
        switch (status) {
          case "confirmed":
            return "si";
          case "completed":
            return "finalizado";
          case "cancelled":
            return "cancelado";
          default:
            return "pendiente";
        }
      };

      setFormData({
        nombre: appointment.patientName,
        celular: appointment.patientPhone || "",
        fecha: appointment.date,
        horarioComienzo: appointment.startTime,
        horarioFin: appointment.endTime,
        nombrePeluquero: appointment.profesional,
        estado: mapStatusToApi(appointment.status),
      });
    }
  }, [open, appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointment) return;

    // Parsear la fecha del formulario (yyyy-MM-dd)
    const fechaDate = parse(formData.fecha, "yyyy-MM-dd", new Date());

    // Formato de fecha para el campo "fecha": dd-MM-yyyy
    const fechaFormateada = format(fechaDate, "dd-MM-yyyy");

    // Crear datetime completo para horarioComienzo y horarioFin
    const [horaInicio, minInicio] = formData.horarioComienzo.split(":");
    const [horaFin, minFin] = formData.horarioFin.split(":");

    const fechaInicio = new Date(fechaDate);
    fechaInicio.setHours(parseInt(horaInicio), parseInt(minInicio), 0, 0);

    const fechaFinDate = new Date(fechaDate);
    fechaFinDate.setHours(parseInt(horaFin), parseInt(minFin), 0, 0);

    // Formato ISO local para horarioComienzo y horarioFin (sin convertir a UTC)
    const horarioComienzoISO = format(fechaInicio, "yyyy-MM-dd'T'HH:mm:ss.SSS");
    const horarioFinISO = format(fechaFinDate, "yyyy-MM-dd'T'HH:mm:ss.SSS");

    // Textos legibles en español (usando la hora local directamente)
    const horarioComienzoTexto = format(
      fechaInicio,
      "EEEE, d 'de' MMMM 'de' yyyy - HH:mm'hs'",
      { locale: es }
    );
    const horarioFinTexto = format(
      fechaFinDate,
      "EEEE, d 'de' MMMM 'de' yyyy - HH:mm'hs'",
      { locale: es }
    );

    // Capitalizar primera letra
    const capitalize = (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1);

    // Calcular duración en minutos
    const duracionMin = differenceInMinutes(fechaFinDate, fechaInicio);
    const horas = Math.floor(duracionMin / 60);
    const minutos = duracionMin % 60;
    let duracionTexto: string;
    if (horas > 0 && minutos > 0) {
      duracionTexto = `${horas}-hora${horas > 1 ? "s" : ""}-${minutos}-minutos`;
    } else if (horas > 0) {
      duracionTexto = `${horas}-hora${horas > 1 ? "s" : ""}`;
    } else {
      duracionTexto = `${minutos}-minutos`;
    }

    const payload: UpdateTurnoFullPayload = {
      celular: formData.celular,
      nombre: formData.nombre,
      fecha: fechaFormateada,
      horarioComienzo: horarioComienzoISO,
      horarioFin: horarioFinISO,
      horarioComienzoTexto: capitalize(horarioComienzoTexto),
      horarioFinTexto: capitalize(horarioFinTexto),
      duracionTexto,
      nombrePeluquero: formData.nombrePeluquero,
      estado: formData.estado,
    };

    const success = await updateAppointmentFull(appointment.id, payload);
    if (success) {
      toast.success("Turno actualizado exitosamente");
      onOpenChange(false);
    } else {
      toast.error("Error al actualizar el turno");
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar Turno
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Nombre
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Nombre del paciente"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="celular" className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                Celular
              </Label>
              <Input
                id="celular"
                value={formData.celular}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, celular: e.target.value }))
                }
                placeholder="5493573..."
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha" className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Fecha
            </Label>
            <Input
              id="fecha"
              type="date"
              value={formData.fecha}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fecha: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="horarioComienzo"
                className="flex items-center gap-1"
              >
                <Clock className="h-3.5 w-3.5" />
                Hora inicio
              </Label>
              <select
                id="horarioComienzo"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={formData.horarioComienzo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    horarioComienzo: e.target.value,
                  }))
                }
                required
              >
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="horarioFin" className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Hora fin
              </Label>
              <select
                id="horarioFin"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={formData.horarioFin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    horarioFin: e.target.value,
                  }))
                }
                required
              >
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profesional" className="flex items-center gap-1">
                <UserCircle className="h-3.5 w-3.5" />
                Profesional
              </Label>
              <Input
                id="profesional"
                value={formData.nombrePeluquero}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    nombrePeluquero: e.target.value,
                  }))
                }
                placeholder="Nombre del profesional"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado" className="flex items-center gap-1">
                Estado
              </Label>
              <select
                id="estado"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={formData.estado}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    estado: e.target.value,
                  }))
                }
                required
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
