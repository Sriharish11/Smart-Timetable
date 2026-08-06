import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, Lock, LogIn, User } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const session = login(username, password);
      setLoading(false);
      if (session) {
        toast.success(`Welcome, ${session.role === "admin" ? "Administrator" : "Faculty"}!`);
        navigate(session.role === "admin" ? "/dashboard" : "/timetable", { replace: true });
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
    }, 350);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-royal/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-royal/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-royal">
            <CalendarClock className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-bold">Smart Timetable</p>
            <p className="text-xs text-slate-300">College ERP System</p>
          </div>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">
            Conflict-free scheduling,
            <br /> made effortless.
          </h2>
          <p className="mt-4 max-w-md text-slate-300">
            Manage departments, faculty, subjects, classes and rooms — then auto-generate
            optimized weekly timetables with zero clashes.
          </p>
          <ul className="mt-8 space-y-2 text-sm text-slate-200">
            <li className="flex items-center gap-2">✓ No teacher / class / room double-booking</li>
            <li className="flex items-center gap-2">✓ Consecutive lab blocks &amp; daily limits</li>
            <li className="flex items-center gap-2">✓ Filterable matrix + print &amp; export</li>
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} College ERP</p>
      </div>

      <div className="flex items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white">
              <CalendarClock className="h-6 w-6" />
            </span>
            <h1 className="mt-3 text-xl font-bold text-navy">Smart Timetable</h1>
          </div>

          <div className="stm-card p-6 sm:p-8">
            <h2 className="text-xl font-bold text-navy">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Access your timetable dashboard.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="stm-label" htmlFor="username">Username / Email</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="username"
                    className="stm-input pl-9"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    autoComplete="username"
                  />
                </div>
              </div>
              <div>
                <label className="stm-label" htmlFor="password">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    className="stm-input pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <button type="submit" className="stm-btn-primary w-full" disabled={loading}>
                <LogIn className="h-4 w-4" />
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              <p className="font-semibold text-slate-600">Demo credentials</p>
              <p>Admin — <span className="font-mono">admin / admin123</span></p>
              <p>Faculty — <span className="font-mono">[staff email] / faculty123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
