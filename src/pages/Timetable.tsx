import { Fragment, useMemo, useState } from "react";
import { Wand2, Printer, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import { db, getConfig } from "@/lib/store";
import { generateTimetable } from "@/lib/scheduler";
import { getSession } from "@/lib/auth";
import type { TimetableEntry } from "@/types";

type ViewMode = "class" | "faculty" | "room";

export default function Timetable() {
  const session = getSession();
  const isAdmin = session?.role === "admin";
  const config = getConfig();

  const staff = db.staff.all();
  const subjects = db.subjects.all();
  const classes = db.classes.all();
  const rooms = db.rooms.all();

  const [entries, setEntries] = useState<TimetableEntry[]>(db.timetable.all());
  const [mode, setMode] = useState<ViewMode>(isAdmin ? "class" : "faculty");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [staffId, setStaffId] = useState(session?.staffId ?? staff[0]?.id ?? "");
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [conflicts, setConflicts] = useState(0);

  const subjectOf = (id: string) => subjects.find((s) => s.id === id);
  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? "—";
  const roomNo = (id: string) => rooms.find((r) => r.id === id)?.number ?? "—";
  const classLabel = (id: string) => {
    const c = classes.find((x) => x.id === id);
    return c ? `Year ${c.year} - Sec ${c.section}` : "—";
  };

  function handleGenerate() {
    const allocations = db.allocations.all();
    if (allocations.length === 0) {
      toast.error("Create faculty–subject allocations first.");
      return;
    }
    const result = generateTimetable(classes, allocations, subjects, rooms, staff, config);
    db.timetable.setAll(result.entries);
    setEntries(result.entries);
    setConflicts(result.unplaced.length);
    if (result.unplaced.length === 0) {
      toast.success("Conflict-free timetable generated successfully.");
    } else {
      toast.warning(`Generated with ${result.unplaced.length} unplaced session(s). Adjust resources or slots.`);
    }
  }

  function handleClear() {
    db.timetable.setAll([]);
    setEntries([]);
    setConflicts(0);
    toast.success("Timetable cleared.");
  }

  const filtered = useMemo(() => {
    if (mode === "class") return entries.filter((e) => e.classId === classId);
    if (mode === "faculty") return entries.filter((e) => e.staffId === staffId);
    return entries.filter((e) => e.roomId === roomId);
  }, [entries, mode, classId, staffId, roomId]);

  const cell = (day: string, period: number) => filtered.find((e) => e.day === day && e.period === period);

  const heading =
    mode === "class" ? classLabel(classId) : mode === "faculty" ? staffName(staffId) : `Room ${roomNo(roomId)}`;

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Auto-generate and view conflict-free weekly schedules."
        action={
          isAdmin ? (
            <div className="flex gap-2">
              <button className="stm-btn-primary" onClick={handleGenerate}><Wand2 className="h-4 w-4" /> Generate</button>
              <button className="stm-btn-ghost" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
              <button className="stm-btn-danger" onClick={handleClear}><Trash2 className="h-4 w-4" /></button>
            </div>
          ) : (
            <button className="stm-btn-ghost" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
          )
        }
      />

      {isAdmin && (
        <div className="mb-4 flex flex-wrap items-center gap-2 no-print">
          {(["class", "faculty", "room"] as ViewMode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`stm-btn capitalize ${mode === m ? "bg-navy text-white" : "bg-white ring-1 ring-slate-300 text-slate-600"}`}>
              By {m}
            </button>
          ))}
          <div className="ml-auto">
            {mode === "class" && (
              <select className="stm-input" value={classId} onChange={(e) => setClassId(e.target.value)}>
                {classes.map((c) => <option key={c.id} value={c.id}>{classLabel(c.id)}</option>)}
              </select>
            )}
            {mode === "faculty" && (
              <select className="stm-input" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            {mode === "room" && (
              <select className="stm-input" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.number}</option>)}
              </select>
            )}
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm no-print ${conflicts === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          {conflicts === 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          {conflicts === 0
            ? "No conflicts detected — every teacher, class and room is uniquely assigned."
            : `${conflicts} session(s) could not be placed. Add rooms, relax limits, or add working days.`}
        </div>
      )}

      <div id="print-area" className="stm-card overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <h2 className="font-bold text-navy">Weekly Timetable — {heading}</h2>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            {isAdmin ? "No schedule yet. Click Generate to build the timetable." : "No schedule assigned yet."}
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr>
                  <th className="border border-slate-200 bg-navy p-2 text-white">Period</th>
                  {config.workingDays.map((d) => (
                    <th key={d} className="border border-slate-200 bg-navy p-2 text-white">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {config.timeSlots.map((slot) => (
                  <Fragment key={slot.period}>
                    <tr>
                      <td className="border border-slate-200 bg-slate-50 p-2">
                        <div className="font-bold text-navy">P{slot.period}</div>
                        <div className="text-[10px] text-slate-500">{slot.start}–{slot.end}</div>
                      </td>
                      {config.workingDays.map((day) => {
                        const e = cell(day, slot.period);
                        const subj = e ? subjectOf(e.subjectId) : undefined;
                        return (
                          <td key={day} className="border border-slate-200 p-1.5 align-top">
                            {e ? (
                              <div className={`rounded-md p-1.5 ${subj?.type === "lab" ? "bg-purple-50" : "bg-blue-50"}`}>
                                <div className="font-semibold text-navy">{subj?.code}</div>
                                <div className="text-[10px] text-slate-600">
                                  {mode === "faculty" ? classLabel(e.classId) : staffName(e.staffId)}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {mode === "room" ? classLabel(e.classId) : roomNo(e.roomId)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {slot.period === config.lunchAfterPeriod && (
                      <tr>
                        <td colSpan={config.workingDays.length + 1} className="border border-slate-200 bg-amber-50 p-1.5 text-[11px] font-semibold text-amber-700">
                          LUNCH BREAK
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
