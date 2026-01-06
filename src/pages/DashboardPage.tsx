// src/pages/DashboardPage.tsx
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { MonthView } from "@/components/MonthView";
import { DaySidebar } from "@/components/DaySidebar";
import { Sidebar } from "@/components/Sidebar";
import { AvailabilityEditor } from "@/components/availability/AvailabilityEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Calendar } from "lucide-react";
import { useAppointmentStore } from "@/store/appointmentStore";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { useHotkeys } from "@/hooks/useHotkeys";
import { toast } from "sonner";

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAvailability, setShowAvailability] = useState(false);
  const { fetchAppointments, appointments } = useAppointmentStore();

  const {
    availabilityConfig,
    isLoading,
    isError,
    error,
    handleSaveAvailability,
    handleCreateAvailability,
    handleDeleteAvailability,
    handleOverrideSave,
    handleOverrideDelete,
    isSaving,
    isCreating,
    isDeleting,
  } = useAvailabilityData();

  // Keyboard shortcuts
  useHotkeys("n", () => {
    toast.info("Presiona en un día para crear un nuevo turno");
  });
  useHotkeys("escape", () => setShowAvailability(false));
  useHotkeys("d", () => setShowAvailability(false));
  useHotkeys("c", () => setShowAvailability(true));

  // Cargar citas al cambiar la fecha
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
            {/* Header with availability toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                  Panel de Control
                </h1>
                <Button
                  variant={showAvailability ? "default" : "outline"}
                  onClick={() => setShowAvailability(!showAvailability)}
                  className="flex items-center gap-2"
                  disabled={
                    isLoading ||
                    isSaving ||
                    isCreating ||
                    isDeleting
                  }
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

            {/* Content based on selected view */}
            {showAvailability ? (
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Disponibilidad</CardTitle>
                </CardHeader>
                <CardContent>
                  {isError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 text-sm">
                        Error al cargar la disponibilidad: {error?.message}
                      </p>
                    </div>
                  )}
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">
                        Cargando disponibilidad...
                      </span>
                    </div>
                  ) : (
                  <AvailabilityEditor
                      config={availabilityConfig}
                      onChange={handleSaveAvailability}
                      onCreate={handleCreateAvailability}
                      onDelete={handleDeleteAvailability}
                      onOverrideSave={handleOverrideSave}
                      onOverrideDelete={handleOverrideDelete}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <MonthView
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            )}
          </div>

          {/* Only show DaySidebar when in calendar view */}
          {!showAvailability && (
            <DaySidebar
              selectedDate={selectedDate}
              appointments={appointments}
            />
          )}
        </main>
      </div>
    </div>
  );
}
