import { Lock, Unlock, Plus } from "lucide-react";
import type {
  CandidateMini,
  PositionCard as PositionCardType,
  ProjectColumn as ProjectColumnType,
} from "@/app/data/resourcePlanningMock";
import { ProjectMainCard } from "./ProjectMainCard";
import { PositionCard } from "./PositionCard";

type Props = {
  project: ProjectColumnType;
  onProjectClick: () => void;
  onPositionClick: (position: PositionCardType) => void;
  onCandidateClick: (
    candidate: CandidateMini,
    position: PositionCardType
  ) => void;
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
  onProjectClick,
  onPositionClick,
  onCandidateClick,
}: Props) {
  const status = statusConfig[project.status];
  const priority = priorityConfig[project.priority];

  return (
    <section className="flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border app-border app-card">
      <header className="border-b p-4 app-border">
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
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <ProjectMainCard project={project} onClick={onProjectClick} />

        <div className="pt-1">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
              Positions
            </p>

            <p className="text-xs app-text-muted">{project.positions.length}</p>
          </div>

          <div className="space-y-3">
            {project.positions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                onClick={() => onPositionClick(position)}
                onCandidateClick={(candidate) =>
                  onCandidateClick(candidate, position)
                }
              />
            ))}
          </div>
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-3 text-sm transition app-border app-text-secondary hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-200">
          <Plus className="h-4 w-4" />
          Add position
        </button>
      </div>
    </section>
  );
}
