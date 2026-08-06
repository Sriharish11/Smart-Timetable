import { useState } from "react";
import { Save, Clock } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import { getConfig, saveConfig } from "@/lib/store";
import type { AppConfig, TimeSlot } from "@/types";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Config() {
  const [config, setConfig] = useState<AppConfig>(getConfig());

  function toggleDay(day: string) {
    const has = config.workingDays.includes(day);
    const workingDays = has
      ? config.workingDays.filter((d) => d !== day)
      : ALL_DAYS.filter((d) => config.workingDays.includes(d) || d === day);
    setConfig({ ...config, workingDays });
  }

  function setPeriods(n: number) {
    const periodsPerDay = Math.max(1, Math.min(12, n));
    const slots: TimeSlot[] = Array.from({ length: periodsPerDay }, (_, i) => {
      const existing = config.timeSlots.find((t) => t.period === i + 1);
      return existing ?? { period: i + 1, start: "09:00", end: "09:50" };
    });
    setConfig({ ...config, periodsPerDay, timeSlots: slots });
  }

  function updateSlot(period: number, field: "start" | "end", value: string) {
    setConfig({
      ...config,
      timeSlots: config.timeSlots.map((t) => (t.period === period ? { ...t, [field]: value } : t)),
    });
  }

  function save() {
    if (config.workingDays.length === 0) {
      toast.error("Select at least one working day.");
      return;
    }
    if (config.lunchAfterPeriod < 1 || config.lunchAfterPeriod >= config.periodsPerDay) {
      toast.error("Lunch break must be after a valid period.");
      return;
    }
    saveConfig(config);
    toast.success("Academic configuration saved.");
  }

  return (
    <div>
      <PageHeader
        title="Working Days & Time Configuration"
        subtitle="Set active days, periods per day, lunch break and time slots."
        action={<button className="stm-btn-primary" onClick={save}><Save className="h-4 w-4" /> Save Config</button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="stm-card p-5 lg:col-span-1">
          <h2 className="mb-4 font-bold text-navy">Working Days</h2>
          <div className="space-y-2">
            {ALL_DAYS.map((day) => (
              <label key={day} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                <input type="checkbox" checked={config.workingDays.includes(day)} onChange={() => toggleDay(day)} className="h-4 w-4 accent-royal" />
                <span className="text-sm text-slate-700">{day}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="stm-label">Periods per Day</label>
              <input type="number" min={1} max={12} className="stm-input" value={config.periodsPerDay} onChange={(e) => setPeriods(Number(e.target.value))} />
            </div>
            <div>
              <label className="stm-label">Lunch Break After Period</label>
              <input type="number" min={1} max={config.periodsPerDay - 1} className="stm-input" value={config.lunchAfterPeriod} onChange={(e) => setConfig({ ...config, lunchAfterPeriod: Number(e.target.value) })} />
            </div>
          </div>
        </div>

        <div className="stm-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-royal" />
            <h2 className="font-bold text-navy">Time Slots</h2>
          </div>
          <div className="space-y-3">
            {config.timeSlots.map((slot) => (
              <div key={slot.period} className="grid grid-cols-[80px_1fr_1fr] items-center gap-3">
                <span className="stm-badge bg-navy/10 text-navy">Period {slot.period}</span>
                <div>
                  <label className="stm-label">Start</label>
                  <input type="time" className="stm-input" value={slot.start} onChange={(e) => updateSlot(slot.period, "start", e.target.value)} />
                </div>
                <div>
                  <label className="stm-label">End</label>
                  <input type="time" className="stm-input" value={slot.end} onChange={(e) => updateSlot(slot.period, "end", e.target.value)} />
                </div>
                {slot.period === config.lunchAfterPeriod && (
                  <div className="col-span-3 rounded-lg bg-amber-50 px-3 py-1.5 text-center text-xs font-medium text-amber-700">
                    ↑ Lunch break follows this period
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
