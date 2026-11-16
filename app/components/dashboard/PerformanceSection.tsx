"use client";

import {
  PERIOD_LABELS,
  type MetricsPeriod,
  type RecruiterStats,
} from "@/app/lib/recruiterMetrics";
import { SLA_STAGES, type SlaConfig } from "@/app/lib/stageSla";
import { Card, Days, Legend } from "./DashboardUi";

/** C2 · Rendimiento de cada recruiter (Talent y Admin). */
export function PerformanceSection({
  stats,
  config,
  period,
  onOpen,
  requisition,
}: {
  stats: RecruiterStats[];
  config: SlaConfig;
  period: MetricsPeriod;
  onOpen: (name: string) => void;
  requisition: { avg: number | null; samples: number };
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs app-text-muted">
        {PERIOD_LABELS[period]} · candidates counted by the date they were brought to a position.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((item) => {
          const maxRole = Math.max(1, ...item.byRole.map((role) => role.count));

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onOpen(item.name)}
              className="rounded-2xl border p-5 text-left transition-colors hover:border-violet-500 app-border app-card"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold app-text-primary">{item.name}</span>
                <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold app-border app-text-muted">
                  Recruiter
                </span>
                <span className="ml-auto text-xs app-text-muted">open →</span>
              </div>

              <div className="mt-3 flex gap-6">
                {[
                  ["Candidates", item.candidates],
                  ["In process", item.inProcess],
                  ["Hired", item.hired],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-2xl font-extrabold app-text-primary">{value}</p>
                    <p className="text-xs app-text-muted">{label}</p>
                  </div>
                ))}
              </div>

              <p className="mb-1 mt-4 text-[11px] app-text-muted">By role</p>

              {item.byRole.length > 0 ? (
                <div className="flex items-end gap-1.5">
                  {item.byRole.slice(0, 6).map((role) => (
                    <div key={role.role} className="flex-1 text-center" title={`${role.role}: ${role.count}`}>
                      <div
                        className="mx-auto w-full rounded-t bg-violet-500/70"
                        style={{ height: `${Math.max(4, (role.count / maxRole) * 32)}px` }}
                      />
                      <p className="mt-1 truncate text-[9.5px] app-text-muted">
                        {role.role} {role.count}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs app-text-muted">No candidates in this period.</p>
              )}
            </button>
          );
        })}
      </div>

      <Card title="Time per stage" count={PERIOD_LABELS[period]}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t text-left text-[11px] uppercase tracking-wide app-border app-text-muted">
                <th className="px-5 py-2 font-semibold">Stage</th>
                {stats.map((item) => (
                  <th key={item.name} className="px-5 py-2 font-semibold">
                    {item.name} · avg days
                  </th>
                ))}
                <th className="px-5 py-2 font-semibold">Expected</th>
              </tr>
            </thead>

            <tbody>
              {SLA_STAGES.map((stage) => (
                <tr key={stage.key} className="border-t app-border">
                  <td className="px-5 py-2.5">
                    <p className="font-semibold app-text-primary">{stage.label}</p>
                    <p className="text-[11px] app-text-muted">waits on: {stage.waitsOn}</p>
                  </td>

                  {stats.map((item) => {
                    const stat = item.stages.find((entry) => entry.key === stage.key);

                    return (
                      <td key={item.name} className="px-5 py-2.5">
                        <Days value={stat?.avg ?? null} level={stat?.level ?? null} />
                      </td>
                    );
                  })}

                  <td className="px-5 py-2.5 app-text-muted">
                    {config[stage.key].min}–{config[stage.key].max}d
                  </td>
                </tr>
              ))}

              <tr className="border-t app-border">
                <td className="px-5 py-2.5">
                  <p className="font-semibold app-text-primary">Requisition → first candidate</p>
                  <p className="text-[11px] app-text-muted">measured on the position (whole team)</p>
                </td>
                <td colSpan={stats.length} className="px-5 py-2.5 app-text-secondary">
                  {requisition.avg === null
                    ? "No positions with an opening date yet"
                    : `${requisition.avg}d on average (${requisition.samples} positions)`}
                </td>
                <td className="px-5 py-2.5 app-text-muted">
                  {config.requisition.min}–{config.requisition.max}d
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Legend
        items={[
          <>
            <b>Colors</b>: green = within the expected maximum, amber = up to double, red = more
            than double.
          </>,
          <>
            <b>“Waits on”</b>: in stages that depend on the client, the Tech Lead or the candidate,
            the delay is not only on the recruiter. It is marked so it is not read as her fault.
          </>,
          <>
            <b>Averages</b> include people who are still in the stage today, so stuck candidates
            show up.
          </>,
          <>
            <b>Visibility</b>: Talent and Admin see everyone; each recruiter only sees her own
            numbers.
          </>,
        ]}
      />
    </div>
  );
}
