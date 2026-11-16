"use client";

import Link from "next/link";

import type { ProjectColumn } from "@/app/data/resourcePlanningMock";
import { isHiredCandidate, isInProcessCandidate } from "@/app/lib/candidateStatus";
import { buildPipelineStats, flattenCandidates } from "@/app/lib/recruiterMetrics";
import { SLA_COLORS, SLA_STAGES, type SlaConfig } from "@/app/lib/stageSla";
import { MyTodoCard } from "../todo/MyTodoCard";
import { Card, Days, Kpi, Legend, pluralize } from "./DashboardUi";

const priorityBadge: Record<ProjectColumn["priority"], { label: string; className: string }> = {
  high: { label: "High", className: "border-red-500/60 bg-red-500/25" },
  medium: { label: "Medium", className: "border-yellow-500/60 bg-yellow-500/25" },
  low: { label: "Low", className: "border-green-500/60 bg-green-500/25" },
};

export type ActivityEntry = {
  id: string;
  initials: string;
  text: string;
  context: string;
  createdAt: string;
};

function formatRelativeTime(isoDate: string) {
  const timestamp = new Date(isoDate).getTime();

  if (Number.isNaN(timestamp)) return "";

  const minutes = Math.floor((Date.now() - timestamp) / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${pluralize(minutes, "minute", "minutes")} ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${pluralize(hours, "hour", "hours")} ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${pluralize(days, "day", "days")} ago`;

  return new Date(timestamp).toLocaleDateString("es-AR");
}

/** C1 · Overview (Talent y Admin): KPIs, pipeline con semáforo, proyectos, To-Do y listos para presentar. */
export function OverviewSection({
  projects,
  config,
  activity,
}: {
  projects: ProjectColumn[];
  config: SlaConfig;
  activity: ActivityEntry[];
}) {
  const refs = flattenCandidates(projects);
  const inProcess = refs.filter((item) => isInProcessCandidate(item.candidate));
  const ready = inProcess.filter((item) => item.candidate.resumeStatus === "resume_ready");
  const hired = refs.filter((item) => isHiredCandidate(item.candidate)).length;
  const openPositions = projects.flatMap((project) =>
    project.positions.filter((position) => position.status === "open")
  );
  const requested = projects
    .flatMap((project) => project.positions)
    .filter((position) => position.status === "open" || position.status === "hired")
    .reduce((total, position) => total + (position.quantity ?? 1), 0);
  const activeProjects = projects.filter((project) => project.status === "active_search");
  const pipeline = buildPipelineStats(projects, config);
  const maxCount = Math.max(1, ...pipeline.map((stage) => stage.count));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Open projects"
          value={activeProjects.length}
          detail={`${projects.length} in total`}
        />
        <Kpi
          label="Candidates in process"
          value={inProcess.length}
          detail="not hired or rejected"
          accent="text-emerald-500"
        />
        <Kpi
          label="Open positions"
          value={openPositions.length}
          detail={`across ${pluralize(
            projects.filter((project) =>
              project.positions.some((position) => position.status === "open")
            ).length,
            "project",
            "projects"
          )}`}
          accent="text-sky-500"
        />
        <Kpi
          label="Hired / requested (HR request)"
          value={`${hired} / ${requested}`}
          accent="text-emerald-500"
          progress={Math.min(100, Math.round((hired / Math.max(requested, 1)) * 100))}
        />
      </div>

      <Card title="Pipeline" count={pluralize(refs.length, "candidate", "candidates")}>
        <div className="grid gap-3 px-5 pb-5 pt-1 sm:grid-cols-4 xl:grid-cols-8">
          {pipeline.map((stage) => {
            const info = SLA_STAGES.find((item) => item.key === stage.key);

            return (
              <div key={stage.key} className="rounded-xl border p-3 app-border">
                <p className="truncate text-[11px] font-semibold app-text-muted">{stage.label}</p>
                <p className="mt-1 text-2xl font-extrabold app-text-primary">{stage.count}</p>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(stage.count / maxCount) * 100}%`,
                      backgroundColor: stage.level ? SLA_COLORS[stage.level] : "#64748b",
                    }}
                  />
                </div>

                <p className="mt-2 text-[11px] app-text-secondary">
                  avg <Days value={stage.avg} level={stage.level} />{" "}
                  <span className="app-text-muted">/ max {config[stage.key].max}d</span>
                </p>

                {info?.external && (
                  <p className="mt-0.5 text-[10px] app-text-muted">waits on {info.waitsOn}</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card title="Projects overview" count={projects.length}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t text-left text-[11px] uppercase tracking-wide app-border app-text-muted">
                  <th className="px-5 py-2 font-semibold">Project</th>
                  <th className="px-5 py-2 font-semibold">Priority</th>
                  <th className="px-5 py-2 font-semibold">Open</th>
                  <th className="px-5 py-2 font-semibold">Candidates</th>
                  <th className="px-5 py-2 font-semibold">Hired / requested</th>
                </tr>
              </thead>

              <tbody>
                {projects.map((project) => {
                  const people = project.positions.flatMap((position) => position.candidates);
                  const projectRequested = project.positions
                    .filter((position) => position.status === "open" || position.status === "hired")
                    .reduce((total, position) => total + (position.quantity ?? 1), 0);
                  const projectHired = people.filter(isHiredCandidate).length;
                  const percent = projectRequested
                    ? Math.min(100, Math.round((projectHired / projectRequested) * 100))
                    : 0;
                  const priority = priorityBadge[project.priority];

                  return (
                    <tr
                      key={project.id}
                      className="border-t transition-colors hover:bg-violet-500/5 app-border"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/jobs?project=${encodeURIComponent(project.id)}`}
                          className="block"
                          title="Open this project in Resource Planning"
                        >
                          <p className="font-semibold app-text-primary">{project.projectName}</p>
                          <p className="text-xs app-text-muted">{project.clientName}</p>
                        </Link>
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold app-text-primary ${priority.className}`}
                        >
                          {priority.label}
                        </span>
                      </td>

                      <td className="px-5 py-3 app-text-primary">
                        {project.positions.filter((position) => position.status === "open").length}
                      </td>

                      <td className="px-5 py-3 app-text-primary">
                        {people.filter(isInProcessCandidate).length}
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex min-w-[130px] items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <span className="whitespace-nowrap text-xs app-text-secondary">
                            {projectHired} / {projectRequested}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4 self-start">
          <MyTodoCard />

          <Card title="Ready to present" count={ready.length}>
            {ready.length > 0 ? (
              ready.map((item) => (
                <Link
                  key={`${item.position.id}-${item.candidate.id}`}
                  href={`/jobs?position=${encodeURIComponent(item.position.id)}`}
                  className="block border-t px-5 py-2.5 text-sm hover:bg-violet-500/5 app-border"
                >
                  <span className="font-semibold app-text-primary">{item.candidate.name}</span>
                  <span className="app-text-muted">
                    {" "}
                    · {item.position.title} · {item.position.seniority}
                  </span>
                </Link>
              ))
            ) : (
              <p className="border-t px-5 py-5 text-center text-sm app-border app-text-muted">
                Nobody is ready to present yet.
              </p>
            )}
          </Card>

          <Card title="Recent activity" count={activity.length}>
            {activity.length > 0 ? (
              activity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 border-t px-5 py-3 text-sm app-border"
                >
                  <div className="rp-avatar-badge flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
                    {entry.initials}
                  </div>

                  <div className="min-w-0">
                    <p className="line-clamp-2 app-text-primary">{entry.text}</p>
                    <p className="mt-0.5 text-xs app-text-muted">
                      {entry.context} · {formatRelativeTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="border-t px-5 py-6 text-center text-sm app-border app-text-muted">
                No activity yet. Comments and actions from the board show up here.
              </p>
            )}
          </Card>
        </div>
      </div>

      <Legend
        items={[
          <>
            <b>Pipeline</b>: each stage shows people and the average time against the expected
            maximum (green within it, amber up to double, red beyond).
          </>,
          <>
            <b>Needs attention</b> moved to the To-Do.
          </>,
          <>
            <b>HR request</b>: positions requested by clients against the ones already covered.
          </>,
        ]}
      />
    </div>
  );
}
