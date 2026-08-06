import type {
  Allocation,
  AppConfig,
  ClassGroup,
  Department,
  Room,
  Staff,
  Subject,
  TimetableEntry,
} from "@/types";
import { uid } from "@/lib/utils";

const PREFIX = "sttm_";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

function collection<T extends { id: string }>(key: string) {
  return {
    all(): T[] {
      return read<T[]>(key, []);
    },
    get(id: string): T | undefined {
      return read<T[]>(key, []).find((x) => x.id === id);
    },
    add(item: T): T {
      const arr = read<T[]>(key, []);
      arr.push(item);
      write(key, arr);
      return item;
    },
    update(id: string, patch: Partial<T>): void {
      const arr = read<T[]>(key, []);
      const i = arr.findIndex((x) => x.id === id);
      if (i >= 0) {
        arr[i] = { ...arr[i], ...patch };
        write(key, arr);
      }
    },
    remove(id: string): void {
      write(
        key,
        read<T[]>(key, []).filter((x) => x.id !== id)
      );
    },
    setAll(arr: T[]): void {
      write(key, arr);
    },
  };
}

export const db = {
  departments: collection<Department>("departments"),
  staff: collection<Staff>("staff"),
  subjects: collection<Subject>("subjects"),
  classes: collection<ClassGroup>("classes"),
  rooms: collection<Room>("rooms"),
  allocations: collection<Allocation>("allocations"),
  timetable: collection<TimetableEntry>("timetable"),
};

const DEFAULT_CONFIG: AppConfig = {
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  periodsPerDay: 7,
  lunchAfterPeriod: 4,
  timeSlots: [
    { period: 1, start: "09:00", end: "09:50" },
    { period: 2, start: "09:50", end: "10:40" },
    { period: 3, start: "10:50", end: "11:40" },
    { period: 4, start: "11:40", end: "12:30" },
    { period: 5, start: "13:20", end: "14:10" },
    { period: 6, start: "14:10", end: "15:00" },
    { period: 7, start: "15:10", end: "16:00" },
  ],
};

export function getConfig(): AppConfig {
  return read<AppConfig>("config", DEFAULT_CONFIG);
}

export function saveConfig(cfg: AppConfig): void {
  write("config", cfg);
}

export function seedIfEmpty(): void {
  if (localStorage.getItem(PREFIX + "seeded") === "1") return;

  const cse: Department = { id: uid("dep"), name: "Computer Science & Engineering", code: "CSE" };
  const ece: Department = { id: uid("dep"), name: "Electronics & Communication", code: "ECE" };
  db.departments.setAll([cse, ece]);

  const s1: Staff = { id: uid("stf"), name: "Dr. Anita Rao", email: "anita.rao@college.edu", designation: "Professor", departmentId: cse.id, maxPeriodsPerDay: 4 };
  const s2: Staff = { id: uid("stf"), name: "Prof. Vikram Sethi", email: "vikram.sethi@college.edu", designation: "Associate Professor", departmentId: cse.id, maxPeriodsPerDay: 5 };
  const s3: Staff = { id: uid("stf"), name: "Ms. Priya Nair", email: "priya.nair@college.edu", designation: "Assistant Professor", departmentId: cse.id, maxPeriodsPerDay: 5 };
  const s4: Staff = { id: uid("stf"), name: "Mr. Rahul Verma", email: "rahul.verma@college.edu", designation: "Lecturer", departmentId: ece.id, maxPeriodsPerDay: 6 };
  db.staff.setAll([s1, s2, s3, s4]);

  const sub1: Subject = { id: uid("sub"), name: "Data Structures", code: "CS201", type: "theory", credits: 4, weeklyHours: 4, semester: 3 };
  const sub2: Subject = { id: uid("sub"), name: "Database Systems", code: "CS202", type: "theory", credits: 3, weeklyHours: 3, semester: 3 };
  const sub3: Subject = { id: uid("sub"), name: "DBMS Lab", code: "CS202L", type: "lab", credits: 2, weeklyHours: 2, semester: 3 };
  const sub4: Subject = { id: uid("sub"), name: "Operating Systems", code: "CS203", type: "theory", credits: 3, weeklyHours: 3, semester: 3 };
  db.subjects.setAll([sub1, sub2, sub3, sub4]);

  const c1: ClassGroup = { id: uid("cls"), year: 2, section: "A", departmentId: cse.id, semester: 3, strength: 60 };
  const c2: ClassGroup = { id: uid("cls"), year: 2, section: "B", departmentId: cse.id, semester: 3, strength: 58 };
  db.classes.setAll([c1, c2]);

  const r1: Room = { id: uid("rm"), number: "A-101", type: "classroom", capacity: 70 };
  const r2: Room = { id: uid("rm"), number: "A-102", type: "classroom", capacity: 70 };
  const r3: Room = { id: uid("rm"), number: "LAB-1", type: "lab", capacity: 40 };
  db.rooms.setAll([r1, r2, r3]);

  db.allocations.setAll([
    { id: uid("al"), staffId: s1.id, subjectId: sub1.id, classId: c1.id, semester: 3 },
    { id: uid("al"), staffId: s2.id, subjectId: sub2.id, classId: c1.id, semester: 3 },
    { id: uid("al"), staffId: s3.id, subjectId: sub3.id, classId: c1.id, semester: 3 },
    { id: uid("al"), staffId: s2.id, subjectId: sub4.id, classId: c1.id, semester: 3 },
    { id: uid("al"), staffId: s1.id, subjectId: sub1.id, classId: c2.id, semester: 3 },
    { id: uid("al"), staffId: s3.id, subjectId: sub2.id, classId: c2.id, semester: 3 },
  ]);

  saveConfig(DEFAULT_CONFIG);
  localStorage.setItem(PREFIX + "seeded", "1");
}
