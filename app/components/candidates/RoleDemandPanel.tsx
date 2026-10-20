"use client";

import { useState } from "react";
import { SENIORITY_BANDS } from "@/app/lib/roles";
import type { RoleDemand } from "@/app/lib/roleDemand";
import { COVERAGE_RATIO } from "@/app/lib/roleDemand";

const BAND_SHORT = ["JR", "SSR", "SR", "Lead"];
const VISIBLE_BY_DEFAULT = 8;

type Props = {
  demand: RoleDemand[];
  selectedKey: string;
  onSelect: (key: string) => void;
};

/** Qué tenemos y qué nos falta: personas por rol y seniority frente a las posiciones abiertas. */
export function RoleDemandPanel({ demand, selectedKey, onSelect }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? demand : demand.slice(0, VISIBLE_BY_DEFAULT);

  return (
    <section className="rounded-2xl border p-4 app-border app-card">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold app-text-primary">Talent base by position</h2>
        <span className="text-xs app-text-muted">· what we have, what we lack</span>

        {demand.length > VISIBLE_BY_DEFAULT && (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="ml-auto text-xs font-semibold text-violet-500 hover:underline"
          >
            {showAll ? "Show fewer" : `Show all ${demand.length}`}
          </button>
        )}
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
        {visible.map((item) => {
          const max = Math.max(...item.byBand, 1);
          const selected = selectedKey === item.key;
          const uncovered = item.open.filter((entry) => !entry.covered);

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(selected ? "" : item.key)}
              className={`rounded-xl border p-3 text-left transition ${
                selected
                  ? "border-violet-500 bg-violet-500/10"
                  : "app-border hover:border-violet-500/50"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold app-text-primary">{item.role}</span>
                <span className="text-lg font-bold app-text-primary">{item.total}</span>
              </div>

              <div className="mt-3 flex h-9 items-end gap-1">
                {item.byBand.map((count, index) => (
                  <div key={SENIORITY_BANDS[index]} className="relative flex-1">
                    <span className="absolute -top-3.5 left-0 right-0 text-center text-[10px] app-text-muted">
                      {count}
                    </span>
                    <div
                      className="w-full rounded-t bg-violet-500/80"
                      style={{ height: `${Math.max(3, (count / max) * 30)}px` }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-0.5 flex gap-1">
                {BAND_SHORT.map((label) => (
                  <span key={label} className="flex-1 text-center text-[10px] app-text-muted">
                    {label}
                  </span>
                ))}
              </div>

              {item.open.length > 0 &&
                (uncovered.length > 0 ? (
                  <span
                    className="mt-2 inline-block rounded-md border border-red-500/40 px-1.5 text-[10px] font-bold text-red-500"
                    title={`We aim for ${COVERAGE_RATIO} people per open position`}
                  >
                    Gap · {item.open.length} open,{" "}
                    {uncovered.map((entry) => entry.seniority).join(", ")} short
                  </span>
                ) : (
                  <span className="mt-2 inline-block text-[10.5px] text-emerald-500">
                    ✓ {item.open.length} open position{item.open.length === 1 ? "" : "s"} covered
                  </span>
                ))}
            </button>
          );
        })}
      </div>
    </section>
  );
}
