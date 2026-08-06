import type {
  Allocation,
  AppConfig,
  ClassGroup,
  Room,
  Staff,
  Subject,
  TimetableEntry,
} from "@/types";
import { uid } from "@/lib/utils";

interface NeededSession {
  classId: string;
  subjectId: string;
  staffId: string;
  type: "theory" | "lab";
  span: 1 | 2;
}

export interface GenerationResult {
  entries: TimetableEntry[];
  unplaced: { classId: string; subjectId: string; staffId: string }[];
}

/**
 * Greedy conflict-free scheduler.
 * Hard constraints enforced:
 *  - No class double-booking
 *  - No teacher double-booking
 *  - No room double-booking
 *  - Teacher max periods/day respected
 *  - Lab subjects occupy two consecutive periods (not spanning lunch)
 */
export function generateTimetable(
  classes: ClassGroup[],
  allocations: Allocation[],
  subjects: Subject[],
  rooms: Room[],
  staff: Staff[],
  config: AppConfig
): GenerationResult {
  void classes;
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMax = new Map<string, number>();
  staff.forEach((s) => teacherMax.set(s.id, s.maxPeriodsPerDay));
  const days = config.workingDays;
  const periods = Array.from({ length: config.periodsPerDay }, (_, i) => i + 1);
  const lunch = config.lunchAfterPeriod;

  const classBusy = new Set<string>();
  const teacherBusy = new Set<string>();
  const roomBusy = new Set<string>();
  const teacherDayCount = new Map<string, number>();

  const entries: TimetableEntry[] = [];
  const unplaced: GenerationResult["unplaced"] = [];

  // Build required sessions per allocation.
  const sessions: NeededSession[] = [];
  for (const alloc of allocations) {
    const subject = subjectMap.get(alloc.subjectId);
    if (!subject) continue;
    if (subject.type === "lab") {
      const blocks = Math.max(1, Math.ceil(subject.weeklyHours / 2));
      for (let i = 0; i < blocks; i++) {
        sessions.push({ classId: alloc.classId, subjectId: subject.id, staffId: alloc.staffId, type: "lab", span: 2 });
      }
    } else {
      for (let i = 0; i < subject.weeklyHours; i++) {
        sessions.push({ classId: alloc.classId, subjectId: subject.id, staffId: alloc.staffId, type: "theory", span: 1 });
      }
    }
  }

  // Labs first (harder to place), then theory.
  sessions.sort((a, b) => b.span - a.span);

  const classroomRooms = rooms.filter((r) => r.type === "classroom");
  const labRooms = rooms.filter((r) => r.type === "lab");

  const dc = (staffId: string, day: string) => `${staffId}|${day}`;

  function crossesLunch(start: number, span: number): boolean {
    // A 2-period block cannot straddle the lunch boundary.
    return span === 2 && start === lunch;
  }

  function findRoom(type: "theory" | "lab", day: string, period: number, span: number): Room | null {
    const pool = type === "lab" ? labRooms.concat(classroomRooms) : classroomRooms.concat(labRooms);
    for (const room of pool) {
      let ok = true;
      for (let p = period; p < period + span; p++) {
        if (roomBusy.has(`${room.id}|${day}|${p}`)) {
          ok = false;
          break;
        }
      }
      if (ok) return room;
    }
    return null;
  }

  for (const session of sessions) {
    let placed = false;

    for (const day of days) {
      if (placed) break;
      for (const period of periods) {
        if (placed) break;
        if (period + session.span - 1 > config.periodsPerDay) continue;
        if (crossesLunch(period, session.span)) continue;

        // Class + teacher availability for the whole span.
        let free = true;
        for (let p = period; p < period + session.span; p++) {
          if (
            classBusy.has(`${session.classId}|${day}|${p}`) ||
            teacherBusy.has(`${session.staffId}|${day}|${p}`)
          ) {
            free = false;
            break;
          }
        }
        if (!free) continue;

        // Teacher daily limit.
        const usedToday = teacherDayCount.get(dc(session.staffId, day)) ?? 0;
        const max = teacherMax.get(session.staffId) ?? 6;
        if (usedToday + session.span > max) continue;

        const room = findRoom(session.type, day, period, session.span);
        if (!room) continue;

        // Commit.
        for (let p = period; p < period + session.span; p++) {
          classBusy.add(`${session.classId}|${day}|${p}`);
          teacherBusy.add(`${session.staffId}|${day}|${p}`);
          roomBusy.add(`${room.id}|${day}|${p}`);
          entries.push({
            id: uid("tt"),
            classId: session.classId,
            day,
            period: p,
            subjectId: session.subjectId,
            staffId: session.staffId,
            roomId: room.id,
          });
        }
        teacherDayCount.set(dc(session.staffId, day), usedToday + session.span);
        placed = true;
      }
    }

    if (!placed) {
      unplaced.push({ classId: session.classId, subjectId: session.subjectId, staffId: session.staffId });
    }
  }

  return { entries, unplaced };
}
