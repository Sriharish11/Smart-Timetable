import { LogOut, Menu, ShieldCheck, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSession, logout } from "@/lib/auth";

export default function Navbar({ onToggle }: { onToggle: () => void }) {
  const navigate = useNavigate();
  const session = getSession();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="hidden text-sm font-semibold text-slate-500 sm:block">
          Academic Year 2025-26 • Odd Semester
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-white">
            {session?.role === "admin" ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-semibold text-slate-800">{session?.username}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{session?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="stm-btn-ghost">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
