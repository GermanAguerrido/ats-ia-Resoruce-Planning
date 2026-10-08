"use client";

import { useState } from "react";
import { ChevronDown, Clock3, Plus } from "lucide-react";
import type {
  CandidateMini,
  PositionCard as PositionCardType,
} from "@/app/data/resourcePlanningMock";
import { AGING_THRESHOLD_DAYS, getPositionAverageDays } from "@/app/lib/boardMetrics";
import { isHiredCandidate } from "@/app/lib/candidateStatus";
import type { BoardDensity } from "./BoardFilters";
import { CandidateMiniCard } from "./CandidateMiniCard";

type Props = {
  position: PositionCardType;
  density?: BoardDensity;
  readOnly?: boolean;
  isDragging?: boolean;
  canDropHere?: boolean;
  onClick: () => void;
  onCandidateClick: (candidate: CandidateMini) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDropBefore?: () => void;
  onAddCandidate?: () => void;
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
  density = "comfortable",
  readOnly = false,
  isDragging = false,
  canDropHere = false,
  onClick,
  onCandidateClick,
  onDragStart,
  onDragEnd,
  onDropBefore,
  onAddCandidate,
}: Props) {
  const config = statusConfig[position.status];
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);

  const totalToFill = position.quantity ?? 1;
  const hiredCandidates = position.candidates.filter(isHiredCandidate);
  const activeCandidates = position.candidates.filter(
    (candidate) => !isHiredCandidate(candidate)
  );
  const hiredCount = hiredCandidates.length;
  const [showHired, setShowHired] = useState(false);

  // Tiempo promedio de la posición. En modo compacto solo se muestra si hay alerta.
  const averageDays = getPositionAverageDays(position);
  const isAging = averageDays !== null && averageDays >= AGING_THRESHOLD_DAYS;
  const showAverage =
    averageDays !== null && (density === "comfortable" || isAging);

  const handleToggle = () => {
    setIsExpanded((current) => !current);
  };

  return (
    <div
      className="relative"
      onDragOver={(event) => {
        // Arrastrar sobre sí misma: se permite soltar pero no hace nada.
        if (isDragging) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (!canDropHere) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
        setIsDropTarget(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDropTarget(false);
        }
      }}
      onDrop={(event) => {
        if (isDragging) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (!canDropHere) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setIsDropTarget(false);
        onDropBefore?.();
      }}
    >
      {isDropTarget && (
        <div className="pointer-events-none absolute -top-1.5 left-0 right-0 z-10 h-1 rounded bg-violet-500" />
      )}

      <article
        draggable={!readOnly}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", position.id);
          onDragStart?.();
        }}
        onDragEnd={() => {
          setIsDropTarget(false);
          onDragEnd?.();
        }}
        className={`overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md ${
          readOnly ? "" : "cursor-grab active:cursor-grabbing"
        } ${config.bgClass} ${config.borderClass} ${isDragging ? "opacity-40" : ""}`}
      >
        {/* Header: título + relación a la izquierda; tiempo, estado y flecha a la derecha */}
        <div
          className={`flex items-center gap-2 ${
            density === "compact" ? "px-2.5 py-1.5" : "px-3 py-2.5"
          }`}
        >
          <div
            onClick={onClick}
            className="flex min-w-0 flex-1 cursor-pointer items-baseline gap-1.5"
          >
            <h3
              title={`${position.title} · ${position.seniority}`}
              className="min-w-0 truncate text-[12.5px] font-semibold app-text-primary"
            >
              {position.title} · {position.seniority}
            </h3>

            <span className="shrink-0 text-xs font-bold app-text-primary">
              {hiredCount}/{totalToFill}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {showAverage && (
              <span
                title="Average time in process of its candidates"
                className={`inline-flex items-center gap-1 text-[11px] ${
                  isAging ? "bd-amber font-bold" : "app-text-secondary"
                }`}
              >
                <Clock3 className="h-3 w-3" />
                {averageDays}d
              </span>
            )}

            <span
              className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${config.badgeClass}`}
            >
              {config.label}
            </span>

            {/* Flecha toggle para expandir/colapsar */}
            <button
              onClick={handleToggle}
              className="rounded-md p-0.5 transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
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
          <div className="space-y-2 px-3 pb-3">
            {activeCandidates.length > 0 ? (
              activeCandidates.map((candidate) => (
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
                {hiredCandidates.length > 0
                  ? "No active candidates"
                  : "No candidates linked yet"}
              </div>
            )}

            {/* Los contratados salen de la lista y quedan en esta sección plegada */}
            {hiredCandidates.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowHired((current) => !current)}
                  className="flex w-full items-center gap-1.5 rounded-xl border border-dashed px-3 py-2 text-xs font-medium transition app-border app-text-secondary hover:border-emerald-500/50"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      showHired ? "rotate-180" : "-rotate-90"
                    }`}
                  />
                  Hired ({hiredCandidates.length})
                </button>

                {showHired && (
                  <div className="mt-2 space-y-2">
                    {hiredCandidates.map((candidate) => (
                      <CandidateMiniCard
                        key={candidate.id}
                        candidate={candidate}
                        onClick={() => onCandidateClick(candidate)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {onAddCandidate && !readOnly && (
              <button
                type="button"
                onClick={onAddCandidate}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-xs font-medium transition app-border app-text-secondary hover:border-violet-500/40 hover:bg-violet-500/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Add candidate
              </button>
            )}
          </div>
        )}
      </article>
    </div>
  );
}