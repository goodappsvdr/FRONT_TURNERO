import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { User, Phone, Pencil } from "lucide-react";
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
import { z } from "zod";
import type { Appointment } from "@/types";

interface EditAppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

const editAppointmentSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  celular: z
    .string()
    .min(10, "El celular debe tener al menos 10 dígitos")
    .max(15, "El celular no puede exceder 15 dígitos"),
  nombrePeluquero: z
    .string()
    .min(2, "El nombre del profesional es requerido"),
});

type EditAppointmentFormData = z.infer<typeof editAppointmentSchema>;

const appointmentToFormData = (appointment: Appointment): EditAppointmentFormData => ({
  nombre: appointment.patientName,
  celular: appointment.patientPhone || "",
  nombrePeluquero: appointment.profesional,
});

export function EditAppointmentForm({
  open,
  onOpenChange,
  appointment,
}: EditAppointmentFormProps) {
  const updateAppointmentFull = useAppointmentStore(
    (state) => state.updateAppointmentFull
  );
  const isLoading = useAppointmentStore((state) => state.isLoading);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditAppointmentFormData>({
    resolver: zodResolver(editAppointmentSchema),
  });

  useEffect(() => {
    if (appointment) {
      const formData = appointmentToFormData(appointment);
      reset(formData);
    }
  }, [appointment, reset]);

  if (!appointment) return null;

  const onSubmit = async (data: EditAppointmentFormData) => {
    const fechaDate = parse(appointment.date, "yyyy-MM-dd", new Date());
    const fechaFormateada = format(fechaDate, "dd-MM-yyyy");

    const [horaInicio, minInicio] = appointment.startTime.split(":");
    const [horaFin, minFin] = appointment.endTime.split(":");

    const fechaInicio = new Date(fechaDate);
    fechaInicio.setHours(parseInt(horaInicio), parseInt(minInicio), 0, 0);

    const fechaFinDate = new Date(fechaDate);
    fechaFinDate.setHours(parseInt(horaFin), parseInt(minFin), 0, 0);

    const horarioComienzoISO = format(fechaInicio, "yyyy-MM-dd'T'HH:mm:ss.SSS");
    const horarioFinISO = format(fechaFinDate, "yyyy-MM-dd'T'HH:mm:ss.SSS");

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

    const capitalize = (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1);

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

    const payload = {
      celular: data.celular,
      nombre: data.nombre,
      fecha: fechaFormateada,
      horarioComienzo: horarioComienzoISO,
      horarioFin: horarioFinISO,
      horarioComienzoTexto: capitalize(horarioComienzoTexto),
      horarioFinTexto: capitalize(horarioFinTexto),
      duracionTexto,
      nombrePeluquero: data.nombrePeluquero,
      estado: "pendiente",
    };

    const success = await updateAppointmentFull(appointment.id, payload);
    if (success) {
      toast.success("Turno actualizado exitosamente");
      onOpenChange(false);
    } else {
      toast.error("Error al actualizar el turno");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar Turno
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Nombre
              </Label>
              <Input
                id="nombre"
                {...register("nombre")}
                placeholder="Nombre del paciente"
                aria-invalid={!!errors.nombre}
              />
              {errors.nombre && (
                <p className="text-xs text-red-500">{errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="celular" className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                Celular
              </Label>
              <Input
                id="celular"
                {...register("celular")}
                placeholder="5493573..."
                aria-invalid={!!errors.celular}
              />
              {errors.celular && (
                <p className="text-xs text-red-500">{errors.celular.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombrePeluquero" className="flex items-center gap-1">
              Profesional
            </Label>
            <Input
              id="nombrePeluquero"
              {...register("nombrePeluquero")}
              placeholder="Nombre del profesional"
              aria-invalid={!!errors.nombrePeluquero}
            />
            {errors.nombrePeluquero && (
              <p className="text-xs text-red-500">{errors.nombrePeluquero.message}</p>
            )}
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
