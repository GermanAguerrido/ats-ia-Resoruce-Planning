"use client";

import { useState } from "react";
import { Archive, Flag, GripVertical, Lock, Plus, RotateCcw } from "lucide-react";
import type {
  CandidateMini,
  PositionCard as PositionCardType,
  PositionStatus,
  ProjectColumn as ProjectColumnType,
} from "@/app/data/resourcePlanningMock";
import { getAlertSummary, getProjectMetrics } from "@/app/lib/boardMetrics";
import type { BoardDensity } from "./BoardFilters";
import type { BoardDragState, ProjectDropSide } from "./boardDnd";
import { ProjectMainCard } from "./ProjectMainCard";
import { UserAvatar } from "./UserAvatar";
import { PositionCard } from "./PositionCard";

type Props = {
  project: ProjectColumnType;
  density?: BoardDensity;
  isArchived?: boolean;
  visibleStatuses?: ReadonlySet<PositionStatus>;
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
  onRestore?: () => void;
  onAddPosition?: () => void;
  onAddCandidate?: (position: PositionCardType) => void;
};

// Orden de las etiquetas: estado → prioridad → visibilidad. Siempre en una sola línea.
const statusConfig: Record<
  ProjectColumnType["status"],
  { label: string; fullLabel: string; className: string }
> = {
  active_search: {
    label: "Active",
    fullLabel: "Active search",
    className:
      "bg-violet-500/50 text-black dark:text-white border border-violet-500/70",
  },
  active_no_search: {
    label: "No searches",
    fullLabel: "No open searches",
    className:
      "bg-gray-500/50 text-black dark:text-white border border-gray-500/70",
  },
  coming_soon: {
    label: "Coming soon",
    fullLabel: "Coming soon",
    className:
      "bg-teal-500/50 text-black dark:text-white border border-teal-500/70",
  },
  inactive: {
    label: "Inactive",
    fullLabel: "Inactive",
    className:
      "bg-gray-500/50 text-black dark:text-white border border-gray-500/70",
  },
};

const priorityConfig: Record<
  ProjectColumnType["priority"],
  { label: string; fullLabel: string; className: string }
> = {
  high: {
    label: "High",
    fullLabel: "High priority",
    className:
      "bg-red-500/50 text-black dark:text-white border border-red-500/70",
  },
  medium: {
    label: "Medium",
    fullLabel: "Medium priority",
    className:
      "bg-yellow-500/50 text-black dark:text-white border border-yellow-500/70",
  },
  low: {
    label: "Low",
    fullLabel: "Low priority",
    className:
      "bg-green-500/50 text-black dark:text-white border border-green-500/70",
  },
};

const chipBaseClass =
  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold";

export function ProjectColumn({
  project,
  density = "comfortable",
  isArchived = false,
  visibleStatuses,
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
  onRestore,
  onAddPosition,
  onAddCandidate,
}: Props) {
  const status = statusConfig[project.status];
  const priority = priorityConfig[project.priority];
  const isCompact = density === "compact";

  const [projectDropSide, setProjectDropSide] =
    useState<ProjectDropSide | null>(null);
  const [isPositionTarget, setIsPositionTarget] = useState(false);

  const isDraggingProject =
    dragState?.kind === "project" && dragState.projectId === project.id;

  const resetDropMarks = () => {
    setProjectDropSide(null);
    setIsPositionTarget(false);
  };

  // Filtrar posiciones según los estados elegidos
  const visiblePositions = visibleStatuses
    ? project.positions.filter((position) => visibleStatuses.has(position.status))
    : project.positions;

  const metrics = getProjectMetrics(project);
  const alerts = getAlertSummary(metrics);

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
      className={`flex h-full shrink-0 flex-col overflow-hidden rounded-2xl border transition-shadow app-border app-card ${
        isCompact ? "w-[296px]" : "w-[340px]"
      } ${isArchived ? "border-dashed opacity-80" : ""} ${dropShadowClass} ${
        isPositionTarget
          ? "outline-2 outline-dashed outline-violet-500/70 -outline-offset-4"
          : ""
      } ${isDraggingProject ? "opacity-50" : ""}`}
    >
      {/* Header STICKY + handle para arrastrar la columna */}
      <header
        draggable={!isArchived}
        onClick={onProjectClick}
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
        className={`sticky top-0 z-10 border-b px-3 pb-2.5 pt-3 app-border backdrop-blur-xl ${
          isArchived ? "" : "cursor-grab active:cursor-grabbing"
        }`}
        style={{ backgroundColor: "var(--app-surface)" }}
      >
        <div className="flex items-center gap-1.5">
          <GripVertical
            className="h-4 w-4 shrink-0 app-text-muted"
            aria-hidden="true"
          />

          <h2
            title={`${project.projectName} - ${project.clientName}`}
            className="min-w-0 flex-1 cursor-pointer truncate text-sm font-bold app-text-primary hover:underline"
          >
            {project.projectName} - {project.clientName}
          </h2>

          <UserAvatar
            name={project.owner || undefined}
            title={
              project.owner
                ? `Delivery owner: ${project.owner}`
                : "Delivery owner: not assigned"
            }
          />

          {isArchived ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRestore?.();
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/45 bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-500 transition hover:bg-red-500/20"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore
            </button>
          ) : (
            onArchive &&
            project.status === "active_no_search" && (
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
            )
          )}
        </div>

        <div className="mt-2.5 flex flex-nowrap gap-1 overflow-hidden">
          <span
            title={status.fullLabel}
            className={`${chipBaseClass} ${status.className}`}
          >
            {status.label}
          </span>

          <span
            title={priority.fullLabel}
            className={`${chipBaseClass} ${priority.className}`}
          >
            <Flag className="h-3 w-3" />
            {priority.label}
          </span>

          {project.confidential ? (
            <span
              title="Confidential"
              className={`${chipBaseClass} border border-red-500/70 bg-red-500/50 text-black dark:text-white`}
            >
              <Lock className="h-3 w-3" />
              {!isCompact && "Confidential"}
            </span>
          ) : (
            <span
              title="Public"
              className={`${chipBaseClass} border border-emerald-500/70 bg-emerald-500/50 text-black dark:text-white`}
            >
              Public
            </span>
          )}

          {isArchived && (
            <span
              className={`${chipBaseClass} border border-gray-500/70 bg-gray-500/50 text-black dark:text-white`}
            >
              Archived
            </span>
          )}

          {isCompact && metrics.alerts > 0 && (
            <span
              title={alerts.full}
              className={`${chipBaseClass} ml-auto border border-amber-500/70 bg-amber-500/50 text-black dark:text-white`}
            >
              ⚠ {metrics.alerts}
            </span>
          )}
        </div>
      </header>

      <div className={`flex-1 overflow-y-auto ${isCompact ? "p-2.5" : "p-3"}`}>
        <ProjectMainCard
          project={project}
          density={density}
          onClick={onProjectClick}
        />

        {/* Métricas simples del proyecto */}
        {isCompact ? (
          <p className="mt-2.5 truncate text-[11.5px] app-text-secondary">
            <b className="app-text-primary">{metrics.openPositions}</b> open ·{" "}
            <b className="app-text-primary">{metrics.inProcess}</b> pipeline ·{" "}
            <b className="app-text-primary">{metrics.presented}</b> presented ·{" "}
            <b className="app-text-primary">
              {metrics.hired}/{metrics.requested}
            </b>{" "}
            hired
          </p>
        ) : (
          <>
            <div className="mt-2.5 grid grid-cols-4 gap-1.5">
              {[
                {
                  value: metrics.openPositions,
                  label: "Open",
                  title: "Open positions",
                },
                {
                  value: metrics.inProcess,
                  label: "Pipeline",
                  title: "Candidates currently in process (not hired or rejected)",
                },
                {
                  value: metrics.presented,
                  label: "Presented",
                  title:
                    "Candidates presented to the client (Presented, Client Interview or Offer)",
                },
                {
                  value: `${metrics.hired}/${metrics.requested}`,
                  label: "Hired",
                  title: "Hired / requested across open and hired positions",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  title={metric.title}
                  className="bd-metric rounded-lg px-1 py-1.5 text-center"
                >
                  <p className="text-base font-bold leading-tight app-text-primary">
                    {metric.value}
                  </p>
                  <p className="mt-0.5 whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-wide app-text-muted">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            {metrics.alerts > 0 && (
              <p
                title={alerts.full}
                className="bd-amber mt-2 truncate text-[11.5px]"
              >
                ⚠ {alerts.short}
              </p>
            )}
          </>
        )}

        <div className="pt-3">
          <div className="mb-2 flex items-center justify-between px-0.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide app-text-muted">
              Positions
            </p>

            <p className="text-xs app-text-muted">
              {visiblePositions.length}
              {visiblePositions.length !== project.positions.length &&
                ` / ${project.positions.length}`}
            </p>
          </div>

          <div className="space-y-2">
            {visiblePositions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                density={density}
                readOnly={isArchived}
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
                className="rounded-xl border border-dashed px-3 py-3 text-center text-xs app-text-muted"
                style={{ borderColor: "var(--app-border)" }}
              >
                No positions match this filter
              </div>
            )}
          </div>
        </div>

        {!isArchived && (
          <button
            type="button"
            onClick={onAddPosition}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-xs transition app-border app-text-secondary hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Add position
          </button>
        )}
      </div>
    </section>
  );
}