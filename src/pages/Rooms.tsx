import { useState } from "react";
import { Plus, Pencil, Trash2, DoorOpen, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TableToolbar from "@/components/common/TableToolbar";
import { usePagedSearch } from "@/hooks/usePagedSearch";
import { db } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Room, RoomType } from "@/types";

const empty = { number: "", type: "classroom" as RoomType, capacity: 60 };

export default function Rooms() {
  const [rows, setRows] = useState<Room[]>(db.rooms.all());
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [toDelete, setToDelete] = useState<Room | null>(null);

  const { q, setQ, page, setPage, paged, totalPages, total } = usePagedSearch(
    rows,
    (r, query) => r.number.toLowerCase().includes(query) || r.type.includes(query)
  );

  const refresh = () => setRows(db.rooms.all());

  function openAdd() {
    setEditing(null);
    setForm({ ...empty });
    setModal(true);
  }
  function openEdit(r: Room) {
    setEditing(r);
    setForm({ number: r.number, type: r.type, capacity: r.capacity });
    setModal(true);
  }

  function save() {
    const number = form.number.trim().toUpperCase();
    if (!number) {
      toast.error("Room number is required.");
      return;
    }
    if (form.capacity < 1 || form.capacity > 500) {
      toast.error("Capacity must be between 1 and 500.");
      return;
    }
    if (db.rooms.all().find((r) => r.number.toUpperCase() === number && r.id !== editing?.id)) {
      toast.error(`Room "${number}" already exists.`);
      return;
    }
    if (editing) {
      db.rooms.update(editing.id, { ...form, number });
      toast.success("Room updated.");
    } else {
      db.rooms.add({ id: uid("rm"), ...form, number });
      toast.success("Room added.");
    }
    refresh();
    setModal(false);
  }

  function confirmDelete() {
    if (!toDelete) return;
    if (db.timetable.all().some((t) => t.roomId === toDelete.id)) {
      toast.error("Cannot delete: room is used in a generated timetable.");
      setToDelete(null);
      return;
    }
    db.rooms.remove(toDelete.id);
    toast.success("Room deleted.");
    setToDelete(null);
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Room Management"
        subtitle="Manage classrooms and laboratories with capacities."
        action={<button className="stm-btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Add Room</button>}
      />

      <div className="stm-card overflow-hidden">
        <TableToolbar q={q} onSearch={setQ} placeholder="Search rooms..." page={page} totalPages={totalPages} total={total} onPage={setPage} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Room No.</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Capacity</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${r.type === "lab" ? "bg-purple-100 text-purple-600" : "bg-blue-50 text-royal"}`}>
                        {r.type === "lab" ? <FlaskConical className="h-4 w-4" /> : <DoorOpen className="h-4 w-4" />}
                      </span>
                      <span className="font-medium text-slate-800">{r.number}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`stm-badge ${r.type === "lab" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {r.type === "lab" ? "Lab" : "Classroom"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{r.capacity}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="stm-btn-ghost px-2 py-1" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></button>
                      <button className="stm-btn-danger px-2 py-1" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No rooms found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit Room" : "Add Room"}
        footer={<><button className="stm-btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="stm-btn-primary" onClick={save}>Save</button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="stm-label">Room Number</label>
            <input className="stm-input uppercase" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="A-101" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="stm-label">Type</label>
              <select className="stm-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as RoomType })}>
                <option value="classroom">Classroom</option>
                <option value="lab">Lab</option>
              </select>
            </div>
            <div>
              <label className="stm-label">Capacity</label>
              <input type="number" min={1} max={500} className="stm-input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!toDelete} message={`Delete room "${toDelete?.number}"?`} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
    </div>
  );
}
