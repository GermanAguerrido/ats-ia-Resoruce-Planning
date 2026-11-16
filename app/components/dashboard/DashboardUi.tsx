"use client";

import type { CSSProperties, ReactNode } from "react";

import { SLA_COLORS, type SlaLevel } from "@/app/lib/stageSla";

/** Tarjeta con título, igual a la del Dashboard anterior. */
export function Card({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: string | number;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border app-border app-card">
      <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide app-text-muted">{title}</h2>

        <div className="flex items-center gap-2">
          {action}

          {count !== undefined && (
            <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-bold text-violet-500">
              {count}
            </span>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  detail,
  accent = "text-violet-500",
  progress,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  accent?: string;
  progress?: number;
}) {
  return (
    <div className="rounded-2xl border p-5 shadow-sm app-border app-card">
      <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">{label}</p>
      <p className={`mt-3 text-4xl font-bold leading-none ${accent}`}>{value}</p>

      {detail && <p className="mt-2 text-sm app-text-secondary">{detail}</p>}

      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

export function levelStyle(level: SlaLevel | null): CSSProperties | undefined {
  return level ? { color: SLA_COLORS[level], fontWeight: 700 } : undefined;
}

/** Días con el color del semáforo. */
export function Days({ value, level }: { value: number | null; level: SlaLevel | null }) {
  if (value === null) {
    return <span className="app-text-muted">—</span>;
  }

  return <span style={levelStyle(level)}>{value}d</span>;
}

export function Legend({ items }: { items: ReactNode[] }) {
  return (
    <div className="mt-4 rounded-xl border px-4 py-3 text-xs leading-6 app-border app-text-muted">
      <ul className="list-disc space-y-0.5 pl-4">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function pluralize(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}
