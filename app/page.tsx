"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  resourcePlanningMock,
  type ProjectColumn,
} from "@/app/data/resourcePlanningMock";
import { readStoredBoard } from "@/app/lib/boardStorage";
import { getRoleOf, useCurrentUser } from "@/app/lib/currentUser";
import { levelOf, usePermissions } from "@/app/lib/permissions";
import {
  buildRecruiterStats,
  flattenCandidates,
  requisitionAverage,
  type MetricsPeriod,
} from "@/app/lib/recruiterMetrics";
import { useStageSla } from "@/app/lib/stageSla";
import { getInternalUsers, useUsers } from "@/app/lib/userDirectory";
import { MyMetricsSection } from "./components/dashboard/MyMetricsSection";
import { NoAccessScreen } from "./components/dashboard/NoAccessScreen";
import { OverviewSection, type ActivityEntry } from "./components/dashboard/OverviewSection";
import { PerformanceSection } from "./components/dashboard/PerformanceSection";
import { SlaSection } from "./components/dashboard/SlaSection";
import { MyTodoCard } from "./components/todo/MyTodoCard";
import { CurrentUserSwitcher } from "./components/resource-planning/CurrentUserSwitcher";

type Section = "overview" | "performance" | "mine" | "sla";

const SECTION_LABELS: Record<Section, string> = {
  overview: "Overview",
  performance: "Recruiter performance",
  mine: "My metrics",
  sla: "Stage times (SLA)",
};

const SECTION_HINTS: Record<Section, string> = {
  overview: "Every number is calculated from the Resource Planning board.",
  performance:
    "How each recruiter is doing: volume, by role, and time per stage against the expected range.",
  mine: "Your own numbers: volume, time per stage against the expected range, and conversion.",
  sla: "Expected time per stage (from the Recruiting process document). One table drives the alerts, the pipeline colors and the metrics.",
};

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

function loadProjects(): ProjectColumn[] {
  const stored = readStoredBoard();

  return stored
    ? stored.projects.filter((project) => !stored.archivedIds.includes(project.id))
    : resourcePlanningMock;
}

export default function HomePage() {
  const { user, role } = useCurrentUser();
  const config = useStageSla();
  const permissions = usePermissions();
  const users = useUsers();
  const [projects, setProjects] = useState<ProjectColumn[]>(resourcePlanningMock);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [section, setSection] = useState<Section>("overview");
  const [period, setPeriod] = useState<MetricsPeriod>("90d");
  // Recruiter que Talent/Admin abre desde "Recruiter performance"
  const [openRecruiter, setOpenRecruiter] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const visible = loadProjects();

    setProjects(visible);
    setActivity(readRecentActivity(visible));
  }, []);

  useEffect(() => {
    refresh();
    setIsLoaded(true);

    // El tablero se actualiza en esta pestaña (rp-board) o en otra (storage)
    window.addEventListener("rp-board", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("rp-board", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const recruiters = useMemo(
    () => getInternalUsers(users).filter((name) => getRoleOf(name) === "recruiter"),
    [users]
  );

  const stats = useMemo(
    () => buildRecruiterStats(projects, recruiters, period, config),
    [projects, recruiters, period, config]
  );

  const requisition = useMemo(() => requisitionAverage(projects), [projects]);
  // Qué secciones ve cada rol sale de la matriz de permisos (sección D)
  const level = (area: Parameters<typeof levelOf>[1]) => levelOf(role, area, permissions);
  const talentView = level("dashboard_others") !== "none";
  const slaLevel = level("dashboard_sla");
  const sections: Section[] = [
    ...(level("dashboard_overview") !== "none" ? (["overview"] as Section[]) : []),
    ...(talentView ? (["performance"] as Section[]) : []),
    ...(level("dashboard_mine") !== "none" ? (["mine"] as Section[]) : []),
    ...(slaLevel !== "none" ? (["sla"] as Section[]) : []),
  ];
  const activeSection: Section = sections.includes(section) ? section : sections[0];

  if (sections.length === 0) {
    return <NoAccessScreen area="the Dashboard" />;
  }

  if (!isLoaded) {
    return <div className="min-h-screen app-bg" />;
  }

  // Dueña de las métricas que se muestran en "My metrics"
  const metricsOwner = talentView ? (openRecruiter ?? recruiters[0]) : user;
  const ownerStats =
    stats.find((item) => item.name === metricsOwner) ??
    buildRecruiterStats(projects, [metricsOwner], period, config)[0];
  const otherStats = stats.find((item) => item.name !== metricsOwner);
  const hasCandidates = flattenCandidates(projects).length > 0;

  return (
    <div className="min-h-screen app-bg px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold app-text-primary">Dashboard</h1>

            <p className="mt-3 text-lg app-text-secondary">
              {talentView ? "Recruiter Intelligence Overview" : `Your numbers, ${user}`}
            </p>

            <p className="mt-1.5 text-xs app-text-muted">{SECTION_HINTS[activeSection]}</p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <img src="/trick-studios-logo.png" alt="Trick Studios" className="h-12 w-auto" />
            <CurrentUserSwitcher />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {sections.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSection(key);

                if (key !== "mine") {
                  setOpenRecruiter(null);
                }
              }}
              style={
                activeSection === key
                  ? { backgroundColor: "#7c3aed", color: "#ffffff", borderColor: "#7c3aed" }
                  : undefined
              }
              className="rounded-xl border px-4 py-2 text-sm font-semibold app-border app-text-secondary hover:border-violet-500"
            >
              {SECTION_LABELS[key]}
            </button>
          ))}

          {(activeSection === "mine" || activeSection === "performance") && (
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as MetricsPeriod)}
              className="app-input ml-auto rounded-lg border px-3 py-2 text-sm outline-none"
              aria-label="Period"
            >
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="ytd">Year to date</option>
            </select>
          )}
        </div>

        <div className="mt-5">
          {!hasCandidates && activeSection !== "sla" && (
            <p className="mb-4 rounded-xl border px-4 py-3 text-sm app-border app-text-muted">
              There are no candidates on the board yet, so the numbers are empty.
            </p>
          )}

          {activeSection === "overview" && (
            <OverviewSection projects={projects} config={config} activity={activity} />
          )}

          {activeSection === "performance" && (
            <PerformanceSection
              stats={stats}
              config={config}
              period={period}
              requisition={requisition}
              onOpen={(name) => {
                setOpenRecruiter(name);
                setSection("mine");
              }}
            />
          )}

          {activeSection === "mine" && ownerStats && (
            <div className="space-y-4">
              {!talentView && <MyTodoCard />}

              {talentView && recruiters.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="app-text-muted">Recruiter:</span>
                  {recruiters.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setOpenRecruiter(name)}
                      style={
                        name === metricsOwner
                          ? { backgroundColor: "#7c3aed", color: "#ffffff", borderColor: "#7c3aed" }
                          : undefined
                      }
                      className="rounded-full border px-3 py-1 text-xs font-semibold app-border app-text-secondary"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              <MyMetricsSection
                stats={ownerStats}
                other={talentView ? otherStats : undefined}
                config={config}
                isOwnView={!talentView}
                onBack={
                  talentView
                    ? () => {
                        setOpenRecruiter(null);
                        setSection("performance");
                      }
                    : undefined
                }
              />
            </div>
          )}

          {activeSection === "sla" && <SlaSection config={config} readOnly={slaLevel !== "full"} />}
        </div>
      </div>
    </div>
  );
}
