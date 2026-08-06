import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  DoorOpen,
  Link2,
  Settings,
  CalendarRange,
  CalendarClock,
} from "lucide-react";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

interface Item {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const ITEMS: Item[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/departments", label: "Departments", icon: Building2, adminOnly: true },
  { to: "/staff", label: "Staff / Faculty", icon: Users, adminOnly: true },
  { to: "/subjects", label: "Subjects", icon: BookOpen, adminOnly: true },
  { to: "/classes", label: "Classes", icon: GraduationCap, adminOnly: true },
  { to: "/rooms", label: "Rooms", icon: DoorOpen, adminOnly: true },
  { to: "/allocations", label: "Allocations", icon: Link2, adminOnly: true },
  { to: "/config", label: "Time Config", icon: Settings, adminOnly: true },
  { to: "/timetable", label: "Timetable", icon: CalendarRange },
];

export default function Sidebar({ role, open }: { role: Role; open: boolean }) {
  const visible = ITEMS.filter((i) => (role === "admin" ? true : !i.adminOnly));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform bg-navy text-slate-100 transition-transform duration-200 lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-royal">
          <CalendarClock className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold">Smart Timetable</p>
          <p className="text-[11px] text-slate-300">Management System</p>
        </div>
      </div>
      <nav className="space-y-1 p-3">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-royal text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-0 w-full border-t border-white/10 p-4 text-[11px] text-slate-400">
        College ERP • v1.0
      </div>
    </aside>
  );
}
