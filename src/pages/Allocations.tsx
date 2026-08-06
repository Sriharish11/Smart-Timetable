import { useState } from "react";
import { Plus, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TableToolbar from "@/components/common/TableToolbar";
import { usePagedSearch } from "@/hooks/usePagedSearch";
import { db } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Allocation } from "@/types";

export default function Allocations() {
  const [rows, setRows] = useState<Allocation[]>(db.allocations.all());
  const staff = db.staff.all();
  const subjects = db.subjects.all();
  const classes = db.classes.all();
  const departments = db.departments.all();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ staffId: "", subjectId: "", classId: "" });
  const [toDelete, setToDelete] = useState<Allocation | null>(null);

  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? "—";
  const subject = (id: string) => subjects.find((s) => s.id === id);
  const deptCode = (id: string) => departments.find((d) => d.id === id)?.code ?? "";
  const classLabel = (id: string) => {
    const c = classes.find((x) => x.id === id);
    return c ? `${deptCode(c.departmentId)} Y${c.year}-${c.section}` : "—";
  };

  const { q, setQ, page, setPage, paged, totalPages, total } = usePagedSearch(
    rows,
    (a, query) =>
      staffName(a.staffId).toLowerCase().includes(query) ||
      (subject(a.subjectId)?.name.toLowerCase().includes(query) ?? false) ||
      classLabel(a.classId).toLowerCase().includes(query)
  );

  const refresh = () => setRows(db.allocations.all());

  function openAdd() {
    setForm({ staffId: staff[0]?.id ?? "", subjectId: subjects[0]?.id ?? "", classId: classes[0]?.id ?? "" });
    setModal(true);
  }

  function save() {
    if (!form.staffId || !form.subjectId || !form.classId) {
      toast.error("Please select staff, subject and class.");
      return;
    }
    const cls = classes.find((c) => c.id === form.classId);
    const dup = db.allocations.all().find(
      (a) => a.subjectId === form.subjectId && a.classId === form.classId
    );
    if (dup) {
      toast.error("This subject is already allocated for the selected class.");
      return;
    }
    db.allocations.add({
      id: uid("al"),
      staffId: form.staffId,
      subjectId: form.subjectId,
      classId: form.classId,
      semester: cls?.semester ?? 1,
    });
    toast.success("Allocation created.");
    refresh();
    setModal(false);
  }

  function confirmDelete() {
    if (!toDelete) return;
    db.allocations.remove(toDelete.id);
    toast.success("Allocation removed.");
    setToDelete(null);
    refresh();
  }

  const ready = staff.length && subjects.length && classes.length;

  return (
    <div>
      <PageHeader
        title="Faculty–Subject Allocation"
        subtitle="Map faculty to subjects for each class and semester."
        action={<button className="stm-btn-primary" onClick={openAdd} disabled={!ready}><Plus className="h-4 w-4" /> New Allocation</button>}
      />

      {!ready && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Add at least one staff, subject and class before creating allocations.
        </div>
      )}

      <div className="stm-card overflow-hidden">
        <TableToolbar q={q} onSearch={setQ} placeholder="Search allocations..." page={page} totalPages={totalPages} total={total} onPage={setPage} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Faculty</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Sem</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{staffName(a.staffId)}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {subject(a.subjectId)?.name}{" "}
                    <span className="text-xs text-slate-400">({subject(a.subjectId)?.code})</span>
                  </td>
                  <td className="px-5 py-3"><span className="stm-badge bg-navy/10 text-navy">{classLabel(a.classId)}</span></td>
                  <td className="px-5 py-3 text-slate-600">{a.semester}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <button className="stm-btn-danger px-2 py-1" onClick={() => setToDelete(a)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400"><Link2 className="mx-auto mb-2 h-6 w-6 text-slate-300" />No allocations found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="New Allocation"
        footer={<><button className="stm-btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="stm-btn-primary" onClick={save}>Save</button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="stm-label">Faculty</label>
            <select className="stm-input" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="stm-label">Subject</label>
            <select className="stm-input" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code}) · {s.type}</option>)}
            </select>
          </div>
          <div>
            <label className="stm-label">Class</label>
            <select className="stm-input" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              {classes.map((c) => <option key={c.id} value={c.id}>{classLabel(c.id)} · Sem {c.semester}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!toDelete} message="Remove this allocation?" onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
    </div>
  );
}
