import { BriefcaseBusiness, Lock, Unlock, Users } from "lucide-react";
import type { ProjectColumn } from "@/app/data/resourcePlanningMock";

type Props = {
  project: ProjectColumn;
  onClick?: () => void;
};

export function ProjectMainCard({ project, onClick }: Props) {
  const openPositions = project.positions.filter(
    (position) => position.status === "open"
  ).length;

  const totalCandidates = project.positions.reduce(
    (acc, position) => acc + position.candidates.length,
    0
  );

  return (
    <article
      onClick={onClick}
      className={`overflow-hidden rounded-2xl border shadow-sm app-border app-card ${
        onClick
          ? "cursor-pointer transition hover:border-violet-500/40 hover:shadow-md"
          : ""
      }`}
    >
      <div className="relative h-36 overflow-hidden">
        <img
          src={project.cover}
          alt={project.projectName}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

        <div className="absolute left-3 top-3">
          {project.confidential ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-600/80 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
              <Lock className="h-3 w-3 text-white" />
              Confidential
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-600/80 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
              <Unlock className="h-3 w-3 text-white" />
              Public
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold app-text-primary">
          {project.projectName}
        </h3>

        <p className="mt-1 line-clamp-2 text-xs leading-5 app-text-secondary">
          {project.description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.03]">
            <div className="flex items-center gap-2 app-text-secondary">
              <BriefcaseBusiness className="h-4 w-4" />
              <span className="text-[11px]">Open positions</span>
            </div>

            <p className="mt-1 text-lg font-semibold app-text-primary">
              {openPositions}
            </p>
          </div>

          <div className="rounded-xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.03]">
            <div className="flex items-center gap-2 app-text-secondary">
              <Users className="h-4 w-4" />
              <span className="text-[11px]">Candidates</span>
            </div>

            <p className="mt-1 text-lg font-semibold app-text-primary">
              {totalCandidates}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}