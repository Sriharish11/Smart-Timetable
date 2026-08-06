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
import type { ClassGroup } from "@/types";

const empty = { year: 1, section: "A", departmentId: "", semester: 1, strength: 60 };

export default function Classes() {
  const [rows, setRows] = useState<ClassGroup[]>(db.classes.all());
  const departments = db.departments.all();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<ClassGroup | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [toDelete, setToDelete] = useState<ClassGroup | null>(null);

  const deptCode = (id: string) => departments.find((d) => d.id === id)?.code ?? "—";
  const label = (c: ClassGroup) => `${deptCode(c.departmentId)} Y${c.year}-${c.section}`;

  const { q, setQ, page, setPage, paged, totalPages, total } = usePagedSearch(
    rows,
    (c, query) => label(c).toLowerCase().includes(query) || c.section.toLowerCase().includes(query)
  );

  const refresh = () => setRows(db.classes.all());

  function openAdd() {
    setEditing(null);
    setForm({ ...empty, departmentId: departments[0]?.id ?? "" });
    setModal(true);
  }
  function openEdit(c: ClassGroup) {
    setEditing(c);
    setForm({ year: c.year, section: c.section, departmentId: c.departmentId, semester: c.semester, strength: c.strength });
    setModal(true);
  }

  function save() {
    const section = form.section.trim().toUpperCase();
    if (!section || !form.departmentId) {
      toast.error("Section and department are required.");
      return;
    }
    if (form.strength < 1 || form.strength > 200) {
      toast.error("Strength must be between 1 and 200.");
      return;
    }
    const dup = db.classes.all().find(
      (c) => c.departmentId === form.departmentId && c.year === form.year && c.section.toUpperCase() === section && c.semester === form.semester && c.id !== editing?.id
    );
    if (dup) {
      toast.error("This class already exists.");
      return;
    }
    if (editing) {
      db.classes.update(editing.id, { ...form, section });
      toast.success("Class updated.");
    } else {
      db.classes.add({ id: uid("cls"), ...form, section });
      toast.success("Class added.");
    }
    refresh();
    setModal(false);
  }

  function confirmDelete() {
    if (!toDelete) return;
    if (db.allocations.all().some((a) => a.classId === toDelete.id)) {
      toast.error("Cannot delete: class has allocations.");
      setToDelete(null);
      return;
    }
    db.classes.remove(toDelete.id);
    toast.success("Class deleted.");
    setToDelete(null);
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Class Management"
        subtitle="Manage class groups by year, section, semester and strength."
        action={<button className="stm-btn-primary" onClick={openAdd} disabled={departments.length === 0}><Plus className="h-4 w-4" /> Add Class</button>}
      />

      <div className="stm-card overflow-hidden">
        <TableToolbar q={q} onSearch={setQ} placeholder="Search classes..." page={page} totalPages={totalPages} total={total} onPage={setPage} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Semester</th>
                <th className="px-5 py-3">Strength</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">Year {c.year} — Section {c.section}</td>
                  <td className="px-5 py-3"><span className="stm-badge bg-navy/10 text-navy">{deptCode(c.departmentId)}</span></td>
                  <td className="px-5 py-3 text-slate-600">{c.semester}</td>
                  <td className="px-5 py-3 text-slate-600">{c.strength}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="stm-btn-ghost px-2 py-1" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></button>
                      <button className="stm-btn-danger px-2 py-1" onClick={() => setToDelete(c)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No classes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit Class" : "Add Class"}
        footer={<><button className="stm-btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="stm-btn-primary" onClick={save}>Save</button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="stm-label">Year</label>
              <input type="number" min={1} max={5} className="stm-input" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
            </div>
            <div>
              <label className="stm-label">Section</label>
              <input className="stm-input uppercase" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="stm-label">Department</label>
            <select className="stm-input" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="stm-label">Semester</label>
              <input type="number" min={1} max={8} className="stm-input" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
            </div>
            <div>
              <label className="stm-label">Student Strength</label>
              <input type="number" min={1} max={200} className="stm-input" value={form.strength} onChange={(e) => setForm({ ...form, strength: Number(e.target.value) })} />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!toDelete} message={`Delete this class?`} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
    </div>
  );
}
