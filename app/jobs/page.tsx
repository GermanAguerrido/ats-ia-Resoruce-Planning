"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Plus } from "lucide-react";
import {
  BoardStyles,
  DensityToggle,
  MultiSelectFilter,
  OptionRow,
  OrderFilter,
  type BoardDensity,
  type BoardView,
} from "../components/resource-planning/BoardFilters";
import { CurrentUserSwitcher } from "../components/resource-planning/CurrentUserSwitcher";
import { PipelineView } from "../components/resource-planning/PipelineView";
import { ProjectColumn } from "../components/resource-planning/ProjectColumn";
import { ResourcePlanningDetailModal } from "../components/resource-planning/ResourcePlanningDetailModal";
import {
  CreateEntityModal,
  type CreateEntityMode,
} from "../components/resource-planning/CreateEntityModal";
import type { BoardDragState } from "../components/resource-planning/boardDnd";
import type {
  CandidateMini,
  PositionCard as PositionCardType,
  PositionStatus,
  ProjectColumn as ProjectColumnType,
  ProjectStatus,
} from "../data/resourcePlanningMock";
import { useBoardState } from "../hooks/useBoardState";
import { buildCandidateDirectory } from "../lib/candidateDirectory";

type ModalSession = {
  projectId: string;
  initialPosition: PositionCardType | null;
  initialCandidate: CandidateMini | null;
};

type CreateTarget =
  | { mode: Extract<CreateEntityMode, "project"> }
  | { mode: Extract<CreateEntityMode, "position">; projectId: string }
  | {
      mode: Extract<CreateEntityMode, "candidate">;
      projectId: string;
      positionId: string;
    }
  | null;

const DENSITY_STORAGE_KEY = "ats-ia:resource-planning:density";

const ALL_PROJECT_STATUSES: ProjectStatus[] = [
  "active_search",
  "coming_soon",
  "active_no_search",
  "inactive",
];

const ALL_POSITION_STATUSES: PositionStatus[] = [
  "open",
  "on_hold",
  "hired",
  "cancelled",
];

const projectStatusLabels: Record<ProjectStatus, string> = {
  active_search: "Active",
  coming_soon: "Coming soon",
  active_no_search: "No open searches",
  inactive: "Inactive",
};

const positionStatusLabels: Record<PositionStatus, string> = {
  open: "Open",
  on_hold: "On hold",
  hired: "Hired",
  cancelled: "Cancelled",
};

export default function JobsPage() {
  const board = useBoardState();
  const {
    projectColumns,
    orderedProjects,
    archivedProjects,
    orderMode,
    archiveProject,
    restoreProject,
    moveProject,
    movePosition,
    setAutoOrder,
    setManualOrderMode,
  } = board;

  const [dragState, setDragState] = useState<BoardDragState | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // El modal de detalle recibe siempre el proyecto actualizado; solo guardamos con qué se abrió.
  const [modalSession, setModalSession] = useState<ModalSession | null>(null);
  const [createTarget, setCreateTarget] = useState<CreateTarget>(null);

  // Filtros (selección múltiple: por defecto se ve todo)
  const [projectStatuses, setProjectStatuses] = useState<Set<ProjectStatus>>(
    () => new Set(ALL_PROJECT_STATUSES)
  );
  const [positionStatuses, setPositionStatuses] = useState<Set<PositionStatus>>(
    () => new Set(ALL_POSITION_STATUSES)
  );
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");

  // Vista del tablero (columnas cómodas, compactas o Pipeline): se recuerda entre visitas
  const [view, setView] = useState<BoardView>("compact");
  const density: BoardDensity = view === "pipeline" ? "compact" : view;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DENSITY_STORAGE_KEY);

      if (stored === "comfortable" || stored === "compact" || stored === "pipeline") {
        setView(stored);
      }
    } catch {
      // Local storage can fail in private browsing or quota situations.
    }
  }, []);

  const changeView = (next: BoardView) => {
    setView(next);

    try {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, next);
    } catch {
      // Local storage can fail in private browsing or quota situations.
    }
  };

  const allPositionsSelected =
    positionStatuses.size === ALL_POSITION_STATUSES.length;

  const matchesFilters = (project: ProjectColumnType) => {
    // Con un filtro de posiciones activo, solo proyectos que tengan alguna de esas posiciones
    if (
      !allPositionsSelected &&
      !project.positions.some((position) => positionStatuses.has(position.status))
    ) {
      return false;
    }

    const term = search.trim().toLowerCase();

    if (!term) {
      return true;
    }

    const haystack = [
      project.projectName,
      project.clientName,
      ...project.positions.flatMap((position) => [
        position.title,
        ...position.candidates.map((candidate) => candidate.name),
      ]),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(term);
  };

  const visibleActive = useMemo(
    () =>
      orderedProjects.filter(
        (project) => projectStatuses.has(project.status) && matchesFilters(project)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderedProjects, projectStatuses, positionStatuses, search]
  );

  const visibleArchived = useMemo(
    () => (showArchived ? archivedProjects.filter(matchesFilters) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showArchived, archivedProjects, positionStatuses, search]
  );

  // Candidatos existentes (para buscarlos y sumarlos a una posición)
  const candidateDirectory = useMemo(
    () => buildCandidateDirectory(orderedProjects),
    [orderedProjects]
  );

  const totalProjects =
    orderedProjects.length + (showArchived ? archivedProjects.length : 0);

  const projectOptions = ALL_PROJECT_STATUSES.map((status) => ({
    value: status,
    label: projectStatusLabels[status],
    count: orderedProjects.filter((project) => project.status === status).length,
  }));

  const positionOptions = ALL_POSITION_STATUSES.map((status) => ({
    value: status,
    label: positionStatusLabels[status],
  }));

  const closeModal = () => {
    setModalSession(null);
  };

  const handleArchive = (projectId: string) => {
    archiveProject(projectId);
    closeModal();
  };

  // ---- Arrastrar y soltar ----
  const startDrag = (state: BoardDragState) => {
    // Diferido para no alterar el elemento mientras el navegador arma la imagen del arrastre.
    window.setTimeout(() => setDragState(state), 0);
  };

  const endDrag = () => {
    setDragState(null);
  };

  // Desplazamiento horizontal automático al arrastrar cerca de los bordes
  const handleBoardDragOver = (event: DragEvent<HTMLDivElement>) => {
    const element = boardRef.current;

    if (!element || !dragState) {
      return;
    }

    const bounds = element.getBoundingClientRect();
    const edge = 90;

    if (event.clientX < bounds.left + edge) {
      element.scrollLeft -= 18;
    } else if (event.clientX > bounds.right - edge) {
      element.scrollLeft += 18;
    }
  };

  const modalProject = modalSession
    ? (projectColumns.find((project) => project.id === modalSession.projectId) ??
      null)
    : null;

  const createProjectTarget =
    createTarget && createTarget.mode !== "project"
      ? (projectColumns.find((project) => project.id === createTarget.projectId) ??
        null)
      : null;

  const createPositionTarget =
    createTarget && createTarget.mode === "candidate"
      ? (createProjectTarget?.positions.find(
          (position) => position.id === createTarget.positionId
        ) ?? null)
      : null;

  const visibleCount = visibleActive.length + visibleArchived.length;

  return (
    <main className="flex h-screen flex-col app-bg">
      <BoardStyles />

      {/* Header */}
      <div className="shrink-0 border-b px-6 py-4 app-bg app-border">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold tracking-tight app-text-primary">
            Resource Planning
          </h1>

          <div className="flex items-center gap-5">
            <CurrentUserSwitcher />

            <img
              src="/trick-studios-logo.png"
              alt="Trick Studios"
              className="h-12 w-auto"
            />
          </div>
        </div>

        {/* Barra de acciones y filtros */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateTarget({ mode: "project" })}
            style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New project
          </button>

          <MultiSelectFilter
            label="Projects"
            allLabel="All projects"
            options={projectOptions}
            selected={projectStatuses}
            onChange={setProjectStatuses}
            extraHighlight={showArchived}
            footer={
              <OptionRow
                checked={showArchived}
                onClick={() => setShowArchived((current) => !current)}
              >
                <span>Show archived</span>
                <span className="ml-auto text-xs app-text-muted">
                  {archivedProjects.length}
                </span>
              </OptionRow>
            }
          />

          <MultiSelectFilter
            label="Positions"
            allLabel="All positions"
            options={positionOptions}
            selected={positionStatuses}
            onChange={setPositionStatuses}
          />

          <OrderFilter
            value={orderMode}
            onChange={(next) =>
              next === "auto" ? setAutoOrder() : setManualOrderMode()
            }
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search project, position or candidate..."
            className="w-[250px] rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 app-input"
          />

          <DensityToggle value={view} onChange={changeView} />

          <span className="ml-auto text-xs app-text-muted">
            {visibleCount} of {totalProjects} projects
          </span>
        </div>
      </div>

      {/* KANBAN BOARD: ocupa el alto de la pantalla, el scroll horizontal queda siempre visible */}
      <div
        ref={boardRef}
        onDragOver={handleBoardDragOver}
        className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-6 py-4"
      >
        {view === "pipeline" ? (
          <PipelineView
            groups={[
              ...visibleActive.map((project) => ({ project, archived: false })),
              ...visibleArchived.map((project) => ({ project, archived: true })),
            ]}
            visibleStatuses={positionStatuses}
            onOpenProject={(project) =>
              setModalSession({
                projectId: project.id,
                initialPosition: null,
                initialCandidate: null,
              })
            }
            onOpenPosition={(project, position) =>
              setModalSession({
                projectId: project.id,
                initialPosition: position,
                initialCandidate: null,
              })
            }
            onOpenCandidate={(project, position, candidate) =>
              setModalSession({
                projectId: project.id,
                initialPosition: position,
                initialCandidate: candidate,
              })
            }
            onAddCandidate={(project, position) =>
              setCreateTarget({
                mode: "candidate",
                projectId: project.id,
                positionId: position.id,
              })
            }
            onMoveCandidate={board.changeCandidateStage}
            onRestoreCandidate={board.restoreCandidate}
          />
        ) : (
          <div className="flex h-full min-w-max gap-3.5">
            {visibleActive.map((project) => (
              <ProjectColumn
                key={project.id}
                project={project}
                density={density}
                visibleStatuses={positionStatuses}
                dragState={dragState}
                onProjectClick={() =>
                  setModalSession({
                    projectId: project.id,
                    initialPosition: null,
                    initialCandidate: null,
                  })
                }
                onPositionClick={(position) =>
                  setModalSession({
                    projectId: project.id,
                    initialPosition: position,
                    initialCandidate: null,
                  })
                }
                onCandidateClick={(candidate, position) =>
                  setModalSession({
                    projectId: project.id,
                    initialPosition: position,
                    initialCandidate: candidate,
                  })
                }
                onProjectDragStart={() =>
                  startDrag({ kind: "project", projectId: project.id })
                }
                onPositionDragStart={(position) =>
                  startDrag({
                    kind: "position",
                    positionId: position.id,
                    fromProjectId: project.id,
                  })
                }
                onDragEnd={endDrag}
                onDropProject={(side) => {
                  if (dragState?.kind === "project") {
                    moveProject(dragState.projectId, project.id, side);
                  }

                  endDrag();
                }}
                onDropPosition={(beforePositionId) => {
                  if (dragState?.kind === "position") {
                    movePosition(
                      dragState.positionId,
                      dragState.fromProjectId,
                      project.id,
                      beforePositionId
                    );
                  }

                  endDrag();
                }}
                onArchive={() => handleArchive(project.id)}
                onAddPosition={() =>
                  setCreateTarget({ mode: "position", projectId: project.id })
                }
                onAddCandidate={(position) =>
                  setCreateTarget({
                    mode: "candidate",
                    projectId: project.id,
                    positionId: position.id,
                  })
                }
              />
            ))}

            {/* Proyectos archivados (solo lectura): aparecen al final si se activa "Show archived" */}
            {visibleArchived.map((project) => (
              <ProjectColumn
                key={project.id}
                project={project}
                density={density}
                isArchived
                visibleStatuses={positionStatuses}
                onProjectClick={() =>
                  setModalSession({
                    projectId: project.id,
                    initialPosition: null,
                    initialCandidate: null,
                  })
                }
                onPositionClick={(position) =>
                  setModalSession({
                    projectId: project.id,
                    initialPosition: position,
                    initialCandidate: null,
                  })
                }
                onCandidateClick={(candidate, position) =>
                  setModalSession({
                    projectId: project.id,
                    initialPosition: position,
                    initialCandidate: candidate,
                  })
                }
                onRestore={() => restoreProject(project.id)}
              />
            ))}

            {visibleCount === 0 && (
              <div className="flex w-full flex-col items-center justify-center py-12">
                <p className="text-lg app-text-muted">No projects match the current filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {modalSession && modalProject && (
        <ResourcePlanningDetailModal
          project={modalProject}
          initialPosition={modalSession.initialPosition}
          initialCandidate={modalSession.initialCandidate}
          allProjects={projectColumns}
          onClose={closeModal}
          onProjectUpdate={board.updateProject}
          onPositionUpdate={board.updatePosition}
          onCandidateUpdate={board.updateCandidate}
          onProjectArchive={handleArchive}
          onAddPosition={(project) =>
            setCreateTarget({ mode: "position", projectId: project.id })
          }
          onAddCandidate={(project, position) =>
            setCreateTarget({
              mode: "candidate",
              projectId: project.id,
              positionId: position.id,
            })
          }
        />
      )}

      {createTarget &&
        (createTarget.mode === "project" ||
          (createTarget.mode === "position" && createProjectTarget) ||
          (createTarget.mode === "candidate" &&
            createProjectTarget &&
            createPositionTarget)) && (
          <CreateEntityModal
            mode={createTarget.mode}
            project={createProjectTarget}
            position={createPositionTarget}
            onClose={() => setCreateTarget(null)}
            onCreateProject={board.createProject}
            onCreatePosition={board.createPosition}
            onCreateCandidate={board.createCandidate}
            existingCandidates={candidateDirectory}
            onAddExistingCandidate={board.addExistingCandidate}
          />
        )}
    </main>
  );
}
