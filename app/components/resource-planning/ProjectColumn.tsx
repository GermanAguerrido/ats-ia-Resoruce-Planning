"use client";

import { useState } from "react";
import { Archive, GripVertical, Lock, Plus, Unlock } from "lucide-react";
import type {
  CandidateMini,
  PositionCard as PositionCardType,
  ProjectColumn as ProjectColumnType,
} from "@/app/data/resourcePlanningMock";
import type { PositionStatusFilter } from "@/app/jobs/page";
import type { BoardDragState, ProjectDropSide } from "./boardDnd";
import { ProjectMainCard } from "./ProjectMainCard";
import { PositionCard } from "./PositionCard";

type Props = {
  project: ProjectColumnType;
  positionStatusFilter?: PositionStatusFilter;
  dragState?: BoardDragState | null;
  onProjectClick: () => void;
  onPositionClick: (position: PositionCardType) => void;
  onCandidateClick: (
    candidate: CandidateMini,
    position: PositionCardType
  ) => void;
  onProjectDragStart?: () => void;
  onPositionDragStart?: (position: PositionCardType) => void;
  onDragEnd?: () => void;
  onDropProject?: (side: ProjectDropSide) => void;
  onDropPosition?: (beforePositionId: string | null) => void;
  onArchive?: () => void;
  onAddPosition?: () => void;
  onAddCandidate?: (position: PositionCardType) => void;
};

const statusConfig: Record<
  ProjectColumnType["status"],
  { label: string; className: string }
> = {
  active_search: {
    label: "Active",
    className:
      "bg-violet-500/50 text-black dark:text-white border border-violet-500/70",
  },
  active_no_search: {
    label: "No Open Searches",
    className:
      "bg-gray-500/50 text-black dark:text-white border border-gray-500/70",
  },
  coming_soon: {
    label: "Coming Soon",
    className:
      "bg-teal-500/50 text-black dark:text-white border border-teal-500/70",
  },
  inactive: {
    label: "Inactive",
    className:
      "bg-gray-500/50 text-black dark:text-white border border-gray-500/70",
  },
};

const priorityConfig: Record<
  ProjectColumnType["priority"],
  { label: string; className: string }
> = {
  high: {
    label: "High Priority",
    className:
      "bg-red-500/50 text-black dark:text-white border border-red-500/70",
  },
  medium: {
    label: "Medium Priority",
    className:
      "bg-yellow-500/50 text-black dark:text-white border border-yellow-500/70",
  },
  low: {
    label: "Low Priority",
    className:
      "bg-green-500/50 text-black dark:text-white border border-green-500/70",
  },
};

export function ProjectColumn({
  project,
  positionStatusFilter = "all",
  dragState = null,
  onProjectClick,
  onPositionClick,
  onCandidateClick,
  onProjectDragStart,
  onPositionDragStart,
  onDragEnd,
  onDropProject,
  onDropPosition,
  onArchive,
  onAddPosition,
  onAddCandidate,
}: Props) {
  const status = statusConfig[project.status];
  const priority = priorityConfig[project.priority];

  const [projectDropSide, setProjectDropSide] =
    useState<ProjectDropSide | null>(null);
  const [isPositionTarget, setIsPositionTarget] = useState(false);

  const isDraggingProject =
    dragState?.kind === "project" && dragState.projectId === project.id;

  const resetDropMarks = () => {
    setProjectDropSide(null);
    setIsPositionTarget(false);
  };

  // Filtrar posiciones según el filtro de estado
  const visiblePositions =
    positionStatusFilter === "all"
      ? project.positions
      : project.positions.filter(
          (position) => position.status === positionStatusFilter
        );

  const dropShadowClass =
    projectDropSide === "before"
      ? "shadow-[-7px_0_0_0_#8b5cf6]"
      : projectDropSide === "after"
        ? "shadow-[7px_0_0_0_#8b5cf6]"
        : "";

  return (
    <section
      onDragOver={(event) => {
        if (!dragState) {
          return;
        }

        if (dragState.kind === "project") {
          if (dragState.projectId === project.id) {
            return;
          }

          event.preventDefault();
          event.dataTransfer.dropEffect = "move";

          const bounds = event.currentTarget.getBoundingClientRect();

          setProjectDropSide(
            event.clientX < bounds.left + bounds.width / 2 ? "before" : "after"
          );
          return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setIsPositionTarget(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          resetDropMarks();
        }
      }}
      onDrop={(event) => {
        if (!dragState) {
          return;
        }

        event.preventDefault();

        if (dragState.kind === "project") {
          if (dragState.projectId !== project.id) {
            onDropProject?.(projectDropSide ?? "after");
          }
        } else {
          onDropPosition?.(null);
        }

        resetDropMarks();
      }}
      className={`flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border transition-shadow app-border app-card ${dropShadowClass} ${
        isPositionTarget
          ? "outline-2 outline-dashed outline-violet-500/70 -outline-offset-4"
          : ""
      } ${isDraggingProject ? "opacity-50" : ""}`}
    >
      {/* Header STICKY + handle para arrastrar la columna */}
      <header
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", project.id);

          const section = event.currentTarget.closest("section");

          if (section) {
            event.dataTransfer.setDragImage(section, 24, 24);
          }

          onProjectDragStart?.();
        }}
        onDragEnd={() => {
          resetDropMarks();
          onDragEnd?.();
        }}
        className="sticky top-0 z-10 cursor-grab border-b p-4 app-border backdrop-blur-xl active:cursor-grabbing"
        style={{ backgroundColor: "var(--app-surface)" }}
      >
        <div className="flex items-start gap-2">
          <GripVertical
            className="mt-0.5 h-4 w-4 shrink-0 app-text-muted"
            aria-hidden="true"
          />

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold app-text-primary">
              {project.projectName} - {project.clientName}
            </h2>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.confidential ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-500/70 bg-red-500/50 px-2 py-1 text-[11px] font-semibold text-black dark:text-white">
                  <Lock className="h-3 w-3" />
                  Confidential
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/70 bg-emerald-500/50 px-2 py-1 text-[11px] font-semibold text-black dark:text-white">
                  <Unlock className="h-3 w-3" />
                  Public
                </span>
              )}

              <span
                className={`inline-block rounded-full px-2 py-1 text-[11px] font-semibold ${status.className}`}
              >
                {status.label}
              </span>

              <span
                className={`inline-block rounded-full px-2 py-1 text-[11px] font-semibold ${priority.className}`}
              >
                {priority.label}
              </span>
            </div>
          </div>

          {onArchive && project.status === "active_no_search" && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onArchive();
              }}
              title="Archive project"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/45 bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-500 transition hover:bg-red-500/20"
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <ProjectMainCard project={project} onClick={onProjectClick} />

        <div className="pt-1">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
              Positions
            </p>

            <p className="text-xs app-text-muted">
              {visiblePositions.length}
              {visiblePositions.length !== project.positions.length &&
                ` / ${project.positions.length}`}
            </p>
          </div>

          <div className="space-y-3">
            {visiblePositions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                isDragging={
                  dragState?.kind === "position" &&
                  dragState.positionId === position.id
                }
                canDropHere={
                  dragState?.kind === "position" &&
                  dragState.positionId !== position.id
                }
                onClick={() => onPositionClick(position)}
                onCandidateClick={(candidate) =>
                  onCandidateClick(candidate, position)
                }
                onDragStart={() => onPositionDragStart?.(position)}
                onDragEnd={onDragEnd}
                onDropBefore={() => {
                  onDropPosition?.(position.id);
                  resetDropMarks();
                }}
                onAddCandidate={
                  onAddCandidate ? () => onAddCandidate(position) : undefined
                }
              />
            ))}

            {visiblePositions.length === 0 && (
              <div
                className="rounded-xl border border-dashed px-3 py-4 text-center text-xs app-text-muted"
                style={{ borderColor: "var(--app-border)" }}
              >
                No positions match this filter
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onAddPosition}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-3 text-sm transition app-border app-text-secondary hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-200"
        >
          <Plus className="h-4 w-4" />
          Add position
        </button>
      </div>
    </section>
  );
}