import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-cal-gray-200 shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2"></div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-cal-gray-700">
            <User className="h-4 w-4" />
            <span className="font-medium">{user?.login}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 border-cal-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </header>
  );
}
