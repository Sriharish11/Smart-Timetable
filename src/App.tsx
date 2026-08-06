import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ProtectedRoute, RequireAdmin } from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Departments from "@/pages/Departments";
import StaffPage from "@/pages/Staff";
import Subjects from "@/pages/Subjects";
import Classes from "@/pages/Classes";
import Rooms from "@/pages/Rooms";
import Allocations from "@/pages/Allocations";
import Config from "@/pages/Config";
import Timetable from "@/pages/Timetable";
import NotFound from "@/pages/NotFound";
import { seedIfEmpty } from "@/lib/store";

export default function App() {
  useEffect(() => {
    seedIfEmpty();
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/departments" element={<RequireAdmin><Departments /></RequireAdmin>} />
          <Route path="/staff" element={<RequireAdmin><StaffPage /></RequireAdmin>} />
          <Route path="/subjects" element={<RequireAdmin><Subjects /></RequireAdmin>} />
          <Route path="/classes" element={<RequireAdmin><Classes /></RequireAdmin>} />
          <Route path="/rooms" element={<RequireAdmin><Rooms /></RequireAdmin>} />
          <Route path="/allocations" element={<RequireAdmin><Allocations /></RequireAdmin>} />
          <Route path="/config" element={<RequireAdmin><Config /></RequireAdmin>} />
          <Route path="/timetable" element={<Timetable />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
