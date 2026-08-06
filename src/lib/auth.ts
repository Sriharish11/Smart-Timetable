import type { Session } from "@/types";
import { db } from "@/lib/store";

const KEY = "sttm_session";
const ADMIN = { username: "admin", password: "admin123" };
const FACULTY_PASSWORD = "faculty123";

export function login(username: string, password: string): Session | null {
  const u = username.trim().toLowerCase();

  if (u === ADMIN.username && password === ADMIN.password) {
    const session: Session = { role: "admin", username: ADMIN.username };
    localStorage.setItem(KEY, JSON.stringify(session));
    return session;
  }

  const staff = db.staff.all().find((s) => s.email.toLowerCase() === u);
  if (staff && password === FACULTY_PASSWORD) {
    const session: Session = { role: "faculty", username: staff.email, staffId: staff.id };
    localStorage.setItem(KEY, JSON.stringify(session));
    return session;
  }

  return null;
}

export function logout(): void {
  localStorage.removeItem(KEY);
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function isAuthed(): boolean {
  return getSession() !== null;
}
