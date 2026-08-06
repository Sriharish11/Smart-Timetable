import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  GraduationCap,
  DoorOpen,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { db, getConfig } from "@/lib/store";
import { getSession } from "@/lib/auth";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  to,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  accent: string;
  to: string;
}) {
  return (
    <Link to={to} className="stm-card group flex items-center gap-4 p-5 transition hover:shadow-panel">
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="flex-1">
        <p className="text-2xl font-bold text-navy">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-royal" />
    </Link>
  );
}

export default function Dashboard() {
  const session = getSession();
  const config = getConfig();
  const staff = db.staff.all();
  const subjects = db.subjects.all();
  const classes = db.classes.all();
  const rooms = db.rooms.all();
  const timetable = db.timetable.all();

  const today = DAY_NAMES[new Date().getDay()];

  const todayEntries = useMemo(() => {
    let list = timetable.filter((e) => e.day === today);
    if (session?.role === "faculty" && session.staffId) {
      list = list.filter((e) => e.staffId === session.staffId);
    }
    return list.sort((a, b) => a.period - b.period);
  }, [timetable, today, session]);

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "—";
  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? "—";
  const roomNo = (id: string) => rooms.find((r) => r.id === id)?.number ?? "—";
  const className = (id: string) => {
    const c = classes.find((x) => x.id === id);
    return c ? `Y${c.year}-${c.section}` : "—";
  };
  const slotTime = (p: number) => {
    const s = config.timeSlots.find((t) => t.period === p);
    return s ? `${s.start}–${s.end}` : `P${p}`;
  };

  return (
    <div>
      <PageHeader
        title={session?.role === "admin" ? "Admin Dashboard" : "Faculty Dashboard"}
        subtitle="Overview of academic resources and today's schedule."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Staff" value={staff.length} icon={Users} accent="bg-blue-100 text-royal" to="/staff" />
        <StatCard label="Subjects" value={subjects.length} icon={BookOpen} accent="bg-emerald-100 text-emerald-600" to="/subjects" />
        <StatCard label="Classes" value={classes.length} icon={GraduationCap} accent="bg-amber-100 text-amber-600" to="/classes" />
        <StatCard label="Rooms" value={rooms.length} icon={DoorOpen} accent="bg-purple-100 text-purple-600" to="/rooms" />
      </div>

      <div className="mt-6 stm-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
          <CalendarDays className="h-5 w-5 text-royal" />
          <h2 className="font-bold text-navy">Today&apos;s Schedule — {today}</h2>
        </div>

        {todayEntries.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">
              No classes scheduled for today.{" "}
              <Link to="/timetable" className="font-semibold text-royal hover:underline">
                Generate a timetable
              </Link>{" "}
              to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Class</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Faculty</th>
                  <th className="px-5 py-3">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-navy">P{e.period}</td>
                    <td className="px-5 py-3 text-slate-600">{slotTime(e.period)}</td>
                    <td className="px-5 py-3">{className(e.classId)}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{subjectName(e.subjectId)}</td>
                    <td className="px-5 py-3 text-slate-600">{staffName(e.staffId)}</td>
                    <td className="px-5 py-3">
                      <span className="stm-badge bg-blue-50 text-royal">{roomNo(e.roomId)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
