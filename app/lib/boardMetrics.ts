import type { PositionCard, ProjectColumn } from "@/app/data/resourcePlanningMock";

import {
  AGING_DAYS,
  getDaysInProcess,
  isHiredCandidate,
  isInProcessCandidate,
} from "./candidateStatus";

export { isHiredCandidate, isInProcessCandidate };

export const AGING_THRESHOLD_DAYS = AGING_DAYS;

/** Promedio de días en proceso de los candidatos activos de una posición (null si no hay). */
export function getPositionAverageDays(position: PositionCard): number | null {
  const activeCandidates = position.candidates.filter(
    (candidate) =>
      isInProcessCandidate(candidate) && getDaysInProcess(candidate) !== null
  );

  if (activeCandidates.length === 0) {
    return null;
  }

  const totalDays = activeCandidates.reduce(
    (total, candidate) => total + (getDaysInProcess(candidate) ?? 0),
    0
  );

  return Math.round(totalDays / activeCandidates.length);
}

export type ProjectMetrics = {
  openPositions: number;
  inProcess: number;
  presented: number;
  hired: number;
  requested: number;
  agingCandidates: number;
  emptyOpenPositions: number;
  alerts: number;
};

const PRESENTED_STATUSES = ["presented", "client_interview", "to_offer", "offer"];

export function getProjectMetrics(project: ProjectColumn): ProjectMetrics {
  const candidates = project.positions.flatMap((position) => position.candidates);
  const inProcessCandidates = candidates.filter(isInProcessCandidate);
  const openPositions = project.positions.filter(
    (position) => position.status === "open"
  );

  const agingCandidates = inProcessCandidates.filter(
    (candidate) => (getDaysInProcess(candidate) ?? 0) >= AGING_THRESHOLD_DAYS
  ).length;

  const emptyOpenPositions = openPositions.filter(
    (position) => position.candidates.length === 0
  ).length;

  return {
    openPositions: openPositions.length,
    inProcess: inProcessCandidates.length,
    presented: inProcessCandidates.filter((candidate) =>
      PRESENTED_STATUSES.includes(candidate.processStatus)
    ).length,
    hired: candidates.filter(isHiredCandidate).length,
    requested: project.positions
      .filter((position) => position.status === "open" || position.status === "hired")
      .reduce((total, position) => total + (position.quantity ?? 1), 0),
    agingCandidates,
    emptyOpenPositions,
    alerts: agingCandidates + emptyOpenPositions,
  };
}

/** Texto corto (una línea) y texto completo (tooltip) de las alertas de un proyecto. */
export function getAlertSummary(metrics: ProjectMetrics) {
  const short: string[] = [];
  const full: string[] = [];

  if (metrics.agingCandidates > 0) {
    short.push(`${metrics.agingCandidates} over ${AGING_THRESHOLD_DAYS}d`);
    full.push(
      `${metrics.agingCandidates} ${
        metrics.agingCandidates === 1 ? "candidate" : "candidates"
      } over ${AGING_THRESHOLD_DAYS} days in process`
    );
  }

  if (metrics.emptyOpenPositions > 0) {
    short.push(`${metrics.emptyOpenPositions} without candidates`);
    full.push(
      `${metrics.emptyOpenPositions} open ${
        metrics.emptyOpenPositions === 1 ? "position" : "positions"
      } without candidates`
    );
  }

  return { short: short.join(" · "), full: full.join(" · ") };
}