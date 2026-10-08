"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type BoardDensity = "comfortable" | "compact";
// Vistas del tablero: dos densidades de columnas y la vista Pipeline
export type BoardView = BoardDensity | "pipeline";
export type BoardOrderChoice = "auto" | "manual";

/**
 * Selección múltiple con "All":
 * - con "All" activo, elegir una opción deja solo esa;
 * - después se pueden ir sumando o quitando opciones;
 * - si queda vacío o completo, vuelve a "All".
 */
export function toggleFilterValue<T extends string>(
  current: ReadonlySet<T>,
  all: readonly T[],
  value: T
): Set<T> {
  if (current.size === all.length) {
    return new Set<T>([value]);
  }

  const next = new Set<T>(current);

  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  if (next.size === 0 || next.size === all.length) {
    return new Set<T>(all);
  }

  return next;
}

export function BoardStyles() {
  return (
    <style>{`
      .bd-opt:hover { background: var(--app-surface-muted); }
      .bd-amber { color: #b45309; }
      html[data-theme="dark"] .bd-amber { color: #fbbf24; }
      .bd-metric {
        background: var(--app-surface-muted);
        border: 1px solid var(--app-border);
      }
    `}</style>
  );
}

function DropdownShell({
  label,
  summary,
  highlighted,
  children,
}: {
  label: string;
  summary: string;
  highlighted: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={highlighted ? { borderColor: "rgba(139,92,246,0.6)" } : undefined}
        className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition app-border hover:border-violet-500/60"
      >
        <span className="font-semibold app-text-primary">{label}</span>
        <span className="max-w-[170px] truncate app-text-muted">· {summary}</span>
        <ChevronDown className="h-3.5 w-3.5 app-text-muted" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-1.5 min-w-[250px] rounded-xl border p-1.5 shadow-xl app-border app-card"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function OptionRow({
  checked,
  radio = false,
  onClick,
  children,
}: {
  checked: boolean;
  radio?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role={radio ? "menuitemradio" : "menuitemcheckbox"}
      aria-checked={checked}
      onClick={onClick}
      className="bd-opt flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm app-text-primary"
    >
      <input
        type={radio ? "radio" : "checkbox"}
        readOnly
        checked={checked}
        tabIndex={-1}
        className="pointer-events-none h-3.5 w-3.5 accent-violet-600"
      />
      {children}
    </button>
  );
}

function MenuDivider() {
  return <div className="mx-1 my-1.5 h-px app-border" style={{ backgroundColor: "var(--app-border)" }} />;
}

type FilterOptionItem<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

export function MultiSelectFilter<T extends string>({
  label,
  allLabel,
  options,
  selected,
  onChange,
  extraHighlight = false,
  footer,
}: {
  label: string;
  allLabel: string;
  options: Array<FilterOptionItem<T>>;
  selected: ReadonlySet<T>;
  onChange: (next: Set<T>) => void;
  extraHighlight?: boolean;
  footer?: ReactNode;
}) {
  const allValues = options.map((option) => option.value);
  const isAll = selected.size === allValues.length;

  const summary = isAll
    ? "All"
    : options
        .filter((option) => selected.has(option.value))
        .map((option) => option.label)
        .join(", ");

  return (
    <DropdownShell
      label={label}
      summary={extraHighlight && isAll ? "All + archived" : summary}
      highlighted={!isAll || extraHighlight}
    >
      <OptionRow checked={isAll} onClick={() => onChange(new Set<T>(allValues))}>
        <span className="font-semibold">{allLabel}</span>
      </OptionRow>

      <MenuDivider />

      {options.map((option) => (
        <OptionRow
          key={option.value}
          checked={selected.has(option.value)}
          onClick={() => onChange(toggleFilterValue(selected, allValues, option.value))}
        >
          <span>{option.label}</span>

          {typeof option.count === "number" && (
            <span className="ml-auto text-xs app-text-muted">{option.count}</span>
          )}
        </OptionRow>
      ))}

      {footer && (
        <>
          <MenuDivider />
          {footer}
        </>
      )}
    </DropdownShell>
  );
}

export function OrderFilter({
  value,
  onChange,
}: {
  value: BoardOrderChoice;
  onChange: (next: BoardOrderChoice) => void;
}) {
  return (
    <DropdownShell
      label="Order"
      summary={value === "auto" ? "Automatic" : "Manual"}
      highlighted={value === "manual"}
    >
      <p className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-wide app-text-muted">
        Column order
      </p>

      <OptionRow radio checked={value === "auto"} onClick={() => onChange("auto")}>
        <span>
          Automatic
          <span className="block text-xs app-text-muted">
            Status → priority → visibility
          </span>
        </span>
      </OptionRow>

      <OptionRow radio checked={value === "manual"} onClick={() => onChange("manual")}>
        <span>
          Manual
          <span className="block text-xs app-text-muted">
            Drag the columns where you want them
          </span>
        </span>
      </OptionRow>
    </DropdownShell>
  );
}

export function DensityToggle({
  value,
  onChange,
}: {
  value: BoardView;
  onChange: (next: BoardView) => void;
}) {
  return (
    <div className="flex rounded-xl border p-1 app-border">
      {(
        [
          { value: "comfortable", label: "Comfortable" },
          { value: "compact", label: "Compact" },
          { value: "pipeline", label: "Pipeline" },
        ] as Array<{ value: BoardView; label: string }>
      ).map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            value === option.value
              ? "bg-violet-500 text-white"
              : "app-text-secondary hover:bg-black/[0.04]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Botón "My alerts": deja solo los candidatos propios (owner o co-recruiter) con alertas. */
export function MyAlertsToggle({
  active,
  count,
  onToggle,
}: {
  active: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title="Show only your candidates that need attention"
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "border-violet-500 bg-violet-500 text-white"
          : "app-border app-text-secondary hover:bg-black/[0.04]"
      }`}
    >
      My alerts
      <span
        className={`rounded-full px-1.5 text-[11px] font-bold ${
          active ? "bg-white/25 text-white" : "bg-red-500 text-white"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
