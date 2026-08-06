import { useEffect, useMemo, useState } from "react";

export function usePagedSearch<T>(
  items: T[],
  filterFn: (item: T, query: string) => boolean,
  pageSize = 8
) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => items.filter((i) => filterFn(i, q.trim().toLowerCase())),
    [items, q, filterFn]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  return { q, setQ, page, setPage, paged, totalPages, total: filtered.length };
}
