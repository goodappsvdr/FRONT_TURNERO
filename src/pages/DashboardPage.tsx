// src/pages/DashboardPage.tsx
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { MonthView } from "@/components/MonthView";
import { DaySidebar } from "@/components/DaySidebar";
import { Sidebar } from "@/components/Sidebar";
import { useAppointmentStore } from "@/store/appointmentStore";

export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { fetchAppointments, appointments } = useAppointmentStore();

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
            <MonthView
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>

          <DaySidebar selectedDate={selectedDate} appointments={appointments} />
        </main>
      </div>
    </div>
  );
}
