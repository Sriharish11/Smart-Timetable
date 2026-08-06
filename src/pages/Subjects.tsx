import { useState } from "react";
import { Plus, Pencil, Trash2, FlaskConical, BookOpen } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TableToolbar from "@/components/common/TableToolbar";
import { usePagedSearch } from "@/hooks/usePagedSearch";
import { db } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Subject, SubjectType } from "@/types";

const empty = {
  name: "",
  code: "",
  type: "theory" as SubjectType,
  credits: 3,
  weeklyHours: 3,
  semester: 1,
};

export default function Subjects() {
  const [rows, setRows] = useState<Subject[]>(db.subjects.all());
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [toDelete, setToDelete] = useState<Subject | null>(null);

  const { q, setQ, page, setPage, paged, totalPages, total } = usePagedSearch(
    rows,
    (s, query) => s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query)
  );

  const refresh = () => setRows(db.subjects.all());

  function openAdd() {
    setEditing(null);
    setForm({ ...empty });
    setModal(true);
  }
  function openEdit(s: Subject) {
    setEditing(s);
    setForm({ name: s.name, code: s.code, type: s.type, credits: s.credits, weeklyHours: s.weeklyHours, semester: s.semester });
    setModal(true);
  }

  function save() {
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    if (!name || !code) {
      toast.error("Subject name and code are required.");
      return;
    }
    if (form.weeklyHours < 1 || form.weeklyHours > 10) {
      toast.error("Weekly hours must be between 1 and 10.");
      return;
    }
    if (db.subjects.all().find((s) => s.code.toUpperCase() === code && s.id !== editing?.id)) {
      toast.error(`Subject code "${code}" already exists.`);
      return;
    }
    if (editing) {
      db.subjects.update(editing.id, { ...form, name, code });
      toast.success("Subject updated.");
    } else {
      db.subjects.add({ id: uid("sub"), ...form, name, code });
      toast.success("Subject added.");
    }
    refresh();
    setModal(false);
  }

  function confirmDelete() {
    if (!toDelete) return;
    if (db.allocations.all().some((a) => a.subjectId === toDelete.id)) {
      toast.error("Cannot delete: subject is allocated to a class.");
      setToDelete(null);
      return;
    }
    db.subjects.remove(toDelete.id);
    toast.success("Subject deleted.");
    setToDelete(null);
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Subject Management"
        subtitle="Define theory/lab subjects, credits and weekly required hours."
        action={<button className="stm-btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Add Subject</button>}
      />

      <div className="stm-card overflow-hidden">
        <TableToolbar q={q} onSearch={setQ} placeholder="Search subjects..." page={page} totalPages={totalPages} total={total} onPage={setPage} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Credits</th>
                <th className="px-5 py-3">Hrs/Wk</th>
                <th className="px-5 py-3">Sem</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-5 py-3 text-slate-600">{s.code}</td>
                  <td className="px-5 py-3">
                    {s.type === "lab" ? (
                      <span className="stm-badge bg-purple-100 text-purple-700"><FlaskConical className="mr-1 h-3 w-3" /> Lab</span>
                    ) : (
                      <span className="stm-badge bg-emerald-100 text-emerald-700"><BookOpen className="mr-1 h-3 w-3" /> Theory</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{s.credits}</td>
                  <td className="px-5 py-3 text-slate-600">{s.weeklyHours}</td>
                  <td className="px-5 py-3 text-slate-600">{s.semester}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="stm-btn-ghost px-2 py-1" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></button>
                      <button className="stm-btn-danger px-2 py-1" onClick={() => setToDelete(s)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No subjects found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit Subject" : "Add Subject"}
        footer={<><button className="stm-btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="stm-btn-primary" onClick={save}>Save</button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="stm-label">Subject Name</label>
            <input className="stm-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="stm-label">Subject Code</label>
              <input className="stm-input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label className="stm-label">Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, type: "theory" })} className={`stm-btn flex-1 ${form.type === "theory" ? "bg-royal text-white" : "bg-white ring-1 ring-slate-300 text-slate-600"}`}>Theory</button>
                <button type="button" onClick={() => setForm({ ...form, type: "lab" })} className={`stm-btn flex-1 ${form.type === "lab" ? "bg-royal text-white" : "bg-white ring-1 ring-slate-300 text-slate-600"}`}>Lab</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="stm-label">Credits</label>
              <input type="number" min={1} max={6} className="stm-input" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
            </div>
            <div>
              <label className="stm-label">Hrs / Week</label>
              <input type="number" min={1} max={10} className="stm-input" value={form.weeklyHours} onChange={(e) => setForm({ ...form, weeklyHours: Number(e.target.value) })} />
            </div>
            <div>
              <label className="stm-label">Semester</label>
              <input type="number" min={1} max={8} className="stm-input" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!toDelete} message={`Delete subject "${toDelete?.name}"?`} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
    </div>
  );
}
