import { MessageSquare, UserRound } from "lucide-react";
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
    className: "rp-position-open",
    bar: "bg-violet-500",
  },
  hired: {
    label: "Hired",
    className: "rp-position-hired",
    bar: "bg-emerald-500",
  },
  on_hold: {
    label: "On hold",
    className: "rp-position-on-hold",
    bar: "bg-amber-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "rp-position-cancelled",
    bar: "bg-red-500",
  },
};

export function PositionCard({
  position,
  onClick,
  onCandidateClick,
}: Props) {
  const config = statusConfig[position.status];

  return (
    <article
      onClick={onClick}
      className="cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition app-border app-card hover:border-violet-500/40 hover:shadow-md"
    >
      <div className={`h-1.5 ${config.bar}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold app-text-primary">
              {position.title}
            </h3>

            <p className="mt-1 text-xs app-text-secondary">
              Seniority: {position.seniority}
            </p>
          </div>

          <span
            className={`rp-board-badge shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${config.className}`}
          >
            {config.label}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs app-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5" />
            {position.owner}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Activity
          </span>
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
            <div className="rounded-xl border border-dashed px-3 py-3 text-xs app-border app-text-muted">
              No candidates linked yet
            </div>
          )}
        </div>
      </div>
    </article>
  );
}