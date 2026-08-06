import { useState } from "react";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TableToolbar from "@/components/common/TableToolbar";
import { usePagedSearch } from "@/hooks/usePagedSearch";
import { db } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Department } from "@/types";

export default function Departments() {
  const [rows, setRows] = useState<Department[]>(db.departments.all());
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [toDelete, setToDelete] = useState<Department | null>(null);

  const { q, setQ, page, setPage, paged, totalPages, total } = usePagedSearch(
    rows,
    (d, query) => d.name.toLowerCase().includes(query) || d.code.toLowerCase().includes(query)
  );

  const refresh = () => setRows(db.departments.all());

  function openAdd() {
    setEditing(null);
    setName("");
    setCode("");
    setModal(true);
  }

  function openEdit(d: Department) {
    setEditing(d);
    setName(d.name);
    setCode(d.code);
    setModal(true);
  }

  function save() {
    const n = name.trim();
    const c = code.trim().toUpperCase();
    if (!n || !c) {
      toast.error("Department name and code are required.");
      return;
    }
    const dup = db.departments
      .all()
      .find((d) => d.code.toUpperCase() === c && d.id !== editing?.id);
    if (dup) {
      toast.error(`Department code "${c}" already exists.`);
      return;
    }
    if (editing) {
      db.departments.update(editing.id, { name: n, code: c });
      toast.success("Department updated.");
    } else {
      db.departments.add({ id: uid("dep"), name: n, code: c });
      toast.success("Department added.");
    }
    refresh();
    setModal(false);
  }

  function confirmDelete() {
    if (!toDelete) return;
    const inUse = db.staff.all().some((s) => s.departmentId === toDelete.id) ||
      db.classes.all().some((c) => c.departmentId === toDelete.id);
    if (inUse) {
      toast.error("Cannot delete: department is used by staff or classes.");
      setToDelete(null);
      return;
    }
    db.departments.remove(toDelete.id);
    toast.success("Department deleted.");
    setToDelete(null);
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Department Management"
        subtitle="Create and manage academic departments."
        action={
          <button className="stm-btn-primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Department
          </button>
        }
      />

      <div className="stm-card overflow-hidden">
        <TableToolbar
          q={q}
          onSearch={setQ}
          placeholder="Search by name or code..."
          page={page}
          totalPages={totalPages}
          total={total}
          onPage={setPage}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-royal">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-slate-800">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="stm-badge bg-navy/10 text-navy">{d.code}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="stm-btn-ghost px-2 py-1" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="stm-btn-danger px-2 py-1" onClick={() => setToDelete(d)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-slate-400">
                    No departments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit Department" : "Add Department"}
        footer={
          <>
            <button className="stm-btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="stm-btn-primary" onClick={save}>Save</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="stm-label">Department Name</label>
            <input className="stm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Computer Science & Engineering" />
          </div>
          <div>
            <label className="stm-label">Department Code</label>
            <input className="stm-input uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CSE" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        message={`Delete department "${toDelete?.name}"? This cannot be undone.`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
