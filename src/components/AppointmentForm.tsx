import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, User, Phone, UserCircle } from "lucide-react";
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
import { useClientStore } from "@/store/clientStore";
import { toast } from "sonner";
import { appointmentFormSchema, type AppointmentFormData } from "@/schemas";
import { TIME_SLOTS } from "@/constants";

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
}

const DEFAULT_VALUES: AppointmentFormData = {
  nombre: "",
  celular: "",
  fecha: "",
  horarioComienzo: "09:00",
  horarioFin: "09:30",
  nombrePeluquero: "Gabriela García",
};

export function AppointmentForm({
  open,
  onOpenChange,
  selectedDate,
}: AppointmentFormProps) {
  const createAppointment = useAppointmentStore(
    (state) => state.createAppointment
  );
  const isLoading = useAppointmentStore((state) => state.isLoading);
  const clients = useClientStore((state) => state.clients);
  const fetchClients = useClientStore((state) => state.fetchClients);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      ...DEFAULT_VALUES,
      fecha: format(selectedDate, "yyyy-MM-dd"),
    },
  });

  useEffect(() => {
    if (open) {
      fetchClients();
      setValue("fecha", format(selectedDate, "yyyy-MM-dd"));
    }
  }, [open, selectedDate, fetchClients, setValue]);

  const handleClientSelect = (celular: string) => {
    const client = clients.find((c) => c.celular === celular);
    if (client) {
      setValue("nombre", client.nombre);
      setValue("celular", client.celular);
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    const fechaDate = parse(data.fecha, "yyyy-MM-dd", new Date());
    const fechaFormateada = format(fechaDate, "dd-MM-yyyy");

    const [horaInicio, minInicio] = data.horarioComienzo.split(":");
    const [horaFin, minFin] = data.horarioFin.split(":");

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
      uidCal: crypto.randomUUID(),
      nombrePeluquero: data.nombrePeluquero,
    };

    const success = await createAppointment(payload);
    if (success) {
      toast.success("Turno creado exitosamente");
      onOpenChange(false);
      reset(DEFAULT_VALUES);
    } else {
      toast.error("Error al crear el turno");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Nuevo Turno
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente existente</Label>
            <select
              id="cliente"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              onChange={(e) => handleClientSelect(e.target.value)}
              value=""
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((client) => (
                <option key={client.celular} value={client.celular}>
                  {client.nombre} - {client.celular}
                </option>
              ))}
            </select>
          </div>

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
            <Label htmlFor="fecha" className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Fecha
            </Label>
            <Input
              id="fecha"
              type="date"
              {...register("fecha")}
              aria-invalid={!!errors.fecha}
            />
            {errors.fecha && (
              <p className="text-xs text-red-500">{errors.fecha.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horarioComienzo" className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Hora inicio
              </Label>
              <select
                id="horarioComienzo"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                {...register("horarioComienzo")}
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
                {...register("horarioFin")}
              >
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {errors.horarioFin && (
                <p className="text-xs text-red-500">{errors.horarioFin.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombrePeluquero" className="flex items-center gap-1">
              <UserCircle className="h-3.5 w-3.5" />
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
              {isLoading ? "Guardando..." : "Crear Turno"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
