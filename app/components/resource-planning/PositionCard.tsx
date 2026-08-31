import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type {
  CandidateMini,
  PositionCard as PositionCardType,
} from "@/app/data/resourcePlanningMock";
import { CandidateMiniCard } from "./CandidateMiniCard";

type Props = {
  position: PositionCardType;
  onClick: () => void;
  onCandidateClick: (candidate: CandidateMini) => void;
};

const statusConfig = {
  open: {
    label: "Open",
    bgClass: "bg-violet-500/30 dark:bg-violet-500/25",
    borderClass: "border-violet-500/50",
    badgeClass:
      "bg-violet-500/30 text-violet-700 dark:text-violet-200 border border-violet-500/50",
  },
  hired: {
    label: "Hired",
    bgClass: "bg-emerald-500/30 dark:bg-emerald-500/25",
    borderClass: "border-emerald-500/50",
    badgeClass:
      "bg-emerald-500/30 text-emerald-700 dark:text-emerald-200 border border-emerald-500/50",
  },
  on_hold: {
    label: "On hold",
    bgClass: "bg-amber-500/30 dark:bg-amber-500/25",
    borderClass: "border-amber-500/50",
    badgeClass:
      "bg-amber-500/30 text-amber-700 dark:text-amber-200 border border-amber-500/50",
  },
  cancelled: {
    label: "Cancelled",
    bgClass: "bg-red-500/30 dark:bg-red-500/25",
    borderClass: "border-red-500/50",
    badgeClass:
      "bg-red-500/30 text-red-700 dark:text-red-200 border border-red-500/50",
  },
};

export function PositionCard({
  position,
  onClick,
  onCandidateClick,
}: Props) {
  const config = statusConfig[position.status];
  const [isExpanded, setIsExpanded] = useState(false);

  const totalToFill = position.quantity ?? 1;
  const hiredCount = position.candidates.filter(
    (c) => c.processStatus === "hired" || c.talentType === "trick_internal"
  ).length;

  const handleToggle = () => {
    setIsExpanded((current) => !current);
  };

  return (
    <article
      className={`overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md ${config.bgClass} ${config.borderClass}`}
    >
      {/* Header clickable: toggle expand + open detail modal */}
      <div className="flex items-center justify-between gap-2 p-4">
        <div
          onClick={onClick}
          className="min-w-0 flex-1 cursor-pointer"
        >
          <h3 className="truncate text-sm font-semibold app-text-primary">
            {position.title} · {position.seniority}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold app-text-primary">
            {hiredCount}/{totalToFill}
          </span>
          <span
            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${config.badgeClass}`}
          >
            {config.label}
          </span>

          {/* Flecha toggle para expandir/colapsar */}
          <button
            onClick={handleToggle}
            className="rounded-lg p-1 transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
            aria-label={isExpanded ? "Collapse candidates" : "Expand candidates"}
          >
            <ChevronDown
              className={`h-4 w-4 app-text-primary transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Candidatos: solo visibles cuando está expandido */}
      {isExpanded && (
        <div className="space-y-2 px-4 pb-4">
          {position.candidates.length > 0 ? (
            position.candidates.map((candidate) => (
              <CandidateMiniCard
                key={candidate.id}
                candidate={candidate}
                onClick={() => onCandidateClick(candidate)}
              />
            ))
          ) : (
            <div
              className="rounded-xl border border-dashed px-3 py-3 text-xs app-text-muted"
              style={{ borderColor: "var(--app-border)" }}
            >
              No candidates linked yet
            </div>
          )}
        </div>
      )}
    </article>
  );
}
