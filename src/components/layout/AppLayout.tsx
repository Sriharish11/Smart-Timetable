import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSession } from "@/lib/auth";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const session = getSession();
  const role = session?.role ?? "faculty";

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar role={role} open={open} />
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Navbar onToggle={() => setOpen((v) => !v)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
