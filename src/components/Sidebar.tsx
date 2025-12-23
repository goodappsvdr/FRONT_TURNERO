import { memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  // Calendar,
  // Users,
  // BarChart3,
  // Settings,
  ChevronLeft,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  // { icon: Calendar, label: "Turnos", path: "/dashboard", active: true },
  // { icon: Users, label: "Pacientes", path: "/patients" },
  // { icon: BarChart3, label: "Reportes", path: "/reports" },
  // { icon: Settings, label: "Configuración", path: "/settings" },
];

export const Sidebar = memo(function Sidebar({
  collapsed = false,
  onToggle,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-cal-gray-200 flex flex-col transition-all duration-300 z-50 shadow-sm",
        collapsed ? "w-16" : "w-59"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-cal-gray-200">
        <div className="w-9 h-9 bg-cal-primary rounded-lg flex items-center justify-center shrink-0">
          <Stethoscope className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-cal-gray-900 font-bold text-lg tracking-tight">
            Dra.<span className="text-cal-primary">Gabriela García</span>
          </span>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "ml-auto p-1.5 rounded-lg hover:bg-cal-gray-100 text-cal-gray-600 transition-colors",
              collapsed && "mx-auto"
            )}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-cal-primary text-white"
                  : "text-cal-gray-700 hover:bg-cal-gray-100"
              )}
            >
              <item.icon
                className={cn("h-5 w-5 shrink-0", isActive && "text-white")}
              />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-cal-gray-200">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <div className="w-9 h-9 bg-cal-primary/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-cal-primary font-semibold text-sm">MZ</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-cal-gray-900 truncate">
                Dr. Usuario
              </p>
              <p className="text-xs text-cal-gray-500 truncate">Odontólogo</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
});
