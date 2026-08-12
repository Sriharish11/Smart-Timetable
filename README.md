# Smart Timetable Management System

A college-grade **ERP timetable platform** that lets an administrator manage academic
master data (departments, faculty, subjects, classes, rooms) and **auto-generate
conflict-free weekly timetables**, while faculty get a personalized read-only schedule.
Filter the timetable by class, faculty or room, and print it in a clean layout.

> **Status:** Version 1.0 (working MVP). Data is persisted in the browser via
> `localStorage`, so the app is fully functional as a self-contained demo with no
> backend setup required.

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Data Model](#data-model)
7. [Scheduling Engine](#scheduling-engine)
8. [Roles & Authentication](#roles--authentication)
9. [Modules](#modules)
10. [Design System](#design-system)
11. [Getting Started](#getting-started)
12. [Data & Persistence](#data--persistence)
13. [Roadmap](#roadmap)

---

## Overview

**Who uses it:** College academic coordinators / administrators (full control) and
teaching faculty (personal schedule view).

**What it does:** Centralizes all scheduling master data, then runs a deterministic
scheduling algorithm that respects hard constraints (no double-booking of teachers,
classes or rooms; daily teaching limits; consecutive lab blocks). The result is a
filterable, printable weekly matrix.

**Design goal:** A professional, calm and confident "College ERP" experience — navy
and royal-blue palette, sidebar-driven navigation, tabular master data, and a clear
timetable grid.

---

## Key Features

- **Secure role-based access** — Admin (full CRUD + generation) and Faculty (own timetable).
- **Master data CRUD** — Departments, Staff/Faculty, Subjects, Classes, Rooms, and
  Faculty–Subject–Class Allocations, each with search and pagination.
- **Academic configuration** — Configurable working days, periods per day, lunch
  break position, and per-period time slots.
- **Conflict-free auto-generation** — Greedy scheduler that guarantees no teacher /
  class / room clashes, honors max periods per day, and books labs as consecutive blocks.
- **Interactive timetable matrix** — Weekly grid filterable by Class, Faculty, or Room.
- **Print-ready output** — Dedicated print styling for clean timetable handouts.
- **Instant feedback** — Toast notifications, confirmation dialogs before deletes, and
  input validation.
- **Seeded demo data** — Realistic sample departments, staff, subjects, classes and
  rooms on first load.

---

## Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Framework | **React 18.3** | Component-based UI |
| Build tool | **Vite 5.4** | Fast dev server & bundling |
| Language | **TypeScript 5.5** | Type-safe application code |
| Styling | **Tailwind CSS 3.4** | Utility-first styling + custom ERP theme |
| Routing | **React Router DOM 6** | SPA routing & protected routes |
| Icons | **lucide-react** | Consistent outline icon set |
| Notifications | **sonner** | Toast feedback |
| Utilities | **clsx** + **tailwind-merge** | Conditional class composition (`cn()`) |
| Persistence | **Browser `localStorage`** | Client-side data store (V1.0) |

> **Note on environment:** This project runs on the OnSpace web stack
> (React + Vite + TypeScript + Tailwind). It does **not** use PHP/MySQL/XAMPP. When a
> real backend is required, it can be migrated to **OnSpace Cloud** (PostgreSQL,
> Supabase-compatible) for authentication, database and storage.

---

## Architecture

The app is a **single-page application** with a clear separation of concerns:

- **Presentation** — Page components in `src/pages/` and reusable UI in
  `src/components/` (layout shell, common widgets, auth guards).
- **Domain logic** — Framework-agnostic modules in `src/lib/`
  (`store.ts`, `scheduler.ts`, `auth.ts`, `utils.ts`).
- **Types** — Centralized entity contracts in `src/types/`.
- **Routing & guards** — Declared in `src/App.tsx`; `ProtectedRoute` enforces login and
  `RequireAdmin` restricts admin-only pages.

Data flows one way: pages read/write through the `db` collection API in `store.ts`,
which serializes to `localStorage`. The scheduler is a **pure function** — it takes the
current master data plus config and returns timetable entries, making it easy to test
and later swap for a server-side engine.

---

## Project Structure

```
src/
├── App.tsx                     # Routes, guards, toaster, seed-on-mount
├── main.tsx                    # App bootstrap
├── index.css                   # Tailwind layers + ERP component classes
├── types/
│   └── index.ts                # All entity & session interfaces
├── lib/
│   ├── store.ts                # localStorage collections + seed data + config
│   ├── scheduler.ts            # Conflict-free generation engine
│   ├── auth.ts                 # Login/session/logout helpers
│   └── utils.ts                # cn() + uid()
├── hooks/
│   └── usePagedSearch.ts       # Reusable search + pagination hook
├── components/
│   ├── auth/ProtectedRoute.tsx # Route guards (auth + admin)
│   ├── common/                 # Modal, ConfirmDialog, PageHeader, TableToolbar
│   └── layout/                 # AppLayout, Sidebar, Navbar, Footer
└── pages/
    ├── Login.tsx               # Split-screen sign-in
    ├── Dashboard.tsx           # Stat cards + today's overview
    ├── Departments.tsx         # CRUD
    ├── Staff.tsx               # CRUD + search + pagination
    ├── Subjects.tsx            # CRUD (theory/lab, credits, hours)
    ├── Classes.tsx             # CRUD (year, section, strength)
    ├── Rooms.tsx               # CRUD (classroom/lab, capacity)
    ├── Allocations.tsx         # Faculty → Subject → Class mapping
    ├── Config.tsx              # Working days, periods, lunch, time slots
    ├── Timetable.tsx           # Generate + filterable matrix + print
    └── NotFound.tsx            # 404 catch-all
```

---

## Data Model

All entities are defined in `src/types/index.ts` and stored as collections in
`localStorage` (prefix `sttm_`).

| Entity | Key Fields |
| --- | --- |
| **Department** | `name`, `code` |
| **Staff** | `name`, `email`, `designation`, `departmentId`, `maxPeriodsPerDay` |
| **Subject** | `name`, `code`, `type` (theory/lab), `credits`, `weeklyHours`, `semester` |
| **ClassGroup** | `year`, `section`, `departmentId`, `semester`, `strength` |
| **Room** | `number`, `type` (classroom/lab), `capacity` |
| **Allocation** | `staffId`, `subjectId`, `classId`, `semester` |
| **TimetableEntry** | `classId`, `day`, `period`, `subjectId`, `staffId`, `roomId` |
| **AppConfig** | `workingDays`, `periodsPerDay`, `lunchAfterPeriod`, `timeSlots[]` |
| **Session** | `role` (admin/faculty), `username`, `staffId?` |

**Relationships:** Staff → Department; Subject → Semester; Class → Department/Semester;
Allocation ties Staff + Subject + Class together; the scheduler expands allocations into
timetable entries assigned to rooms.

---

## Scheduling Engine

`src/lib/scheduler.ts` implements a **greedy, conflict-free** algorithm.

**Session expansion**
- Theory subject → one session per `weeklyHours` (single period each).
- Lab subject → `ceil(weeklyHours / 2)` blocks, each spanning **2 consecutive periods**.

**Placement order:** Labs are placed first (harder to fit), then theory.

**Hard constraints enforced**
- ✅ No class double-booking
- ✅ No teacher double-booking
- ✅ No room double-booking
- ✅ Teacher `maxPeriodsPerDay` respected
- ✅ Lab blocks never straddle the lunch boundary
- ✅ Rooms matched by type (labs prefer lab rooms, theory prefers classrooms)

**Output:** `{ entries, unplaced }` — successfully scheduled entries plus any sessions
that could not be placed (surfaced to the admin so constraints or resources can be
adjusted).

---

## Roles & Authentication

Authentication is handled client-side in `src/lib/auth.ts` (session in `localStorage`).

| Role | Access | Demo Credentials |
| --- | --- | --- |
| **Admin** | All modules: master data CRUD, config, generation | `admin` / `admin123` |
| **Faculty** | Personalized timetable view only | `[staff email]` / `faculty123` |

Route protection:
- `ProtectedRoute` — redirects unauthenticated users to `/login`.
- `RequireAdmin` — redirects faculty away from admin-only pages to `/timetable`.

---

## Modules

1. **Dashboard** — Stat cards (staff, subjects, classes, rooms) and today's schedule overview.
2. **Departments** — Manage department name & code.
3. **Staff / Faculty** — CRUD with designation, department, and max periods/day.
4. **Subjects** — Theory/Lab toggle, credits, weekly hours, semester.
5. **Classes** — Year, section, department, semester, student strength.
6. **Rooms** — Room number, type (classroom/lab), capacity.
7. **Allocations** — Map Staff → Subject → Class → Semester.
8. **Time Config** — Working days, periods/day, lunch position, per-period time slots.
9. **Timetable** — Generate, clear, filter (class/faculty/room), and print.

---

## Design System

- **Palette:** Navy `#1e3a8a` (primary), Royal Blue `#2563eb` (accent/active),
  Canvas `#f8fafc` (background). Amber used for lunch-break highlights.
- **Layout shell:** Fixed navy sidebar + sticky top navbar + footer; responsive with a
  slide-in sidebar on mobile.
- **Components:** Custom ERP classes (`stm-card`, `stm-btn-primary`, `stm-input`,
  `stm-badge`, `stm-label`) defined in `index.css`.
- **Iconography:** `lucide-react` outline icons, one consistent set.
- **Feedback:** `sonner` toasts for success/errors, confirmation modals before deletes.

---

## Getting Started

This project runs on the standard React + Vite toolchain.

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# build for production
npm run build

# preview the production build
npm run preview
```

On first launch, the app **seeds demo data** automatically. Sign in with the admin
credentials above to explore all modules, or use a seeded staff email to see the
faculty view.

---

## Data & Persistence

- All records live in the browser under keys prefixed with `sttm_`.
- A one-time `seeded` flag prevents re-seeding on subsequent visits.
- To reset the app to a clean state, clear the site's `localStorage` in your browser.

> Because storage is per-browser, data is not shared across devices in V1.0. Migrating
> the `store.ts` collection API to **OnSpace Cloud** enables shared, persistent,
> multi-user data.

---

## Roadmap

- Real backend (OnSpace Cloud / PostgreSQL) for shared, persistent data.
- Server-side authentication with hashed passwords and per-faculty accounts.
- Conflict-detection panel with detailed diagnostics for unplaced sessions.
- PDF/Excel export in addition to print.
- Soft constraints (teacher preferences, balanced daily load, minimized gaps).
- Multi-semester and multi-department timetable orchestration.

---

© Smart Timetable Management System — College ERP. Built with React & OnSpace.
