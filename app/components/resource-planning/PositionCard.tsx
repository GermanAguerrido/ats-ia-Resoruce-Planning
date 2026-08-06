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

  const totalToFill = position.quantity ?? 1;
  const hiredCount = position.candidates.filter(
    (c) => c.processStatus === "hired" || c.talentType === "trick_internal"
  ).length;

  return (
    <article
      onClick={onClick}
      className={`cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md ${config.bgClass} ${config.borderClass}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
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
          </div>
        </div>

        <div className="mt-4 space-y-2">
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
      </div>
    </article>
  );
}
