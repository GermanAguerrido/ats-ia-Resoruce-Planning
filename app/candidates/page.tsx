"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Plus } from "lucide-react";
import { ResourcePlanningDetailModal } from "../components/resource-planning/ResourcePlanningDetailModal";
import { CreateEntityModal } from "../components/resource-planning/CreateEntityModal";
import { useBoardState } from "../hooks/useBoardState";
import type {
  CandidateMini,
  CandidateProcessStatus,
  CandidateResumeStatus,
  CandidateTalentType,
  PositionCard,
  ProjectColumn,
} from "../data/resourcePlanningMock";

type Tone = "violet" | "green" | "blue" | "amber" | "red" | "gray";

type CandidateLink = {
  project: ProjectColumn;
  position: PositionCard;
  candidate: CandidateMini;
};

type CandidateRow = {
  id: string;
  main: CandidateMini;
  links: CandidateLink[];
};

type SortKey = "name" | "days" | "lastContact";
type QuickFilter = "all" | "live" | "ready" | "aging" | "hired";

type ModalSession = {
  projectId: string;
  initialPosition: PositionCard;
  initialCandidate: CandidateMini;
};

type CreateTarget =
  | { kind: "pool" }
  | { kind: "position"; projectId: string }
  | { kind: "candidate"; projectId: string; positionId: string }
  | null;

const AGING_THRESHOLD_DAYS = 14;

const processLabels: Record<CandidateProcessStatus, { label: string; tone: Tone }> = {
  sourced: { label: "Sourced", tone: "gray" },
  contacted: { label: "Contacted", tone: "blue" },
  screening: { label: "Screening", tone: "blue" },
  presented: { label: "Presented", tone: "violet" },
  tech_interview: { label: "Tech Interview", tone: "violet" },
  client_interview: { label: "Client Interview", tone: "amber" },
  offer: { label: "Offer", tone: "amber" },
  hired: { label: "Hired", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  stand_by: { label: "Stand by", tone: "gray" },
};

const resumeLabels: Record<CandidateResumeStatus, { label: string; tone: Tone }> = {
  none: { label: "No resume", tone: "gray" },
  wip_resume: { label: "WIP resume", tone: "amber" },
  resume_ready: { label: "Resume ready", tone: "green" },
};

const talentLabels: Record<CandidateTalentType, { label: string; tone: Tone }> = {
  external: { label: "External", tone: "blue" },
  internal_candidate: { label: "Internal", tone: "violet" },
  trick_internal: { label: "Trick internal", tone: "amber" },
};

const filterControlClass =
  "rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-violet-500 app-input";

function isHired(candidate: CandidateMini) {
  return (
    candidate.processStatus === "hired" || candidate.talentType === "trick_internal"
  );
}

function isInProcess(candidate: CandidateMini) {
  return !isHired(candidate) && candidate.processStatus !== "rejected";
}

function isAging(candidate: CandidateMini) {
  return (
    isInProcess(candidate) &&
    typeof candidate.daysInProcess === "number" &&
    candidate.daysInProcess >= AGING_THRESHOLD_DAYS
  );
}

function uniqueSorted(values: Array<string | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value?.trim())))
  ).sort((a, b) => a.localeCompare(b));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CandidatesStyles() {
  return (
    <style>{`
      .cd-tag {
        display: inline-block; white-space: nowrap; border-radius: 9999px;
        border: 1px solid; padding: 3px 10px; font-size: 11px; font-weight: 700;
      }
      .cd-tag-violet { background: rgba(124,58,237,.12); border-color: rgba(124,58,237,.4); color: #6d28d9; }
      .cd-tag-green  { background: rgba(34,197,94,.14);  border-color: rgba(34,197,94,.45);  color: #15803d; }
      .cd-tag-blue   { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.4);  color: #1d4ed8; }
      .cd-tag-amber  { background: rgba(245,158,11,.16); border-color: rgba(245,158,11,.45); color: #b45309; }
      .cd-tag-red    { background: rgba(239,68,68,.12);  border-color: rgba(239,68,68,.4);   color: #b91c1c; }
      .cd-tag-gray   { background: rgba(113,113,122,.12); border-color: rgba(113,113,122,.35); color: #52525b; }
      html[data-theme="dark"] .cd-tag-violet { background: rgba(124,58,237,.18); border-color: rgba(124,58,237,.5); color: #c4b5fd; }
      html[data-theme="dark"] .cd-tag-green  { background: rgba(34,197,94,.16);  border-color: rgba(34,197,94,.45);  color: #86efac; }
      html[data-theme="dark"] .cd-tag-blue   { background: rgba(59,130,246,.16); border-color: rgba(59,130,246,.45); color: #93c5fd; }
      html[data-theme="dark"] .cd-tag-amber  { background: rgba(245,158,11,.16); border-color: rgba(245,158,11,.45); color: #fcd34d; }
      html[data-theme="dark"] .cd-tag-red    { background: rgba(239,68,68,.16);  border-color: rgba(239,68,68,.45);  color: #fca5a5; }
      html[data-theme="dark"] .cd-tag-gray   { background: rgba(161,161,170,.12); border-color: rgba(161,161,170,.3); color: #d4d4d8; }
      .cd-aging { color: #d97706; font-weight: 700; }
      html[data-theme="dark"] .cd-aging { color: #fbbf24; }
      .cd-pill {
        display: inline-block; border: 1px solid var(--app-border); border-radius: 9999px;
        background: var(--app-surface-muted); padding: 3px 9px; font-size: 11px;
        color: var(--app-text-secondary); white-space: nowrap;
      }
      .cd-pill:hover { border-color: #8b5cf6; color: var(--app-text-primary); }
    `}</style>
  );
}

function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`cd-tag cd-tag-${tone}`}>{children}</span>;
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: 1 | -1;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeKey === sortKey;
  const Icon = !isActive ? ArrowUpDown : direction === 1 ? ArrowUp : ArrowDown;

  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide hover:underline"
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

export default function CandidatesPage() {
  const board = useBoardState();
  const { isLoaded, projectColumns, orderedProjects } = board;

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [resumeFilter, setResumeFilter] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [englishFilter, setEnglishFilter] = useState("");
  const [onlyInProcess, setOnlyInProcess] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sort, setSort] = useState<{ key: SortKey; direction: 1 | -1 }>({
    key: "lastContact",
    direction: -1,
  });

  const [modalSession, setModalSession] = useState<ModalSession | null>(null);
  const [createTarget, setCreateTarget] = useState<CreateTarget>(null);

  // Una fila por candidato; si está en varias posiciones, junta todos sus vínculos.
  const rows = useMemo(() => {
    const byId = new Map<string, CandidateRow>();

    orderedProjects.forEach((project) =>
      project.positions.forEach((position) =>
        position.candidates.forEach((candidate) => {
          const link: CandidateLink = { project, position, candidate };
          const existing = byId.get(candidate.id);

          if (existing) {
            existing.links.push(link);
          } else {
            byId.set(candidate.id, { id: candidate.id, main: candidate, links: [link] });
          }
        })
      )
    );

    return Array.from(byId.values());
  }, [orderedProjects]);

  const recruiterOptions = useMemo(
    () => uniqueSorted(rows.map((row) => row.main.recruiterOwner)),
    [rows]
  );

  const englishOptions = useMemo(
    () => uniqueSorted(rows.map((row) => row.main.englishLevel)),
    [rows]
  );

  const quickCounts = useMemo(
    () => ({
      all: rows.length,
      live: rows.filter((row) => isInProcess(row.main)).length,
      ready: rows.filter(
        (row) => isInProcess(row.main) && row.main.resumeStatus === "resume_ready"
      ).length,
      aging: rows.filter((row) => isAging(row.main)).length,
      hired: rows.filter((row) => isHired(row.main)).length,
    }),
    [rows]
  );

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      const candidate = row.main;

      if (term) {
        const haystack = [
          candidate.name,
          candidate.role,
          candidate.location,
          ...row.links.flatMap((link) => [
            link.project.projectName,
            link.project.clientName,
            link.position.title,
          ]),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(term)) return false;
      }

      if (projectFilter && !row.links.some((link) => link.project.id === projectFilter)) {
        return false;
      }
      if (statusFilter && candidate.processStatus !== statusFilter) return false;
      if (resumeFilter && candidate.resumeStatus !== resumeFilter) return false;
      if (recruiterFilter && candidate.recruiterOwner !== recruiterFilter) return false;
      if (englishFilter && candidate.englishLevel !== englishFilter) return false;
      if (onlyInProcess && !isInProcess(candidate)) return false;

      if (quickFilter === "live" && !isInProcess(candidate)) return false;
      if (
        quickFilter === "ready" &&
        !(isInProcess(candidate) && candidate.resumeStatus === "resume_ready")
      ) {
        return false;
      }
      if (quickFilter === "aging" && !isAging(candidate)) return false;
      if (quickFilter === "hired" && !isHired(candidate)) return false;

      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;

      if (sort.key === "name") {
        comparison = a.main.name.localeCompare(b.main.name);
      } else if (sort.key === "days") {
        comparison = (a.main.daysInProcess ?? -1) - (b.main.daysInProcess ?? -1);
      } else {
        comparison = (a.main.lastContactAt ?? "").localeCompare(b.main.lastContactAt ?? "");
      }

      return comparison * sort.direction;
    });
  }, [
    rows,
    search,
    projectFilter,
    statusFilter,
    resumeFilter,
    recruiterFilter,
    englishFilter,
    onlyInProcess,
    quickFilter,
    sort,
  ]);

  const hasActiveFilters = Boolean(
    search ||
      projectFilter ||
      statusFilter ||
      resumeFilter ||
      recruiterFilter ||
      englishFilter ||
      onlyInProcess ||
      quickFilter !== "all"
  );

  const clearFilters = () => {
    setSearch("");
    setProjectFilter("");
    setStatusFilter("");
    setResumeFilter("");
    setRecruiterFilter("");
    setEnglishFilter("");
    setOnlyInProcess(false);
    setQuickFilter("all");
  };

  const handleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 1 ? -1 : 1 }
        : { key, direction: key === "name" ? 1 : -1 }
    );
  };

  const openCandidate = (link: CandidateLink) => {
    setModalSession({
      projectId: link.project.id,
      initialPosition: link.position,
      initialCandidate: link.candidate,
    });
  };

  const handleArchive = (projectId: string) => {
    board.archiveProject(projectId);
    setModalSession(null);
  };

  const modalProject = modalSession
    ? (projectColumns.find((project) => project.id === modalSession.projectId) ??
      null)
    : null;

  const createProjectTarget =
    createTarget && createTarget.kind !== "pool"
      ? (projectColumns.find((project) => project.id === createTarget.projectId) ??
        null)
      : null;

  const createPositionTarget =
    createTarget && createTarget.kind === "candidate"
      ? (createProjectTarget?.positions.find(
          (position) => position.id === createTarget.positionId
        ) ?? null)
      : null;

  const projectsWithPositions = orderedProjects.filter(
    (project) => project.positions.length > 0
  );

  if (!isLoaded) {
    return <div className="min-h-screen app-bg" />;
  }

  const quickItems: Array<{ value: QuickFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "live", label: "In process" },
    { value: "ready", label: "Ready to present" },
    { value: "aging", label: "14+ days" },
    { value: "hired", label: "Hired" },
  ];

  return (
    <div className="min-h-screen app-bg px-8 py-8">
      <CandidatesStyles />

      <div className="mx-auto max-w-[1700px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold app-text-primary">Candidates</h1>

            <p className="mt-3 text-base app-text-secondary">
              Everyone linked to a position in Resource Planning. One source of truth.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreateTarget({ kind: "pool" })}
            style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add candidate
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {quickItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setQuickFilter(item.value)}
              className={`min-w-[150px] rounded-xl border px-4 py-2.5 text-left transition app-card ${
                quickFilter === item.value
                  ? "border-violet-500 bg-violet-500/10"
                  : "app-border hover:border-violet-500/50"
              }`}
            >
              <span className="block text-[11px] font-semibold uppercase tracking-wide app-text-muted">
                {item.label}
              </span>
              <span className="mt-1 block text-2xl font-bold app-text-primary">
                {quickCounts[item.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, role, project, position or location..."
            className={`${filterControlClass} min-w-[280px]`}
          />

          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className={filterControlClass}
          >
            <option value="">All projects</option>
            {orderedProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.projectName} · {project.clientName}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={filterControlClass}
          >
            <option value="">All statuses</option>
            {(Object.keys(processLabels) as CandidateProcessStatus[]).map((status) => (
              <option key={status} value={status}>
                {processLabels[status].label}
              </option>
            ))}
          </select>

          <select
            value={resumeFilter}
            onChange={(event) => setResumeFilter(event.target.value)}
            className={filterControlClass}
          >
            <option value="">All resumes</option>
            {(Object.keys(resumeLabels) as CandidateResumeStatus[]).map((status) => (
              <option key={status} value={status}>
                {resumeLabels[status].label}
              </option>
            ))}
          </select>

          <select
            value={recruiterFilter}
            onChange={(event) => setRecruiterFilter(event.target.value)}
            className={filterControlClass}
          >
            <option value="">All recruiters</option>
            {recruiterOptions.map((recruiter) => (
              <option key={recruiter} value={recruiter}>
                {recruiter}
              </option>
            ))}
          </select>

          <select
            value={englishFilter}
            onChange={(event) => setEnglishFilter(event.target.value)}
            className={filterControlClass}
          >
            <option value="">All English levels</option>
            {englishOptions.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 app-border">
            <input
              type="checkbox"
              checked={onlyInProcess}
              onChange={(event) => setOnlyInProcess(event.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            <span className="text-sm app-text-secondary">Only in process</span>
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border px-3 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-sm app-text-muted">
            {visibleRows.length} of {rows.length} candidates
          </span>
        </div>

        <div className="mt-4 overflow-auto rounded-2xl border app-border app-card">
          <table className="w-full min-w-[1250px] text-sm">
            <thead className="app-table-header">
              <tr className="text-left">
                <SortHeader
                  label="Candidate"
                  sortKey="name"
                  activeKey={sort.key}
                  direction={sort.direction}
                  onSort={handleSort}
                />
                {["Location", "Project · Position", "Process status", "Resume", "Talent type", "English", "Recruiter"].map(
                  (label) => (
                    <th
                      key={label}
                      className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide"
                    >
                      {label}
                    </th>
                  )
                )}
                <SortHeader
                  label="Days in process"
                  sortKey="days"
                  activeKey={sort.key}
                  direction={sort.direction}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Last contact"
                  sortKey="lastContact"
                  activeKey={sort.key}
                  direction={sort.direction}
                  onSort={handleSort}
                />
                <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide">
                  Expected salary
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row) => {
                const candidate = row.main;
                const process = processLabels[candidate.processStatus];
                const resume = resumeLabels[candidate.resumeStatus];
                const talent = talentLabels[candidate.talentType];
                const aging = isAging(candidate);

                return (
                  <tr
                    key={row.id}
                    onClick={() => openCandidate(row.links[0])}
                    className="app-table-row cursor-pointer border-t app-border"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="rp-avatar-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                          {getInitials(candidate.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold app-text-primary">{candidate.name}</p>
                          <p className="text-xs app-text-muted">{candidate.role}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 app-text-secondary">{candidate.location}</td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {row.links.map((link) => (
                          <button
                            key={`${link.project.id}-${link.position.id}`}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openCandidate(link);
                            }}
                            className="cd-pill"
                            title="Open this candidate in this position"
                          >
                            {link.project.projectName} · {link.position.title} ·{" "}
                            {link.position.seniority}
                          </button>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Tag tone={process.tone}>{process.label}</Tag>
                    </td>

                    <td className="px-4 py-3">
                      <Tag tone={resume.tone}>{resume.label}</Tag>
                    </td>

                    <td className="px-4 py-3">
                      <Tag tone={talent.tone}>{talent.label}</Tag>
                    </td>

                    <td className="px-4 py-3 app-text-secondary">
                      {candidate.englishLevel || "—"}
                    </td>

                    <td className="px-4 py-3 app-text-secondary">
                      {candidate.recruiterOwner || "—"}
                    </td>

                    <td className={`px-4 py-3 ${aging ? "cd-aging" : "app-text-primary"}`}>
                      {aging && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}
                      {candidate.daysInProcess ?? "—"}
                    </td>

                    <td className="px-4 py-3 app-text-secondary">
                      {candidate.lastContactAt || "—"}
                    </td>

                    <td className="px-4 py-3 app-text-secondary">
                      {candidate.salaryExpected || "—"}
                    </td>
                  </tr>
                );
              })}

              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center app-text-muted">
                    {rows.length === 0
                      ? "No candidates yet. Add one to a position to get started."
                      : "No candidates match the current filters"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalSession && modalProject && (
        <ResourcePlanningDetailModal
          project={modalProject}
          initialPosition={modalSession.initialPosition}
          initialCandidate={modalSession.initialCandidate}
          onClose={() => setModalSession(null)}
          onProjectUpdate={board.updateProject}
          onPositionUpdate={board.updatePosition}
          onCandidateUpdate={board.updateCandidate}
          onProjectArchive={handleArchive}
          onAddPosition={(project) =>
            setCreateTarget({ kind: "position", projectId: project.id })
          }
          onAddCandidate={(project, position) =>
            setCreateTarget({
              kind: "candidate",
              projectId: project.id,
              positionId: position.id,
            })
          }
        />
      )}

      {createTarget?.kind === "pool" && (
        <CreateEntityModal
          mode="candidate"
          projects={projectsWithPositions}
          onClose={() => setCreateTarget(null)}
          onCreateProject={board.createProject}
          onCreatePosition={board.createPosition}
          onCreateCandidate={board.createCandidate}
        />
      )}

      {createTarget?.kind === "position" && createProjectTarget && (
        <CreateEntityModal
          mode="position"
          project={createProjectTarget}
          onClose={() => setCreateTarget(null)}
          onCreateProject={board.createProject}
          onCreatePosition={board.createPosition}
          onCreateCandidate={board.createCandidate}
        />
      )}

      {createTarget?.kind === "candidate" &&
        createProjectTarget &&
        createPositionTarget && (
          <CreateEntityModal
            mode="candidate"
            project={createProjectTarget}
            position={createPositionTarget}
            onClose={() => setCreateTarget(null)}
            onCreateProject={board.createProject}
            onCreatePosition={board.createPosition}
            onCreateCandidate={board.createCandidate}
          />
        )}
    </div>
  );
}