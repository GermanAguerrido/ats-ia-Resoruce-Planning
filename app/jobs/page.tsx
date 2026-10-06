"use client";

import { useMemo, useRef, useState, type DragEvent } from "react";
import { Plus } from "lucide-react";
import { ProjectColumn } from "../components/resource-planning/ProjectColumn";
import { ResourcePlanningDetailModal } from "../components/resource-planning/ResourcePlanningDetailModal";
import {
  CreateEntityModal,
  type CreateEntityMode,
} from "../components/resource-planning/CreateEntityModal";
import type { BoardDragState } from "../components/resource-planning/boardDnd";
import type {
  PositionCard as PositionCardType,
  CandidateMini,
} from "../data/resourcePlanningMock";
import { useBoardState } from "../hooks/useBoardState";

type StatusFilter = "all" | "active" | "active_and_coming";

export type PositionStatusFilter = "all" | "open" | "on_hold" | "hired" | "cancelled";

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

const secondaryButtonClass =
  "rounded-lg border px-3 py-2 text-xs font-medium transition app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]";

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
    resetBoard,
  } = board;

  const [showArchived, setShowArchived] = useState(false);
  const [dragState, setDragState] = useState<BoardDragState | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // El modal de detalle recibe siempre el proyecto actualizado; solo guardamos con qué se abrió.
  const [modalSession, setModalSession] = useState<ModalSession | null>(null);
  const [createTarget, setCreateTarget] = useState<CreateTarget>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [hideNoOpenSearches, setHideNoOpenSearches] = useState(false);
  const [positionStatusFilter, setPositionStatusFilter] =
    useState<PositionStatusFilter>("all");

  const filteredProjects = useMemo(() => {
    return orderedProjects.filter((project) => {
      // Filtro de estado de proyecto
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? project.status === "active_search"
            : project.status === "active_search" || project.status === "coming_soon";

      // Excluir proyectos sin open searches
      const hasOpenPositions = project.positions.some(
        (position) => position.status === "open"
      );
      const matchesOpenSearch = hideNoOpenSearches ? hasOpenPositions : true;

      // Filtro por estado de posición: si el filtro está activo,
      // solo mostrar proyectos que tengan al menos una posición con ese estado
      const hasMatchingPosition =
        positionStatusFilter === "all"
          ? true
          : project.positions.some(
              (position) => position.status === positionStatusFilter
            );

      return matchesStatus && matchesOpenSearch && hasMatchingPosition;
    });
  }, [orderedProjects, statusFilter, hideNoOpenSearches, positionStatusFilter]);

  const closeModal = () => {
    setModalSession(null);
  };

  const handleArchive = (projectId: string) => {
    archiveProject(projectId);
    closeModal();
  };

  const handleReset = () => {
    if (!window.confirm("Reset the board to the original data?")) {
      return;
    }

    resetBoard();
    setShowArchived(false);
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

  return (
    <main className="flex h-screen flex-col app-bg">
      {/* Header */}
      <div className="shrink-0 border-b px-6 py-4 app-bg app-border">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold tracking-tight app-text-primary">
            Resource Planning
          </h1>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setCreateTarget({ mode: "project" })}
              style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New project
            </button>

            <img
              src="/trick-studios-logo.png"
              alt="Trick Studios"
              className="h-12 w-auto"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Project status filter */}
          <div className="flex gap-1 rounded-lg border p-1 app-border">
            {(
              [
                { value: "all", label: "All Projects" },
                { value: "active", label: "Active Only" },
                { value: "active_and_coming", label: "Active + Coming Soon" },
              ] as Array<{ value: StatusFilter; label: string }>
            ).map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === option.value
                    ? "bg-violet-500 text-white"
                    : "app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Position status filter */}
          <div className="flex gap-1 rounded-lg border p-1 app-border">
            {(
              [
                { value: "all", label: "All Positions" },
                { value: "open", label: "Open" },
                { value: "on_hold", label: "On Hold" },
                { value: "hired", label: "Hired" },
                { value: "cancelled", label: "Cancelled" },
              ] as Array<{ value: PositionStatusFilter; label: string }>
            ).map((option) => (
              <button
                key={option.value}
                onClick={() => setPositionStatusFilter(option.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  positionStatusFilter === option.value
                    ? "bg-violet-500 text-white"
                    : "app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Hide no open searches toggle */}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 app-border">
            <input
              type="checkbox"
              checked={hideNoOpenSearches}
              onChange={(event) => setHideNoOpenSearches(event.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            <span className="text-xs font-medium app-text-secondary">
              Only projects with open positions
            </span>
          </label>

          {/* Result count */}
          <span className="text-xs app-text-muted">
            {filteredProjects.length} of {orderedProjects.length} projects
          </span>

          <span className="flex-1" />

          {/* Order mode */}
          {orderMode === "auto" ? (
            <span className="text-xs app-text-muted">
              Auto order: status → priority
            </span>
          ) : (
            <button
              onClick={setAutoOrder}
              className="rounded-lg border border-violet-500/60 px-3 py-2 text-xs font-medium text-violet-500 transition hover:bg-violet-500/10"
            >
              Manual order · Back to auto
            </button>
          )}

          <button
            onClick={() => setShowArchived((current) => !current)}
            className={secondaryButtonClass}
          >
            Archived ({archivedProjects.length})
          </button>

          <button onClick={handleReset} className={secondaryButtonClass}>
            Reset board
          </button>
        </div>

        {showArchived && (
          <div className="mt-3 rounded-xl border px-3 py-2 app-border app-card">
            {archivedProjects.length > 0 ? (
              archivedProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between gap-3 border-t py-2 first:border-t-0 app-border"
                >
                  <span className="text-sm app-text-primary">
                    {project.projectName} - {project.clientName}
                  </span>

                  <button
                    onClick={() => restoreProject(project.id)}
                    className={secondaryButtonClass}
                  >
                    Restore
                  </button>
                </div>
              ))
            ) : (
              <p className="py-2 text-sm app-text-muted">No archived projects</p>
            )}
          </div>
        )}
      </div>

      {/* KANBAN BOARD: ocupa el alto de la pantalla, el scroll horizontal queda siempre visible */}
      <div
        ref={boardRef}
        onDragOver={handleBoardDragOver}
        className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-6 py-4"
      >
        <div className="flex h-full min-w-max gap-4">
          {filteredProjects.map((project) => (
            <ProjectColumn
              key={project.id}
              project={project}
              positionStatusFilter={positionStatusFilter}
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

          {filteredProjects.length === 0 && (
            <div className="flex w-full flex-col items-center justify-center py-12">
              <p className="text-lg app-text-muted">No projects match the current filters</p>
            </div>
          )}
        </div>
      </div>

      {modalSession && modalProject && (
        <ResourcePlanningDetailModal
          project={modalProject}
          initialPosition={modalSession.initialPosition}
          initialCandidate={modalSession.initialCandidate}
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
          />
        )}
    </main>
  );
}