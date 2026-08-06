import Modal from "@/components/common/Modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  title = "Confirm Delete",
  message,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button className="stm-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="stm-btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </Modal>
  );
}
