export interface Department {
  id: string;
  name: string;
  code: string;
}

export type Designation =
  | "Professor"
  | "Associate Professor"
  | "Assistant Professor"
  | "Lecturer";

export interface Staff {
  id: string;
  name: string;
  email: string;
  designation: Designation;
  departmentId: string;
  maxPeriodsPerDay: number;
}

export type SubjectType = "theory" | "lab";

export interface Subject {
  id: string;
  name: string;
  code: string;
  type: SubjectType;
  credits: number;
  weeklyHours: number;
  semester: number;
}

export interface ClassGroup {
  id: string;
  year: number;
  section: string;
  departmentId: string;
  semester: number;
  strength: number;
}

export type RoomType = "classroom" | "lab";

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  capacity: number;
}

export interface Allocation {
  id: string;
  staffId: string;
  subjectId: string;
  classId: string;
  semester: number;
}

export interface TimeSlot {
  period: number;
  start: string;
  end: string;
}

export interface AppConfig {
  workingDays: string[];
  periodsPerDay: number;
  lunchAfterPeriod: number;
  timeSlots: TimeSlot[];
}

export interface TimetableEntry {
  id: string;
  classId: string;
  day: string;
  period: number;
  subjectId: string;
  staffId: string;
  roomId: string;
}

export type Role = "admin" | "faculty";

export interface Session {
  role: Role;
  username: string;
  staffId?: string;
}
