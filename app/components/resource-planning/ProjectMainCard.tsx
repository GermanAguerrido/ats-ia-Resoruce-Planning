import type { ProjectColumn } from "@/app/data/resourcePlanningMock";
import type { BoardDensity } from "./BoardFilters";

type Props = {
  project: ProjectColumn;
  density?: BoardDensity;
  onClick?: () => void;
};

// Todas las portadas tienen la misma altura: la foto se recorta al centro, sin importar su tamaño.
export function ProjectMainCard({ project, density = "comfortable", onClick }: Props) {
  return (
    <article
      onClick={onClick}
      className={`overflow-hidden rounded-xl border shadow-sm app-border app-card ${
        onClick
          ? "cursor-pointer transition hover:border-violet-500/40 hover:shadow-md"
          : ""
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          density === "compact" ? "h-14" : "h-[92px]"
        }`}
      >
        <img
          src={project.cover}
          alt={project.projectName}
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>
    </article>
  );
}