import { MoreHorizontal, Plus } from "lucide-react";
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

const projectStatusLabel = {
  active_search: "Active search",
  active_no_search: "No open searches",
  coming_soon: "Coming soon",
  inactive: "Inactive",
};

const priorityLabel = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

export function ProjectColumn({
  project,
  onProjectClick,
  onPositionClick,
  onCandidateClick,
}: Props) {
  return (
    <section className="flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border app-border app-card">
      <header className="flex items-start justify-between gap-3 border-b p-4 app-border">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold app-text-primary">
            {project.clientName}
          </h2>

          <p className="mt-1 truncate text-xs app-text-secondary">
            {project.projectName}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rp-status-badge rounded-full px-2 py-1 text-[11px] font-semibold">
              {projectStatusLabel[project.status]}
            </span>

            <span className="rp-priority-badge rounded-full px-2 py-1 text-[11px] font-semibold">
              {priorityLabel[project.priority]}
            </span>
          </div>
        </div>

        <button className="rounded-lg p-1.5 app-text-muted transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
          <MoreHorizontal className="h-4 w-4" />
        </button>
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