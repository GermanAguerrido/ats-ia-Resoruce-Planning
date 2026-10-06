"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Inbox,
  PauseCircle,
} from "lucide-react";
import {
  resourcePlanningMock,
  type CandidateMini,
  type CandidateProcessStatus,
  type PositionCard,
  type ProjectColumn,
} from "@/app/data/resourcePlanningMock";
import { readStoredBoard } from "@/app/lib/boardStorage";

type AttentionTone = "warning" | "danger" | "info" | "success";

type AttentionItem = {
  id: string;
  tone: AttentionTone;
  icon: ReactNode;
  title: string;
  description: string;
};

type ActivityEntry = {
  id: string;
  initials: string;
  text: string;
  context: string;
  createdAt: string;
};

type CandidateRef = {
  project: ProjectColumn;
  position: PositionCard;
  candidate: CandidateMini;
};

const AGING_THRESHOLD_DAYS = 14;

const pipelineStages: Array<{ value: CandidateProcessStatus; label: string }> = [
  { value: "sourced", label: "Sourced" },
  { value: "contacted", label: "Contacted" },
  { value: "screening", label: "Screening" },
  { value: "presented", label: "Presented" },
  { value: "tech_interview", label: "Tech Interview" },
  { value: "client_interview", label: "Client Interview" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
];

const toneClass: Record<AttentionTone, string> = {
  warning: "bg-amber-500/15 text-amber-500",
  danger: "bg-red-500/15 text-red-500",
  info: "bg-blue-500/15 text-blue-500",
  success: "bg-emerald-500/15 text-emerald-500",
};

const priorityBadge: Record<ProjectColumn["priority"], { label: string; className: string }> = {
  high: {
    label: "High",
    className: "border-red-500/60 bg-red-500/25",
  },
  medium: {
    label: "Medium",
    className: "border-yellow-500/60 bg-yellow-500/25",
  },
  low: {
    label: "Low",
    className: "border-green-500/60 bg-green-500/25",
  },
};

function isHired(candidate: CandidateMini) {
  return (
    candidate.processStatus === "hired" || candidate.talentType === "trick_internal"
  );
}

function isInProcess(candidate: CandidateMini) {
  return !isHired(candidate) && candidate.processStatus !== "rejected";
}

function pluralize(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function formatRelativeTime(isoDate: string) {
  const timestamp = new Date(isoDate).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const minutes = Math.floor((Date.now() - timestamp) / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${pluralize(minutes, "minute", "minutes")} ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${pluralize(hours, "hour", "hours")} ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${pluralize(days, "day", "days")} ago`;

  return new Date(timestamp).toLocaleDateString("es-AR");
}

// Lee los comentarios y acciones guardados por el modal de detalle
function readRecentActivity(projects: ProjectColumn[]): ActivityEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const entries: ActivityEntry[] = [];

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (!key || !key.startsWith("rp-activity:")) {
        continue;
      }

      const parts = key.split(":");
      const project = projects.find((item) => item.id === parts[2]);

      if (!project) {
        continue;
      }

      const position =
        parts[3] === "position"
          ? project.positions.find((item) => item.id === parts[4])
          : undefined;

      const candidate =
        parts[5] === "candidate"
          ? position?.candidates.find((item) => item.id === parts[6])
          : undefined;

      const context = candidate
        ? `${candidate.name} · ${position?.title ?? ""}`
        : position
          ? `${position.title} · ${project.projectName}`
          : project.projectName;

      const rawValue = window.localStorage.getItem(key);
      const parsed = rawValue ? JSON.parse(rawValue) : [];

      if (!Array.isArray(parsed)) {
        continue;
      }

      for (const item of parsed) {
        if (
          item &&
          typeof item.id === "string" &&
          typeof item.text === "string" &&
          typeof item.createdAt === "string" &&
          typeof item.initials === "string"
        ) {
          entries.push({
            id: `${key}:${item.id}`,
            initials: item.initials,
            text:
              item.type === "comment"
                ? `${item.author ?? "Someone"} commented: ${item.text}`
                : `${item.author ?? "Someone"}: ${item.text}`,
            context,
            createdAt: item.createdAt,
          });
        }
      }
    }
  } catch {
    return [];
  }

  return entries
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
}

function Card({
  title,
  count,
  children,
}: {
  title: string;
  count?: string | number;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border app-border app-card">
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide app-text-muted">
          {title}
        </h2>

        {count !== undefined && (
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-bold text-violet-500">
            {count}
          </span>
        )}
      </div>

      {children}
    </section>
  );
}

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectColumn[]>(resourcePlanningMock);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = readStoredBoard();
    const visibleProjects = stored
      ? stored.projects.filter((project) => !stored.archivedIds.includes(project.id))
      : resourcePlanningMock;

    setProjects(visibleProjects);
    setActivity(readRecentActivity(visibleProjects));
    setIsLoaded(true);
  }, []);

  const metrics = useMemo(() => {
    const candidates: CandidateRef[] = projects.flatMap((project) =>
      project.positions.flatMap((position) =>
        position.candidates.map((candidate) => ({ project, position, candidate }))
      )
    );

    const openPositions = projects.flatMap((project) =>
      project.positions
        .filter((position) => position.status === "open")
        .map((position) => ({ project, position }))
    );

    const activeProjects = projects.filter(
      (project) => project.status === "active_search"
    );

    const inProcess = candidates.filter((item) => isInProcess(item.candidate));

    const ready = inProcess.filter(
      (item) => item.candidate.resumeStatus === "resume_ready"
    );

    const requested = projects
      .flatMap((project) => project.positions)
      .filter((position) => position.status === "open" || position.status === "hired")
      .reduce((total, position) => total + (position.quantity ?? 1), 0);

    const hired = candidates.filter((item) => isHired(item.candidate)).length;

    const attention: AttentionItem[] = [];

    inProcess
      .filter(
        (item) =>
          typeof item.candidate.daysInProcess === "number" &&
          item.candidate.daysInProcess >= AGING_THRESHOLD_DAYS
      )
      .forEach((item) =>
        attention.push({
          id: `aging-${item.candidate.id}`,
          tone: "warning",
          icon: <AlertTriangle className="h-4 w-4" />,
          title: `Aging alert · ${item.candidate.name}`,
          description: `${item.candidate.daysInProcess} days in process for ${item.position.title} · ${item.position.seniority} (${item.project.projectName}). Consider reviewing the next step.`,
        })
      );

    projects.forEach((project) =>
      project.positions
        .filter((position) => position.status === "on_hold")
        .forEach((position) =>
          attention.push({
            id: `hold-${position.id}`,
            tone: "warning",
            icon: <PauseCircle className="h-4 w-4" />,
            title: `Position on hold · ${position.title} · ${position.seniority}`,
            description: `${project.projectName} · ${project.clientName}. Review it with the client.`,
          })
        )
    );

    openPositions
      .filter((item) => item.position.candidates.length === 0)
      .forEach((item) =>
        attention.push({
          id: `empty-${item.position.id}`,
          tone: "danger",
          icon: <Inbox className="h-4 w-4" />,
          title: `No candidates yet · ${item.position.title} · ${item.position.seniority}`,
          description: `${item.project.projectName} has an open position with nobody linked.`,
        })
      );

    activeProjects
      .filter((project) => !project.positions.some((position) => position.status === "open"))
      .forEach((project) =>
        attention.push({
          id: `no-open-${project.id}`,
          tone: "danger",
          icon: <Inbox className="h-4 w-4" />,
          title: `No open positions · ${project.projectName}`,
          description: "Marked as active search but nothing is open.",
        })
      );

    projects
      .filter((project) => project.status === "active_no_search")
      .forEach((project) =>
        attention.push({
          id: `archive-${project.id}`,
          tone: "info",
          icon: <Archive className="h-4 w-4" />,
          title: `Ready to archive · ${project.projectName}`,
          description: `${project.clientName} has no open searches. You can archive it and keep its history.`,
        })
      );

    ready.forEach((item) =>
      attention.push({
        id: `ready-${item.candidate.id}`,
        tone: "success",
        icon: <CheckCircle2 className="h-4 w-4" />,
        title: `Ready to present · ${item.candidate.name}`,
        description: `${item.position.title} · ${item.position.seniority} (${item.project.projectName}) has a resume ready.`,
      })
    );

    const pipeline = pipelineStages.map((stage) => ({
      ...stage,
      count: candidates.filter(
        (item) =>
          (isHired(item.candidate) ? "hired" : item.candidate.processStatus) ===
          stage.value
      ).length,
    }));

    return {
      candidates,
      openPositions,
      activeProjects,
      inProcess,
      ready,
      requested,
      hired,
      attention,
      pipeline,
    };
  }, [projects]);

  if (!isLoaded) {
    return <div className="min-h-screen app-bg" />;
  }

  const maxPipelineCount = Math.max(1, ...metrics.pipeline.map((stage) => stage.count));
  const hiredPercent = Math.round(
    (metrics.hired / Math.max(metrics.requested, 1)) * 100
  );
  const visibleAttention = metrics.attention.slice(0, 8);

  const kpis: Array<{
    label: string;
    value: string | number;
    detail: string;
    accent: string;
    progress?: number;
  }> = [
    {
      label: "Active projects",
      value: metrics.activeProjects.length,
      detail: `${projects.length} in total`,
      accent: "text-violet-500",
    },
    {
      label: "Open positions",
      value: metrics.openPositions.length,
      detail: `across ${pluralize(
        new Set(metrics.openPositions.map((item) => item.project.id)).size,
        "project",
        "projects"
      )}`,
      accent: "text-sky-500",
    },
    {
      label: "Candidates in process",
      value: metrics.inProcess.length,
      detail: "not hired or rejected",
      accent: "text-emerald-500",
    },
    {
      label: "Ready to present",
      value: metrics.ready.length,
      detail: "resume ready, waiting for the client",
      accent: "text-amber-500",
    },
    {
      label: "Hired vs requested",
      value: `${metrics.hired} / ${metrics.requested}`,
      detail: "",
      accent: "text-emerald-500",
      progress: hiredPercent,
    },
  ];

  return (
    <div className="min-h-screen app-bg px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold app-text-primary">Dashboard</h1>

            <p className="mt-3 text-lg app-text-secondary">
              Recruiter Intelligence Overview
            </p>

            <p className="mt-1.5 text-xs app-text-muted">
              Every number is calculated from the Resource Planning board.
            </p>
          </div>

          <img
            src="/trick-studios-logo.png"
            alt="Trick Studios"
            className="h-12 w-auto"
          />
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border p-5 shadow-sm app-border app-card"
            >
              <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
                {kpi.label}
              </p>

              <p className={`mt-3 text-4xl font-bold leading-none ${kpi.accent}`}>
                {kpi.value}
              </p>

              {kpi.detail && (
                <p className="mt-2 text-sm app-text-secondary">{kpi.detail}</p>
              )}

              {kpi.progress !== undefined && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${kpi.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <div className="space-y-4">
            <Card title="Needs attention" count={metrics.attention.length}>
              {visibleAttention.length > 0 ? (
                visibleAttention.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 border-t px-5 py-3 app-border"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClass[item.tone]}`}
                    >
                      {item.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold app-text-primary">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 app-text-secondary">
                        {item.description}
                      </p>
                    </div>

                    <Link
                      href="/jobs"
                      className="shrink-0 self-center text-xs text-violet-500 underline"
                    >
                      Open board
                    </Link>
                  </div>
                ))
              ) : (
                <p className="border-t px-5 py-6 text-center text-sm app-border app-text-muted">
                  Nothing needs attention right now.
                </p>
              )}

              {metrics.attention.length > visibleAttention.length && (
                <p className="border-t px-5 py-3 text-xs app-border app-text-muted">
                  And {metrics.attention.length - visibleAttention.length} more on the
                  board.
                </p>
              )}
            </Card>

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
                      const projectCandidates = project.positions.flatMap(
                        (position) => position.candidates
                      );
                      const requested = project.positions
                        .filter(
                          (position) =>
                            position.status === "open" || position.status === "hired"
                        )
                        .reduce((total, position) => total + (position.quantity ?? 1), 0);
                      const hired = projectCandidates.filter(isHired).length;
                      const percent = requested
                        ? Math.min(100, Math.round((hired / requested) * 100))
                        : 0;
                      const priority = priorityBadge[project.priority];

                      return (
                        <tr key={project.id} className="border-t app-border">
                          <td className="px-5 py-3">
                            <p className="font-semibold app-text-primary">
                              {project.projectName}
                            </p>
                            <p className="text-xs app-text-muted">{project.clientName}</p>
                          </td>

                          <td className="px-5 py-3">
                            <span
                              className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold app-text-primary ${priority.className}`}
                            >
                              {priority.label}
                            </span>
                          </td>

                          <td className="px-5 py-3 app-text-primary">
                            {
                              project.positions.filter(
                                (position) => position.status === "open"
                              ).length
                            }
                          </td>

                          <td className="px-5 py-3 app-text-primary">
                            {projectCandidates.filter(isInProcess).length}
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
                                {hired} / {requested}
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
          </div>

          <div className="space-y-4 self-start">
            <Card title="Pipeline" count={pluralize(metrics.candidates.length, "candidate", "candidates")}>
              <div className="px-5 pb-4 pt-1">
                {metrics.pipeline.map((stage) => (
                  <div
                    key={stage.value}
                    className="grid grid-cols-[120px_1fr_28px] items-center gap-3 py-1.5 text-sm"
                  >
                    <span className="app-text-secondary">{stage.label}</span>

                    <div className="h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500"
                        style={{ width: `${(stage.count / maxPipelineCount) * 100}%` }}
                      />
                    </div>

                    <span className="text-right font-bold app-text-primary">
                      {stage.count}
                    </span>
                  </div>
                ))}
              </div>
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
      </div>
    </div>
  );
}