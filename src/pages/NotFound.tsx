import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-white">
        <CalendarClock className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-5xl font-bold text-navy">404</h1>
      <p className="mt-2 text-slate-500">The page you are looking for does not exist.</p>
      <Link to="/dashboard" className="stm-btn-primary mt-6">
        Back to Dashboard
      </Link>
    </div>
  );
}
