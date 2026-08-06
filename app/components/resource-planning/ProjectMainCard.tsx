import { Lock, Unlock } from "lucide-react";
import type { ProjectColumn } from "@/app/data/resourcePlanningMock";

type Props = {
  project: ProjectColumn;
  onClick?: () => void;
};

export function ProjectMainCard({ project, onClick }: Props) {
  return (
    <article
      onClick={onClick}
      className={`overflow-hidden rounded-2xl border shadow-sm app-border app-card ${
        onClick
          ? "cursor-pointer transition hover:border-violet-500/40 hover:shadow-md"
          : ""
      }`}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={project.cover}
          alt={project.projectName}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>
    </article>
  );
}
