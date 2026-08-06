import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface TableToolbarProps {
  q: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}

export default function TableToolbar({
  q,
  onSearch,
  placeholder = "Search...",
  page,
  totalPages,
  total,
  onPage,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="stm-input pl-9"
        />
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>{total} record(s)</span>
        <div className="flex items-center gap-1">
          <button
            className="stm-btn-ghost px-2 py-1 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[80px] text-center font-medium text-slate-700">
            Page {page} / {totalPages}
          </span>
          <button
            className="stm-btn-ghost px-2 py-1 disabled:opacity-40"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
