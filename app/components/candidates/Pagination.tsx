"use client";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
};

export const PAGE_SIZES = [10, 25, 50, 100];

// Números de página con "…" para que entren miles de resultados
function pageNumbers(page: number, pages: number): Array<number | "gap"> {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, index) => index + 1);
  }

  const wanted = new Set([1, pages, page - 1, page, page + 1]);
  const sorted = Array.from(wanted)
    .filter((value) => value >= 1 && value <= pages)
    .sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];

  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) {
      result.push("gap");
    }

    result.push(value);
  });

  return result;
}

export function Pagination({ page, pageSize, total, onPage, onPageSize }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const buttonClass =
    "rounded-lg border px-2.5 py-1 text-xs font-medium app-border app-text-secondary disabled:opacity-40 hover:bg-black/[0.04]";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs app-text-muted">
      <span>
        Showing {from}–{to} of {total}
      </span>

      <span className="ml-auto">Per page</span>

      <select
        value={pageSize}
        onChange={(event) => onPageSize(Number(event.target.value))}
        className="app-input rounded-lg border px-2 py-1 text-xs"
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <button type="button" className={buttonClass} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ‹
      </button>

      {pageNumbers(page, pages).map((value, index) =>
        value === "gap" ? (
          <span key={`gap-${index}`}>…</span>
        ) : (
          <button
            key={value}
            type="button"
            onClick={() => onPage(value)}
            className={
              value === page
                ? "rounded-lg border border-violet-500 bg-violet-500/15 px-2.5 py-1 text-xs font-bold app-text-primary"
                : buttonClass
            }
          >
            {value}
          </button>
        )
      )}

      <button
        type="button"
        className={buttonClass}
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        ›
      </button>
    </div>
  );
}
