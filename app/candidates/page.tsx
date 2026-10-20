"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ResourcePlanningDetailModal } from "../components/resource-planning/ResourcePlanningDetailModal";
import { CreateEntityModal } from "../components/resource-planning/CreateEntityModal";
import {
  CandidatesCollection,
  type CandidatesView,
  type SortKey,
  type SortState,
} from "../components/candidates/CandidatesCollection";
import { CandidatesStyles } from "../components/candidates/CandidatesStyles";
import { PAGE_SIZES, Pagination } from "../components/candidates/Pagination";
import { RecontactDialog } from "../components/candidates/RecontactDialog";
import { RoleDemandPanel } from "../components/candidates/RoleDemandPanel";
import { StudioLogo } from "../components/candidates/StudioLogo";
import { useBoardState } from "../hooks/useBoardState";
import { appendActivityLog } from "../lib/activityLog";
import { useBudgetConfig } from "../lib/candidateBudget";
import {
  buildCandidateRows,
  isInternalRow,
  rowSeniority,
  type CandidateLink,
  type CandidateRow,
} from "../lib/candidateRows";
import { buildNotesIndex } from "../lib/candidateSearch";
import { PROCESS_FLOW, PROCESS_OUTCOMES, PROCESS_STATUS_INFO, seniorityRank } from "../lib/candidateStatus";
import { COMPETITOR_COMPANIES, isCompetitor } from "../lib/companies";
import { useCurrentUser } from "../lib/currentUser";
import { buildCandidateDirectory } from "../lib/candidateDirectory";
import { ENGLISH_LEVELS, englishRank } from "../lib/englishLevels";
import { pushNotification } from "../lib/notifications";
import { buildRoleDemand } from "../lib/roleDemand";
import { roleKey, SENIORITY_BANDS, bandIndex } from "../lib/roles";
import { daysSince, getDaysInProcess } from "../lib/candidateStatus";
import type { PositionCard, CandidateMini } from "../data/resourcePlanningMock";

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

type Filters = {
  status: string;
  recruiter: string;
  english: string;
  seniority: string;
  company: string;
};

const EMPTY_FILTERS: Filters = { status: "", recruiter: "", english: "", seniority: "", company: "" };
const INTERNAL_STATUS = "__internal__";
const ANY_COMPETITOR = "__competitor__";
const VIEW_KEY = "ats-ia:resource-planning:candidates-view";
const MAX_TABS = 12;

const statusOptions = [...PROCESS_FLOW.filter((item) => item.value !== "hired"), ...PROCESS_OUTCOMES];

const filterControlClass =
  "rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-violet-500 app-input";

function compareRows(a: CandidateRow, b: CandidateRow, sort: SortState) {
  const byName = a.main.name.localeCompare(b.main.name);

  if (sort.key === "default") {
    return (
      seniorityRank(rowSeniority(b)) - seniorityRank(rowSeniority(a)) ||
      englishRank(b.main.englishLevel) - englishRank(a.main.englishLevel) ||
      byName
    );
  }

  let comparison = 0;

  if (sort.key === "name") comparison = byName;
  else if (sort.key === "seniority")
    comparison = seniorityRank(rowSeniority(a)) - seniorityRank(rowSeniority(b));
  else if (sort.key === "english")
    comparison = englishRank(a.main.englishLevel) - englishRank(b.main.englishLevel);
  else if (sort.key === "days")
    comparison = (getDaysInProcess(a.main) ?? -1) - (getDaysInProcess(b.main) ?? -1);
  else comparison = (daysSince(b.main.lastContactAt) ?? -1) - (daysSince(a.main.lastContactAt) ?? -1);

  return comparison * sort.direction || byName;
}

export default function CandidatesPage() {
  const board = useBoardState();
  const { isLoaded, projectColumns, orderedProjects } = board;
  const { user } = useCurrentUser();
  const { config: budget } = useBudgetConfig();

  const [search, setSearch] = useState("");
  const [roleSel, setRoleSel] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortState>({ key: "default", direction: -1 });
  const [view, setView] = useState<CandidatesView>("compact");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
  const [notesVersion, setNotesVersion] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const [modalSession, setModalSession] = useState<ModalSession | null>(null);
  const [createTarget, setCreateTarget] = useState<CreateTarget>(null);
  const [recontactRow, setRecontactRow] = useState<CandidateRow | null>(null);

  // Vista elegida (se recuerda en este navegador)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_KEY);

      if (stored === "compact" || stored === "agile" || stored === "full") {
        setView(stored);
      }
    } catch {
      // Local storage can fail in private browsing or quota situations.
    }
  }, []);

  const changeView = (next: CandidatesView) => {
    setView(next);

    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Local storage can fail in private browsing or quota situations.
    }
  };

  // Si otra pestaña cambia notas, se actualiza la búsqueda por notas
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key.startsWith("rp-notes:")) {
        setNotesVersion((current) => current + 1);
      }
    };

    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Aviso cuando los datos se actualizaron desde otra pestaña
  useEffect(() => {
    if (board.remoteSyncAt) {
      setNotice("Updated with changes made in another tab.");
    }
  }, [board.remoteSyncAt]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 4000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const allRows = useMemo(() => buildCandidateRows(orderedProjects), [orderedProjects]);

  const notes = useMemo(
    () => buildNotesIndex(allRows.map((row) => row.main)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRows, notesVersion]
  );

  // Contratados: pasan a Internal y no aparecen en la base salvo que se pidan
  const internalCount = useMemo(() => allRows.filter(isInternalRow).length, [allRows]);

  const baseRows = useMemo(() => allRows.filter((row) => !isInternalRow(row)), [allRows]);

  const demand = useMemo(
    () =>
      buildRoleDemand(
        baseRows.map((row) => ({ role: row.main.role, seniority: rowSeniority(row) })),
        orderedProjects
      ),
    [baseRows, orderedProjects]
  );

  // Pestañas por rol (como las hojas de un Excel)
  const roleTabs = useMemo(() => demand.filter((item) => item.total > 0), [demand]);

  const recruiterOptions = useMemo(
    () =>
      Array.from(
        new Set(allRows.map((row) => row.main.recruiterOwner).filter((v): v is string => Boolean(v)))
      ).sort((a, b) => a.localeCompare(b)),
    [allRows]
  );

  const companyOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...COMPETITOR_COMPANIES,
          ...allRows.flatMap((row) => row.main.previousCompanies ?? []),
        ])
      ).sort((a, b) => a.localeCompare(b)),
    [allRows]
  );

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const showInternal = filters.status === INTERNAL_STATUS;

    return (showInternal ? allRows.filter(isInternalRow) : baseRows)
      .filter((row) => {
        const candidate = row.main;

        if (roleSel && roleKey(candidate.role) !== roleSel) return false;

        if (term) {
          const haystack = `${candidate.name} ${candidate.role} ${notes.get(row.id) ?? ""}`.toLowerCase();

          if (!haystack.includes(term)) return false;
        }

        if (filters.status && !showInternal && candidate.processStatus !== filters.status) return false;
        if (filters.recruiter && candidate.recruiterOwner !== filters.recruiter) return false;
        if (filters.english && candidate.englishLevel !== filters.english) return false;
        if (filters.seniority && SENIORITY_BANDS[bandIndex(rowSeniority(row))] !== filters.seniority)
          return false;

        if (filters.company) {
          const companies = candidate.previousCompanies ?? [];

          if (filters.company === ANY_COMPETITOR) {
            if (!companies.some(isCompetitor)) return false;
          } else if (!companies.includes(filters.company)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => compareRows(a, b, sort));
  }, [allRows, baseRows, notes, roleSel, search, filters, sort]);

  // Volver a la primera página cuando cambia la búsqueda o un filtro
  useEffect(() => {
    setPage(1);
  }, [search, roleSel, filters, sort, pageSize]);

  const pages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(page, pages);
  const pageRows = visibleRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const hasActiveFilters = Boolean(
    search || roleSel || Object.values(filters).some(Boolean) || sort.key !== "default"
  );

  const clearFilters = () => {
    setSearch("");
    setRoleSel("");
    setFilters(EMPTY_FILTERS);
    setSort({ key: "default", direction: -1 });
  };

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const handleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 1 ? -1 : 1 }
        : { key, direction: key === "name" ? 1 : -1 }
    );
  };

  const openLink = (link: CandidateLink) => {
    setModalSession({
      projectId: link.project.id,
      initialPosition: link.position,
      initialCandidate: link.candidate,
    });
  };

  // Enlace directo a una persona: /candidates?open=<id> (sirve para abrirla en otra pestaña)
  useEffect(() => {
    if (!isLoaded || modalSession) {
      return;
    }

    const wanted = new URLSearchParams(window.location.search).get("open");
    const row = wanted ? allRows.find((item) => item.id === wanted) : undefined;

    if (row) {
      openLink(row.links[0]);
    }
    // Solo al cargar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const requestRecontact = (row: CandidateRow, message: string) => {
    const link = row.links[0];
    const recruiter = row.main.recruiterOwner;

    if (!recruiter) {
      return;
    }

    board.updateCandidate(row.id, {
      recontactRequestedAt: new Date().toISOString(),
      recontactRequestedBy: user,
    });

    pushNotification({
      to: recruiter,
      from: user,
      kind: "recontact",
      text: `${user} asks you to recontact ${row.main.name}${message ? `: ${message}` : "."}`,
      candidateId: row.id,
      candidateName: row.main.name,
      projectId: link.project.id,
      positionId: link.position.id,
    });

    appendActivityLog(
      `rp-activity:project:${link.project.id}:position:${link.position.id}:candidate:${row.id}`,
      `Recontact requested to ${recruiter}${message ? `: ${message}` : ""}`,
      { author: user, type: message ? "comment" : "action" }
    );

    setRecontactRow(null);
    setNotice(`${recruiter} was notified.`);
  };

  const handleArchive = (projectId: string) => {
    board.archiveProject(projectId);
    setModalSession(null);
  };

  const modalProject = modalSession
    ? (projectColumns.find((project) => project.id === modalSession.projectId) ?? null)
    : null;

  const createProjectTarget =
    createTarget && createTarget.kind !== "pool"
      ? (projectColumns.find((project) => project.id === createTarget.projectId) ?? null)
      : null;

  const createPositionTarget =
    createTarget && createTarget.kind === "candidate"
      ? (createProjectTarget?.positions.find((position) => position.id === createTarget.positionId) ??
        null)
      : null;

  // Candidatos existentes (para buscarlos y sumarlos a una posición)
  const candidateDirectory = useMemo(
    () => buildCandidateDirectory(projectColumns),
    [projectColumns]
  );

  // Abre la ficha de un candidato existente (por ejemplo desde el aviso de duplicado)
  const openExistingCandidate = (projectId: string, positionId: string, candidateId: string) => {
    const project = projectColumns.find((item) => item.id === projectId);
    const position = project?.positions.find((item) => item.id === positionId);
    const candidate = position?.candidates.find((item) => item.id === candidateId);

    if (!project || !position || !candidate) {
      return;
    }

    setCreateTarget(null);
    setModalSession({ projectId, initialPosition: position, initialCandidate: candidate });
  };

  const projectsWithPositions = orderedProjects.filter((project) => project.positions.length > 0);

  if (!isLoaded) {
    return <div className="min-h-screen app-bg" />;
  }

  const viewItems: Array<{ value: CandidatesView; label: string }> = [
    { value: "compact", label: "Compact" },
    { value: "agile", label: "Agile" },
    { value: "full", label: "Full list" },
  ];

  const tabsToShow = roleTabs.slice(0, MAX_TABS);
  const selectedTabHidden = roleSel && !tabsToShow.some((item) => item.key === roleSel);

  return (
    <div className="min-h-screen app-bg px-8 py-8">
      <CandidatesStyles />

      <div className="mx-auto max-w-[1700px]">
        <div className="flex items-center gap-4">
          <StudioLogo />

          <h1 className="text-4xl font-bold app-text-primary">Candidates</h1>

          <button
            type="button"
            onClick={() => setCreateTarget({ kind: "pool" })}
            style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
            className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add candidate
          </button>
        </div>

        {(
          <>
            <div className="mt-4">
              <RoleDemandPanel demand={demand} selectedKey={roleSel} onSelect={setRoleSel} />
            </div>

            <div className="mt-4 flex gap-0.5 overflow-x-auto border-b app-border">
              {[
                { key: "", label: "All", count: baseRows.length },
                ...tabsToShow.map((item) => ({ key: item.key, label: item.role, count: item.total })),
                ...(selectedTabHidden
                  ? [
                      {
                        key: roleSel,
                        label: demand.find((item) => item.key === roleSel)?.role ?? roleSel,
                        count: demand.find((item) => item.key === roleSel)?.total ?? 0,
                      },
                    ]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.key || "all"}
                  type="button"
                  onClick={() => setRoleSel(tab.key)}
                  className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition ${
                    roleSel === tab.key
                      ? "border-violet-500 text-violet-500"
                      : "border-transparent app-text-muted hover:text-violet-400"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs font-normal app-text-muted">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 app-text-muted" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or keywords in HR notes…"
                  className={`${filterControlClass} min-w-[320px] pl-9`}
                />
              </div>

              <select
                value={filters.status}
                onChange={(event) => setFilter("status", event.target.value)}
                className={filterControlClass}
              >
                <option value="">All statuses</option>
                {statusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {PROCESS_STATUS_INFO[item.value].label}
                  </option>
                ))}
                <option value={INTERNAL_STATUS}>Internal (hired) · {internalCount}</option>
              </select>

              <select
                value={filters.recruiter}
                onChange={(event) => setFilter("recruiter", event.target.value)}
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
                value={filters.english}
                onChange={(event) => setFilter("english", event.target.value)}
                className={filterControlClass}
              >
                <option value="">All English levels</option>
                {ENGLISH_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>

              <select
                value={roleSel}
                onChange={(event) => setRoleSel(event.target.value)}
                className={filterControlClass}
              >
                <option value="">All positions</option>
                {demand.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.role}
                  </option>
                ))}
              </select>

              <select
                value={filters.seniority}
                onChange={(event) => setFilter("seniority", event.target.value)}
                className={filterControlClass}
              >
                <option value="">All seniority</option>
                {SENIORITY_BANDS.map((band) => (
                  <option key={band} value={band}>
                    {band}
                  </option>
                ))}
              </select>

              <select
                value={filters.company}
                onChange={(event) => setFilter("company", event.target.value)}
                className={filterControlClass}
              >
                <option value="">Any previous company</option>
                <option value={ANY_COMPETITOR}>Any competitor</option>
                {companyOptions.map((company) => (
                  <option key={company} value={company}>
                    {isCompetitor(company) ? `ex-${company}` : company}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border px-3 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  Clear filters
                </button>
              )}

              <div className="ml-auto flex overflow-hidden rounded-xl border app-border">
                {viewItems.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => changeView(item.value)}
                    className={`px-3 py-2 text-sm transition ${
                      view === item.value
                        ? "bg-violet-600 font-semibold text-white"
                        : "app-text-secondary hover:bg-black/[0.04]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mb-2 mt-3 text-xs app-text-muted">
              {sort.key === "default" ? (
                <>
                  Sorted by <b>seniority</b>, then <b>English</b> (high to low).{" "}
                </>
              ) : null}
              {visibleRows.length} of {baseRows.length} candidates
              {internalCount > 0 && filters.status !== INTERNAL_STATUS
                ? ` · ${internalCount} hired are in Internal`
                : ""}
              .
            </p>

            <CandidatesCollection
              rows={pageRows}
              view={view}
              query={search}
              notes={notes}
              budget={budget}
              sort={sort}
              onSort={handleSort}
              onOpen={openLink}
              onRecontact={setRecontactRow}
            />

            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={visibleRows.length}
              onPage={setPage}
              onPageSize={setPageSize}
            />
          </>
        )}
      </div>

      {notice && (
        <div className="fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-white shadow-xl">
          {notice}
        </div>
      )}

      {recontactRow && (
        <RecontactDialog
          row={recontactRow}
          requestedBy={user}
          onClose={() => setRecontactRow(null)}
          onConfirm={(message) => requestRecontact(recontactRow, message)}
        />
      )}

      {modalSession && modalProject && (
        <ResourcePlanningDetailModal
          project={modalProject}
          initialPosition={modalSession.initialPosition}
          initialCandidate={modalSession.initialCandidate}
          allProjects={projectColumns}
          onClose={() => setModalSession(null)}
          onProjectUpdate={board.updateProject}
          onPositionUpdate={board.updatePosition}
          onCandidateUpdate={board.updateCandidate}
          onProjectArchive={handleArchive}
          onAddPosition={(project) => setCreateTarget({ kind: "position", projectId: project.id })}
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
          existingCandidates={candidateDirectory}
          onAddExistingCandidate={board.addExistingCandidate}
          onOpenExistingCandidate={openExistingCandidate}
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

      {createTarget?.kind === "candidate" && createProjectTarget && createPositionTarget && (
        <CreateEntityModal
          mode="candidate"
          project={createProjectTarget}
          position={createPositionTarget}
          onClose={() => setCreateTarget(null)}
          onCreateProject={board.createProject}
          onCreatePosition={board.createPosition}
          onCreateCandidate={board.createCandidate}
          existingCandidates={candidateDirectory}
          onAddExistingCandidate={board.addExistingCandidate}
          onOpenExistingCandidate={openExistingCandidate}
        />
      )}
    </div>
  );
}
