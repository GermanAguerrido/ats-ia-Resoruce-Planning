"use client";

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Plus } from "lucide-react";
import type {
  CandidateMini,
  CandidateProcessStatus,
  PositionCard,
  PositionStatus,
  ProjectColumn,
} from "@/app/data/resourcePlanningMock";
import { getPositionAverageDays, getProjectMetrics } from "@/app/lib/boardMetrics";
import {
  PROCESS_FLOW,
  PROCESS_OUTCOMES,
  PROCESS_STATUS_INFO,
  STAGE_ALERT_DAYS,
  STAGE_WARN_DAYS,
  getCurrentStageEntry,
  getDaysInCurrentStage,
  isInProcessCandidate,
  normalizeSeniority,
} from "@/app/lib/candidateStatus";
import { formatPositionTarget } from "@/app/lib/positionTarget";
import { canUndoMoves, useCurrentUser } from "@/app/lib/currentUser";
import type { StageMoveInput } from "@/app/lib/stageGates";
import { StageTransitionDialog } from "./StageTransitionDialog";
import { UserAvatar } from "./UserAvatar";

type PipelineGroup = { project: ProjectColumn; archived: boolean };

type Props = {
  groups: PipelineGroup[];
  visibleStatuses: ReadonlySet<PositionStatus>;
  onOpenProject: (project: ProjectColumn) => void;
  onOpenPosition: (project: ProjectColumn, position: PositionCard) => void;
  onOpenCandidate: (
    project: ProjectColumn,
    position: PositionCard,
    candidate: CandidateMini
  ) => void;
  onAddCandidate: (project: ProjectColumn, position: PositionCard) => void;
  // Devuelve cómo estaba el candidato antes (para poder deshacer) o null si no cambió nada
  onMoveCandidate: (
    projectId: string,
    positionId: string,
    candidateId: string,
    next: CandidateProcessStatus,
    options?: { input?: StageMoveInput; author?: string }
  ) => CandidateMini | null;
  onRestoreCandidate: (
    projectId: string,
    positionId: string,
    snapshot: CandidateMini,
    author: string
  ) => void;
};

type Tone = "violet" | "green" | "blue" | "amber" | "red" | "gray";

// Cada etapa tiene su color: del frío (inicio) al cálido y verde (contratado)
const STAGE_COLORS: Record<string, string> = {
  contacted: "#64748b",
  screening: "#3b82f6",
  tech_interview: "#8b5cf6",
  presented: "#d946ef",
  client_interview: "#f59e0b",
  to_offer: "#f97316",
  offer: "#14b8a6",
  hired: "#22c55e",
};

const PRIORITY_COLORS: Record<ProjectColumn["priority"], string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const POSITION_COLORS: Record<PositionStatus, string> = {
  open: "#8b5cf6",
  on_hold: "#f59e0b",
  hired: "#22c55e",
  cancelled: "#ef4444",
};

const projectStatusLabel: Record<ProjectColumn["status"], { label: string; tone: Tone }> = {
  active_search: { label: "Active", tone: "violet" },
  coming_soon: { label: "Coming soon", tone: "blue" },
  active_no_search: { label: "No searches", tone: "gray" },
  inactive: { label: "Inactive", tone: "gray" },
};

const priorityLabel: Record<ProjectColumn["priority"], { label: string; tone: Tone }> = {
  high: { label: "High", tone: "red" },
  medium: { label: "Medium", tone: "amber" },
  low: { label: "Low", tone: "green" },
};

const positionStatusLabel: Record<PositionStatus, { label: string; tone: Tone }> = {
  open: { label: "Open", tone: "violet" },
  on_hold: { label: "On hold", tone: "amber" },
  hired: { label: "Hired", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

// Columnas: posición, una por etapa y resultados
const GRID_COLUMNS = `250px repeat(${PROCESS_FLOW.length}, 184px) 176px`;
const STICKY_LEFT = 14;
const SURFACE = "var(--app-surface)";

// "sourced" es un estado viejo: se muestra junto a Contacted
function stageOf(candidate: CandidateMini): CandidateProcessStatus {
  return candidate.processStatus === "sourced" ? "contacted" : candidate.processStatus;
}

function daysColor(days: number) {
  if (days >= STAGE_ALERT_DAYS) return "#ef4444";
  if (days >= STAGE_WARN_DAYS) return "#f59e0b";
  return "#64748b";
}

function formatSchedule(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })} · ${date.toLocaleTimeString(
    "en-GB",
    { hour: "2-digit", minute: "2-digit" }
  )}`;
}

function tint(color: string, percent: number) {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

function PipelineStyles() {
  return (
    <style>{`
      .pl-chip {
        display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
        border-radius: 9999px; border: 1px solid; padding: 2px 8px;
        font-size: 10.5px; font-weight: 700;
      }
      .pl-violet { background: rgba(124,58,237,.12); border-color: rgba(124,58,237,.4); color: #6d28d9; }
      .pl-green  { background: rgba(34,197,94,.14);  border-color: rgba(34,197,94,.45);  color: #15803d; }
      .pl-blue   { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.4);  color: #1d4ed8; }
      .pl-amber  { background: rgba(245,158,11,.16); border-color: rgba(245,158,11,.45); color: #b45309; }
      .pl-red    { background: rgba(239,68,68,.12);  border-color: rgba(239,68,68,.4);   color: #b91c1c; }
      .pl-gray   { background: rgba(113,113,122,.12); border-color: rgba(113,113,122,.35); color: #52525b; }
      html[data-theme="dark"] .pl-violet { background: rgba(124,58,237,.18); border-color: rgba(124,58,237,.5); color: #c4b5fd; }
      html[data-theme="dark"] .pl-green  { background: rgba(34,197,94,.16);  border-color: rgba(34,197,94,.45);  color: #86efac; }
      html[data-theme="dark"] .pl-blue   { background: rgba(59,130,246,.16); border-color: rgba(59,130,246,.45); color: #93c5fd; }
      html[data-theme="dark"] .pl-amber  { background: rgba(245,158,11,.16); border-color: rgba(245,158,11,.45); color: #fcd34d; }
      html[data-theme="dark"] .pl-red    { background: rgba(239,68,68,.16);  border-color: rgba(239,68,68,.45);  color: #fca5a5; }
      html[data-theme="dark"] .pl-gray   { background: rgba(161,161,170,.12); border-color: rgba(161,161,170,.3); color: #d4d4d8; }
      .pl-flame { color: #b45309; font-weight: 800; }
      html[data-theme="dark"] .pl-flame { color: #fbbf24; }
      .pl-card { transition: transform .12s, box-shadow .12s; box-shadow: 0 2px 6px rgba(15,23,42,.12); }
      .pl-card:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(15,23,42,.22); }
      .pl-hired { color: #15803d; border-color: rgba(34,197,94,.5); }
      html[data-theme="dark"] .pl-hired { color: #86efac; }
    `}</style>
  );
}

function Chip({
  tone,
  title,
  children,
}: {
  tone: Tone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span title={title} className={`pl-chip pl-${tone}`}>
      {children}
    </span>
  );
}

/**
 * Vista Pipeline: una fila por posición y los candidatos bajo cada etapa.
 * Solo se puede arrastrar dentro de la misma posición.
 */
export function PipelineView({
  groups,
  visibleStatuses,
  onOpenProject,
  onOpenPosition,
  onOpenCandidate,
  onAddCandidate,
  onMoveCandidate,
  onRestoreCandidate,
}: Props) {
  const { user, role } = useCurrentUser();
  const dragRef = useRef<{ projectId: string; positionId: string; candidateId: string } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [overKey, setOverKey] = useState<string | null>(null);
  // Movimiento esperando confirmación en el diálogo de requisitos
  const [pending, setPending] = useState<{
    projectId: string;
    positionId: string;
    candidate: CandidateMini;
    to: CandidateProcessStatus;
  } | null>(null);
  // Último movimiento confirmado: Talent y Admin pueden deshacerlo por unos segundos
  const [lastMove, setLastMove] = useState<{
    projectId: string;
    positionId: string;
    snapshot: CandidateMini;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!lastMove) {
      return;
    }

    const timer = window.setTimeout(() => setLastMove(null), 10000);

    return () => window.clearTimeout(timer);
  }, [lastMove]);

  const lanes = groups.map((group) => ({
    ...group,
    positions: group.project.positions.filter((position) =>
      visibleStatuses.has(position.status)
    ),
  }));

  // Totales y promedio de días por etapa (sobre lo que se ve)
  const allCandidates = lanes.flatMap((group) =>
    group.positions.flatMap((position) => position.candidates)
  );

  const stageStats = PROCESS_FLOW.map((stage) => {
    const items = allCandidates.filter((candidate) => stageOf(candidate) === stage.value);
    const days = items
      .map((candidate) => getDaysInCurrentStage(candidate))
      .filter((value): value is number => value !== null);

    return {
      value: stage.value,
      label: stage.label,
      count: items.length,
      average: days.length > 0 ? days.reduce((total, value) => total + value, 0) / days.length : 0,
    };
  });

  const slowest = stageStats
    .filter((stage) => stage.value !== "hired" && stage.count > 0)
    .sort((a, b) => b.average - a.average)[0]?.value;

  const handleDragStart = (
    event: DragEvent,
    projectId: string,
    positionId: string,
    candidateId: string
  ) => {
    dragRef.current = { projectId, positionId, candidateId };
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", candidateId);
    window.setTimeout(() => setIsDragging(true), 0);
  };

  const endDrag = () => {
    dragRef.current = null;
    setIsDragging(false);
    setOverKey(null);
  };

  const dropTargetProps = (positionId: string, status: CandidateProcessStatus) => {
    const key = `${positionId}:${status}`;

    return {
      onDragOver: (event: DragEvent) => {
        const drag = dragRef.current;

        if (!drag || drag.positionId !== positionId) {
          return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOverKey(key);
      },
      onDragLeave: (event: DragEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOverKey((current) => (current === key ? null : current));
        }
      },
      onDrop: (event: DragEvent) => {
        const drag = dragRef.current;

        if (!drag || drag.positionId !== positionId) {
          return;
        }

        event.preventDefault();

        const candidate = groups
          .find((group) => group.project.id === drag.projectId)
          ?.project.positions.find((position) => position.id === positionId)
          ?.candidates.find((item) => item.id === drag.candidateId);

        endDrag();

        if (!candidate || stageOf(candidate) === status) {
          return;
        }

        // Todo movimiento pasa por el diálogo: pide lo que corresponde y deja el comentario
        setPending({ projectId: drag.projectId, positionId, candidate, to: status });
      },
      isOver: overKey === key,
    };
  };

  const renderCard = (
    group: PipelineGroup,
    position: PositionCard,
    candidate: CandidateMini
  ) => {
    const days = getDaysInCurrentStage(candidate);
    const entry = getCurrentStageEntry(candidate);
    const active = isInProcessCandidate(candidate);
    const color = STAGE_COLORS[stageOf(candidate)] ?? "#64748b";
    const scheduledPassed =
      entry.scheduledFor && new Date(entry.scheduledFor).getTime() < Date.now();

    return (
      <div
        key={candidate.id}
        draggable={!group.archived}
        onDragStart={(event) =>
          handleDragStart(event, group.project.id, position.id, candidate.id)
        }
        onDragEnd={endDrag}
        onClick={() => onOpenCandidate(group.project, position, candidate)}
        className={`pl-card rounded-xl border px-2.5 py-2.5 text-xs app-border ${
          group.archived ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
        }`}
        style={{
          backgroundColor: "var(--app-surface-muted)",
          borderLeft: `4px solid ${color}`,
        }}
      >
        <div className="flex items-center gap-2">
          <b className="min-w-0 flex-1 truncate text-[13px] app-text-primary">
            {candidate.name}
          </b>
          <UserAvatar name={candidate.recruiterOwner} />
        </div>

        <p className="mt-0.5 text-[11px] app-text-muted">
          {candidate.seniority ?? normalizeSeniority(position.seniority) ?? position.seniority}
        </p>

        <div className="mt-2 flex flex-wrap gap-1">
          {active && days !== null && (
            <Chip
              tone={
                days >= STAGE_ALERT_DAYS ? "red" : days >= STAGE_WARN_DAYS ? "amber" : "gray"
              }
              title="Days in this stage"
            >
              🕒 {days}d
            </Chip>
          )}

          {entry.scheduledFor && (
            <Chip
              tone={scheduledPassed ? "amber" : "blue"}
              title={scheduledPassed ? "The scheduled date has passed" : "Scheduled interview"}
            >
              📅 {formatSchedule(entry.scheduledFor)}
            </Chip>
          )}
        </div>

        {/* La barra se llena hasta el umbral de alerta de la etapa */}
        {active && days !== null && (
          <div
            className="mt-2 h-1 overflow-hidden rounded-full"
            style={{ backgroundColor: "rgba(148,163,184,.25)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(days / STAGE_ALERT_DAYS, 1) * 100}%`,
                backgroundColor: daysColor(days),
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto rounded-2xl border app-border app-bg">
      <PipelineStyles />

      <div className="min-w-max px-3.5 pb-4">
        {/* Encabezado fijo: el color, el total y el promedio de cada etapa */}
        <div className="sticky top-0 z-30 pb-2 pt-3 app-bg">
          <div className="grid" style={{ gridTemplateColumns: GRID_COLUMNS }}>
            <div className="self-end px-1.5 pb-2 text-[11px] font-extrabold uppercase tracking-wider app-text-muted">
              Position
            </div>

            {stageStats.map((stage) => {
              const color = STAGE_COLORS[stage.value];

              return (
                <div
                  key={stage.value}
                  className="mr-1.5 rounded-t-xl px-3 pb-2 pt-2.5 shadow-sm"
                  style={{ backgroundColor: SURFACE, borderTop: `3px solid ${color}` }}
                >
                  <p className="mb-1.5 text-[12.5px] font-bold app-text-primary">{stage.label}</p>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="min-w-[22px] rounded-md px-1.5 text-center text-xs font-extrabold app-text-primary"
                      style={{ backgroundColor: tint(color, 22) }}
                    >
                      {stage.count}
                    </span>

                    {stage.value !== "hired" && (
                      <span className="text-[10.5px] app-text-muted">
                        avg {Math.round(stage.average)}d
                      </span>
                    )}
                  </div>

                  {stage.value === slowest && (
                    <p className="pl-flame mt-1.5 text-[10px]">🔥 Slowest stage</p>
                  )}
                </div>
              );
            })}

            <div
              className="rounded-t-xl px-3 pb-2 pt-2.5 shadow-sm"
              style={{ backgroundColor: SURFACE, borderTop: "3px solid #ef4444" }}
            >
              <p className="mb-1.5 text-[12.5px] font-bold app-text-primary">Outcome</p>
              <p className="text-[10.5px] app-text-muted">drop here</p>
            </div>
          </div>

          {isDragging && (
            <p className="mt-2 px-1.5 text-xs font-medium text-violet-500">
              Drop the candidate in a column of the same position.
            </p>
          )}
        </div>

        {lanes.map((group) => {
          const project = group.project;
          const status = projectStatusLabel[project.status];
          const priority = priorityLabel[project.priority];
          const metrics = getProjectMetrics(project);
          const totalCandidates = project.positions.reduce(
            (total, position) => total + position.candidates.length,
            0
          );

          return (
            <div key={project.id} className={group.archived ? "opacity-70" : ""}>
              {/* Banner del proyecto */}
              <div
                className="sticky my-3.5 flex w-fit min-w-[760px] items-center gap-3 rounded-2xl border px-3.5 py-2.5 shadow-sm app-border"
                style={{
                  left: STICKY_LEFT,
                  backgroundColor: SURFACE,
                  borderLeft: `5px solid ${PRIORITY_COLORS[project.priority]}`,
                }}
              >
                <img
                  src={project.cover}
                  alt=""
                  className="h-[42px] w-[42px] shrink-0 rounded-xl object-cover"
                />

                <button
                  type="button"
                  onClick={() => onOpenProject(project)}
                  className="text-left hover:underline"
                >
                  <span className="block text-[10.5px] font-semibold uppercase tracking-wider app-text-muted">
                    {project.clientName}
                  </span>
                  <span className="block text-[15px] font-bold app-text-primary">
                    {project.projectName}
                  </span>
                </button>

                <Chip tone={status.tone}>{status.label}</Chip>
                <Chip tone={priority.tone}>⚑ {priority.label}</Chip>
                {project.confidential && <Chip tone="red">🔒 Confidential</Chip>}
                {group.archived && <Chip tone="gray">Archived</Chip>}

                <p className="ml-auto text-xs app-text-secondary">
                  <b className="app-text-primary">{metrics.openPositions}</b> open ·{" "}
                  <b className="app-text-primary">{totalCandidates}</b> candidates ·{" "}
                  <b className="app-text-primary">
                    {metrics.hired}/{metrics.requested}
                  </b>{" "}
                  hired
                </p>
              </div>

              {group.positions.length === 0 && (
                <p
                  className="sticky mb-3 w-fit px-2 text-xs app-text-muted"
                  style={{ left: STICKY_LEFT }}
                >
                  No positions to show.
                </p>
              )}

              {group.positions.map((position) => {
                const positionTag = positionStatusLabel[position.status];
                const statusColor = POSITION_COLORS[position.status];
                const quantity = position.quantity ?? 1;
                const hired = position.candidates.filter(
                  (candidate) => stageOf(candidate) === "hired"
                ).length;
                const average = getPositionAverageDays(position);
                const outcomeStatuses = PROCESS_OUTCOMES.map((item) => item.value);

                return (
                  <div
                    key={position.id}
                    className="mb-2.5 grid overflow-clip rounded-2xl border shadow-sm app-border"
                    style={{ gridTemplateColumns: GRID_COLUMNS, backgroundColor: SURFACE }}
                  >
                    {/* Posición: la barra de color indica su estado */}
                    <div
                      className="sticky z-10 border-r px-4 py-3 app-border"
                      style={{
                        left: STICKY_LEFT,
                        backgroundColor: SURFACE,
                        borderLeft: `5px solid ${statusColor}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenPosition(project, position)}
                          className="text-left text-[14px] font-extrabold leading-tight hover:underline app-text-primary"
                        >
                          {position.title}
                          <span className="font-semibold app-text-muted"> · {position.seniority}</span>
                        </button>

                        {!group.archived && (
                          <button
                            type="button"
                            title="Add candidate"
                            aria-label="Add candidate"
                            onClick={() => onAddCandidate(project, position)}
                            className="shrink-0 rounded-md border p-1 app-border app-text-secondary hover:bg-black/[0.05]"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Chip tone={positionTag.tone}>{positionTag.label}</Chip>

                        {quantity <= 6 ? (
                          <span
                            className="inline-flex gap-[3px]"
                            title={`${hired}/${quantity} hired`}
                          >
                            {Array.from({ length: quantity }).map((_, index) => (
                              <i
                                key={index}
                                className="h-[9px] w-[9px] rounded-full"
                                style={{
                                  border: `2px solid ${statusColor}`,
                                  backgroundColor: index < hired ? statusColor : "transparent",
                                }}
                              />
                            ))}
                          </span>
                        ) : (
                          <b className="text-[11px] app-text-primary">
                            {hired}/{quantity}
                          </b>
                        )}

                        {average !== null && <Chip tone="gray">🕒 avg {average}d</Chip>}

                        {position.moreCandidatesRequestedAt && (
                          <Chip tone="amber" title="More candidates requested">
                            ⚑ More candidates
                          </Chip>
                        )}

                        {position.jdReviewedAt && (
                          <Chip tone="green" title="JD reviewed">
                            ✓ JD
                          </Chip>
                        )}

                        <Chip tone="blue" title="Target">
                          🎯 {formatPositionTarget(position.target)}
                        </Chip>
                      </div>
                    </div>

                    {PROCESS_FLOW.map((stage) => {
                      const color = STAGE_COLORS[stage.value];
                      const target = dropTargetProps(position.id, stage.value);
                      const items = position.candidates.filter(
                        (candidate) => stageOf(candidate) === stage.value
                      );

                      return (
                        <div
                          key={stage.value}
                          onDragOver={target.onDragOver}
                          onDragLeave={target.onDragLeave}
                          onDrop={target.onDrop}
                          className="grid min-h-[96px] content-start gap-2 border-r p-2 transition app-border"
                          style={{
                            backgroundColor: tint(color, target.isOver ? 22 : 6),
                            boxShadow: target.isOver ? `inset 0 0 0 2px ${color}` : undefined,
                          }}
                        >
                          {stage.value === "hired"
                            ? items.map((candidate) => (
                                <button
                                  key={candidate.id}
                                  type="button"
                                  onClick={() => onOpenCandidate(project, position, candidate)}
                                  className="pl-hired block w-full truncate rounded-lg border border-dashed px-2 py-1.5 text-left text-[11.5px] opacity-85 hover:opacity-100"
                                  title={`${candidate.name} · hired ${candidate.hiredAt ?? ""}`}
                                >
                                  ✓ {candidate.name}
                                  {candidate.hiredAt ? ` · ${candidate.hiredAt}` : ""}
                                </button>
                              ))
                            : items.map((candidate) => renderCard(group, position, candidate))}
                        </div>
                      );
                    })}

                    <div className="space-y-2 p-2">
                      {outcomeStatuses.map((outcome) => {
                        const target = dropTargetProps(position.id, outcome);
                        const items = position.candidates.filter(
                          (candidate) => candidate.processStatus === outcome
                        );

                        return (
                          <div
                            key={outcome}
                            onDragOver={target.onDragOver}
                            onDragLeave={target.onDragLeave}
                            onDrop={target.onDrop}
                            className="rounded-lg border border-dashed px-2 py-1.5 text-[11px] transition app-border"
                            style={{
                              backgroundColor: target.isOver ? tint("#8b5cf6", 14) : undefined,
                              boxShadow: target.isOver ? "inset 0 0 0 2px #8b5cf6" : undefined,
                            }}
                          >
                            <p className="app-text-muted">
                              {PROCESS_STATUS_INFO[outcome].label}
                              {items.length > 0 && ` · ${items.length}`}
                            </p>

                            {items.map((candidate) => (
                              <div
                                key={candidate.id}
                                draggable={!group.archived}
                                onDragStart={(event) =>
                                  handleDragStart(event, project.id, position.id, candidate.id)
                                }
                                onDragEnd={endDrag}
                                onClick={() => onOpenCandidate(project, position, candidate)}
                                className="mt-1 cursor-pointer truncate rounded-md border px-1.5 py-1 text-[11px] app-border app-text-primary"
                                style={{ backgroundColor: "var(--app-surface-muted)" }}
                              >
                                {candidate.name}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {lanes.length === 0 && (
          <p
            className="sticky w-fit px-2 py-10 text-sm app-text-muted"
            style={{ left: STICKY_LEFT }}
          >
            No projects match the current filters.
          </p>
        )}
      </div>

      {pending && (() => {
        const group = groups.find((item) => item.project.id === pending.projectId);
        const position = group?.project.positions.find((item) => item.id === pending.positionId);

        if (!group || !position) {
          return null;
        }

        return (
          <StageTransitionDialog
            candidate={pending.candidate}
            project={group.project}
            position={position}
            to={pending.to}
            user={user}
            role={role}
            onCancel={() => setPending(null)}
            onConfirm={(input) => {
              const snapshot = onMoveCandidate(
                pending.projectId,
                pending.positionId,
                pending.candidate.id,
                pending.to,
                { input, author: user }
              );

              if (snapshot) {
                setLastMove({
                  projectId: pending.projectId,
                  positionId: pending.positionId,
                  snapshot,
                  text: `${snapshot.name} moved to ${PROCESS_STATUS_INFO[pending.to].label}`,
                });
              }

              setPending(null);
            }}
          />
        );
      })()}

      {lastMove && (
        <div className="fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-4 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-white shadow-2xl">
          <span>{lastMove.text}</span>

          {canUndoMoves(role) && (
            <button
              type="button"
              onClick={() => {
                onRestoreCandidate(
                  lastMove.projectId,
                  lastMove.positionId,
                  lastMove.snapshot,
                  user
                );
                setLastMove(null);
              }}
              className="font-semibold text-violet-300 hover:underline"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
