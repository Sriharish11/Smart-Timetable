import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!getSession()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== "admin") return <Navigate to="/timetable" replace />;
  return <>{children}</>;
}
