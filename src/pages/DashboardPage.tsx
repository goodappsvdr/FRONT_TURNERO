// src/pages/DashboardPage.tsx
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { MonthView } from "@/components/MonthView";
import { DaySidebar } from "@/components/DaySidebar";
import { Sidebar } from "@/components/Sidebar";
import { AvailabilityConfig } from "@/components/AvailabilityConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Calendar } from "lucide-react";
import { useAppointmentStore } from "@/store/appointmentStore";
import { useAuthStore } from "@/store/authStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { toast } from "sonner";

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAvailability, setShowAvailability] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const { fetchAppointments, appointments } = useAppointmentStore();
  const { user } = useAuthStore();

  useHotkeys("n", () => {
    toast.info("Presiona en un día para crear un nuevo turno");
  });
  useHotkeys("escape", () => {
    setShowAvailability(false);
    setShowAvailabilityDialog(false);
  });
  useHotkeys("d", () => {
    setShowAvailability(false);
    setShowAvailabilityDialog(false);
  });
  useHotkeys("c", () => {
    setShowAvailabilityDialog(true);
    setShowAvailability(false);
  });

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="flex h-screen bg-cal-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-56">
        <Header />

        <main className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-auto p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                  Panel de Control
                </h1>
                <Button
                  variant={showAvailability ? "default" : "outline"}
                  onClick={() => setShowAvailability(!showAvailability)}
                  className="flex items-center gap-2"
                >
                  {showAvailability ? (
                    <>
                      <Calendar className="h-4 w-4" />
                      Ver Calendario
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4" />
                      Configurar Disponibilidad
                    </>
                  )}
                </Button>
              </div>
            </div>

            {showAvailability ? (
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Disponibilidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Usa el botón "Configurar Disponibilidad" con la tecla "c" para
                    gestionar horarios y anulaciones.
                  </p>
                  <Button
                    onClick={() => setShowAvailabilityDialog(true)}
                    className="w-full mt-4"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Abrir Configuración
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <MonthView
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            )}
          </div>

          {!showAvailability && (
            <DaySidebar
              selectedDate={selectedDate}
              appointments={appointments}
            />
          )}
        </main>
      </div>

      <AvailabilityConfig
        open={showAvailabilityDialog}
        onOpenChange={setShowAvailabilityDialog}
        empleadoId={user?.IdEmpleado ?? 1}
      />
    </div>
  );
}
