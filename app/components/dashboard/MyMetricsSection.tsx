"use client";

import type { RecruiterStats } from "@/app/lib/recruiterMetrics";
import { SLA_COLORS, SLA_STAGES, type SlaConfig } from "@/app/lib/stageSla";
import { Card, Days, Kpi, Legend } from "./DashboardUi";

/** C3 · Métricas de una recruiter. Ella ve solo las suyas; Talent y Admin abren una desde C2. */
export function MyMetricsSection({
  stats,
  other,
  config,
  isOwnView,
  onBack,
}: {
  stats: RecruiterStats;
  // Otra recruiter para comparar (solo la ven Talent y Admin)
  other?: RecruiterStats;
  config: SlaConfig;
  isOwnView: boolean;
  onBack?: () => void;
}) {
  const worst = stats.bottleneck;
  const worstInfo = worst ? SLA_STAGES.find((stage) => stage.key === worst.key) : null;
  const maxRole = Math.max(1, ...stats.byRole.map((role) => role.count));

  return (
    <div className="space-y-4">
      {!isOwnView && (
        <p className="text-sm app-text-muted">
          Talent/Admin view of one recruiter.{" "}
          {onBack && (
            <button type="button" onClick={onBack} className="font-semibold text-violet-500 hover:underline">
              ← back to everyone
            </button>
          )}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Candidates" value={stats.candidates} />
        <Kpi label="In process" value={stats.inProcess} accent="text-sky-500" />
        <Kpi label="Hired" value={stats.hired} accent="text-emerald-500" />
        <Kpi label="Not in process" value={stats.notInProcess} accent="text-amber-500" />
      </div>

      <section
        className="rounded-2xl border p-5 app-card"
        style={{ borderColor: worst ? SLA_COLORS[worst.level] : undefined }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wide app-text-muted">
          {isOwnView ? "Where your bottleneck is" : `Where ${stats.name}'s bottleneck is`}
        </h2>

        {worst && worstInfo ? (
          <p className="mt-2 text-sm app-text-secondary">
            <b className="app-text-primary">{worstInfo.label}</b> takes{" "}
            <b style={{ color: SLA_COLORS[worst.level] }}>{worst.avg} days</b> on average (expected{" "}
            {config[worst.key].min}–{config[worst.key].max}).{" "}
            {worstInfo.external
              ? `This stage mostly depends on ${worstInfo.waitsOn}, so it is not only on ${
                  isOwnView ? "you" : stats.name
                }.`
              : isOwnView
                ? "This stage is in your hands: try to close it earlier."
                : "This stage is in the recruiter's hands."}
          </p>
        ) : (
          <p className="mt-2 text-sm app-text-muted">Not enough data in this period yet.</p>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Time per stage and conversion">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t text-left text-[11px] uppercase tracking-wide app-border app-text-muted">
                  <th className="px-5 py-2 font-semibold">Stage</th>
                  <th className="px-5 py-2 font-semibold">Range</th>
                  <th className="px-5 py-2 font-semibold">Avg</th>
                  <th className="px-5 py-2 font-semibold">Expected</th>
                  <th className="px-5 py-2 font-semibold">Passed to next</th>
                </tr>
              </thead>

              <tbody>
                {SLA_STAGES.map((stage) => {
                  const stat = stats.stages.find((entry) => entry.key === stage.key);
                  const range = config[stage.key];
                  const scale = range.max * 2.2;
                  const marker = stat?.avg != null ? Math.min(100, (stat.avg / scale) * 100) : null;

                  return (
                    <tr key={stage.key} className="border-t app-border">
                      <td className="px-5 py-2.5">
                        <p className="font-semibold app-text-primary">{stage.label}</p>
                        <p className="text-[11px] app-text-muted">waits on: {stage.waitsOn}</p>
                      </td>

                      <td className="px-5 py-2.5">
                        <div className="relative h-3.5 w-[150px] rounded-full bg-black/10 dark:bg-white/10">
                          <div
                            className="absolute bottom-0 top-0 rounded-full bg-emerald-500/30"
                            style={{
                              left: `${(range.min / scale) * 100}%`,
                              width: `${((range.max - range.min) / scale) * 100}%`,
                            }}
                          />

                          {marker !== null && stat?.level && (
                            <div
                              className="absolute -top-0.5 h-[18px] w-[5px] rounded"
                              style={{
                                left: `${marker}%`,
                                backgroundColor: SLA_COLORS[stat.level],
                              }}
                            />
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-2.5">
                        <Days value={stat?.avg ?? null} level={stat?.level ?? null} />
                      </td>

                      <td className="px-5 py-2.5 app-text-muted">
                        {range.min}–{range.max}d
                      </td>

                      <td className="px-5 py-2.5 app-text-secondary">
                        {stat?.passedToNext != null ? `${stat.passedToNext}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4 self-start">
          <Card title="By role">
            <div className="px-5 pb-4 pt-1">
              {stats.byRole.length > 0 ? (
                stats.byRole.map((role) => (
                  <div key={role.role} className="flex items-center gap-3 py-1.5 text-sm">
                    <span className="w-[120px] truncate app-text-secondary">{role.role}</span>

                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${(role.count / maxRole) * 100}%` }}
                      />
                    </div>

                    <b className="app-text-primary">{role.count}</b>
                  </div>
                ))
              ) : (
                <p className="py-3 text-center text-sm app-text-muted">No candidates in this period.</p>
              )}
            </div>
          </Card>

          {isOwnView ? (
            <div className="flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm app-border app-card">
              <span>🔒</span>
              <div>
                <p className="font-semibold app-text-primary">Other recruiters</p>
                <p className="text-xs app-text-muted">Their numbers are not visible to you.</p>
              </div>
            </div>
          ) : (
            other && (
              <Card title={`Compared with ${other.name}`}>
                <p className="px-5 pb-4 pt-1 text-sm app-text-secondary">
                  {stats.name}: {stats.inProcess} in process · {other.name}: {other.inProcess} in
                  process
                </p>
              </Card>
            )
          )}
        </div>
      </div>

      <Legend
        items={[
          <>
            <b>Range</b>: the green band is the expected range; the marker is the average.
          </>,
          <>
            <b>Passed to next</b>: of the people who already left the stage, how many moved
            forward.
          </>,
        ]}
      />
    </div>
  );
}
