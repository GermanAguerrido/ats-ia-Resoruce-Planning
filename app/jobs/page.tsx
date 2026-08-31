"use client";

import { useMemo, useState } from "react";
import { ProjectColumn } from "../components/resource-planning/ProjectColumn";
import { ResourcePlanningDetailModal } from "../components/resource-planning/ResourcePlanningDetailModal";
import { resourcePlanningMock as initialProjectColumns } from "../data/resourcePlanningMock";
import type {
  PositionCard as PositionCardType,
  CandidateMini,
  ProjectColumn as ProjectColumnType,
} from "../data/resourcePlanningMock";

type StatusFilter = "all" | "active" | "active_and_coming";

export type PositionStatusFilter = "all" | "open" | "on_hold" | "hired" | "cancelled";

export default function JobsPage() {
  const [projectColumns] = useState(initialProjectColumns);
  const [selectedProject, setSelectedProject] = useState<ProjectColumnType | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<{
    position: PositionCardType;
    project: ProjectColumnType;
  } | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<{
    candidate: CandidateMini;
    project: ProjectColumnType;
    position: PositionCardType;
  } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [hideNoOpenSearches, setHideNoOpenSearches] = useState(false);
  const [positionStatusFilter, setPositionStatusFilter] =
    useState<PositionStatusFilter>("all");

  const filteredProjects = useMemo(() => {
    return projectColumns.filter((project) => {
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
  }, [projectColumns, statusFilter, hideNoOpenSearches, positionStatusFilter]);

  const activeModalData = selectedCandidate
    ? {
        project: selectedCandidate.project,
        initialPosition: selectedCandidate.position,
        initialCandidate: selectedCandidate.candidate,
      }
    : selectedPosition
      ? {
          project: selectedPosition.project,
          initialPosition: selectedPosition.position,
          initialCandidate: null,
        }
      : selectedProject
        ? {
            project: selectedProject,
            initialPosition: null,
            initialCandidate: null,
          }
        : null;

  return (
    <main className="min-h-screen app-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b px-6 py-4 backdrop-blur-xl app-bg app-border">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold tracking-tight app-text-primary">
            Resource Planning
          </h1>
          <img
            src="/trick-studios-logo.png.png"
            alt="Trick Studios"
            className="h-10 w-auto"
          />
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
            {filteredProjects.length} of {projectColumns.length} projects
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-6">
        {/* KANBAN BOARD */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {filteredProjects.map((project) => (
              <ProjectColumn
                key={project.id}
                project={project}
                positionStatusFilter={positionStatusFilter}
                onProjectClick={() => {
                  setSelectedProject(project);
                  setSelectedPosition(null);
                  setSelectedCandidate(null);
                }}
                onPositionClick={(position) => {
                  setSelectedProject(project);
                  setSelectedPosition({ position, project });
                  setSelectedCandidate(null);
                }}
                onCandidateClick={(candidate, position) => {
                  setSelectedProject(project);
                  setSelectedPosition({ position, project });
                  setSelectedCandidate({ candidate, project, position });
                }}
              />
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg app-text-muted">No projects match the current filters</p>
            </div>
          )}
        </div>
      </div>

      {activeModalData && (
        <ResourcePlanningDetailModal
          project={activeModalData.project}
          initialPosition={activeModalData.initialPosition}
          initialCandidate={activeModalData.initialCandidate}
          onClose={() => {
            setSelectedProject(null);
            setSelectedPosition(null);
            setSelectedCandidate(null);
          }}
        />
      )}
    </main>
  );
}
