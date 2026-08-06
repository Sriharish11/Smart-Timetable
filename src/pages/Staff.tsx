import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TableToolbar from "@/components/common/TableToolbar";
import { usePagedSearch } from "@/hooks/usePagedSearch";
import { db } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Designation, Staff } from "@/types";

const DESIGNATIONS: Designation[] = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lecturer",
];

const empty = {
  name: "",
  email: "",
  designation: "Assistant Professor" as Designation,
  departmentId: "",
  maxPeriodsPerDay: 5,
};

export default function StaffPage() {
  const [rows, setRows] = useState<Staff[]>(db.staff.all());
  const departments = db.departments.all();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [toDelete, setToDelete] = useState<Staff | null>(null);

  const { q, setQ, page, setPage, paged, totalPages, total } = usePagedSearch(
    rows,
    (s, query) =>
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      s.designation.toLowerCase().includes(query)
  );

  const refresh = () => setRows(db.staff.all());
  const deptName = (id: string) => departments.find((d) => d.id === id)?.code ?? "—";

  function openAdd() {
    setEditing(null);
    setForm({ ...empty, departmentId: departments[0]?.id ?? "" });
    setModal(true);
  }
  function openEdit(s: Staff) {
    setEditing(s);
    setForm({ name: s.name, email: s.email, designation: s.designation, departmentId: s.departmentId, maxPeriodsPerDay: s.maxPeriodsPerDay });
    setModal(true);
  }

  function save() {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name || !email) {
      toast.error("Name and email are required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (!form.departmentId) {
      toast.error("Please select a department.");
      return;
    }
    if (form.maxPeriodsPerDay < 1 || form.maxPeriodsPerDay > 10) {
      toast.error("Max periods/day must be between 1 and 10.");
      return;
    }
    const dup = db.staff.all().find((s) => s.email.toLowerCase() === email && s.id !== editing?.id);
    if (dup) {
      toast.error("A staff member with this email already exists.");
      return;
    }
    if (editing) {
      db.staff.update(editing.id, { ...form, name, email });
      toast.success("Staff updated.");
    } else {
      db.staff.add({ id: uid("stf"), ...form, name, email });
      toast.success("Staff added.");
    }
    refresh();
    setModal(false);
  }

  function confirmDelete() {
    if (!toDelete) return;
    if (db.allocations.all().some((a) => a.staffId === toDelete.id)) {
      toast.error("Cannot delete: staff has subject allocations.");
      setToDelete(null);
      return;
    }
    db.staff.remove(toDelete.id);
    toast.success("Staff deleted.");
    setToDelete(null);
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Staff / Faculty Management"
        subtitle="Manage faculty members, designations and workload limits."
        action={
          <button className="stm-btn-primary" onClick={openAdd} disabled={departments.length === 0}>
            <Plus className="h-4 w-4" /> Add Staff
          </button>
        }
      />

      {departments.length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Create a department first before adding staff.
        </div>
      )}

      <div className="stm-card overflow-hidden">
        <TableToolbar q={q} onSearch={setQ} placeholder="Search staff..." page={page} totalPages={totalPages} total={total} onPage={setPage} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Designation</th>
                <th className="px-5 py-3">Dept</th>
                <th className="px-5 py-3">Max/Day</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-5 py-3 text-slate-600">{s.email}</td>
                  <td className="px-5 py-3 text-slate-600">{s.designation}</td>
                  <td className="px-5 py-3"><span className="stm-badge bg-navy/10 text-navy">{deptName(s.departmentId)}</span></td>
                  <td className="px-5 py-3 text-slate-600">{s.maxPeriodsPerDay}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="stm-btn-ghost px-2 py-1" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></button>
                      <button className="stm-btn-danger px-2 py-1" onClick={() => setToDelete(s)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No staff found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit Staff" : "Add Staff"}
        footer={
          <>
            <button className="stm-btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="stm-btn-primary" onClick={save}>Save</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="stm-label">Full Name</label>
            <input className="stm-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="stm-label">Email (used as faculty login)</label>
            <input className="stm-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="stm-label">Designation</label>
              <select className="stm-input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value as Designation })}>
                {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="stm-label">Department</label>
              <select className="stm-input" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="stm-label">Max Periods / Day</label>
            <input type="number" min={1} max={10} className="stm-input" value={form.maxPeriodsPerDay} onChange={(e) => setForm({ ...form, maxPeriodsPerDay: Number(e.target.value) })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!toDelete} message={`Delete staff "${toDelete?.name}"?`} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
    </div>
  );
}
