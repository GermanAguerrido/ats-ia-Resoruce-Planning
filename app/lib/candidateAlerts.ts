import type { CandidateMini, PositionCard } from "@/app/data/resourcePlanningMock";

import {
  AGING_DAYS,
  CONTACT_ALERT_DAYS,
  PROCESS_STATUS_INFO,
  STAGE_ALERT_DAYS,
  STAGE_WARN_DAYS,
  getCurrentStageEntry,
  getDaysInCurrentStage,
  getDaysInProcess,
  getDaysSinceContact,
  getProcessStatusIndex,
  isInProcessCandidate,
  seniorityRank,
} from "./candidateStatus";

export type CandidateAlert = {
  id: string;
  label: string;
  // warn = amarillo, danger = rojo
  tone: "warn" | "danger";
};

/**
 * Alertas de un candidato en proceso: son las mismas que se ven en su ficha. Se usan en el
 * filtro "My alerts" del tablero. Los umbrales están en candidateStatus (7 y 14 días en etapa,
 * 10 días sin contacto, 14 días en proceso).
 */
export function getCandidateAlerts(
  candidate: CandidateMini,
  position: PositionCard,
  ndaApplies = false
): CandidateAlert[] {
  if (!isInProcessCandidate(candidate)) {
    return [];
  }

  const alerts: CandidateAlert[] = [];
  const stageDays = getDaysInCurrentStage(candidate);
  const stageLabel = PROCESS_STATUS_INFO[candidate.processStatus].label;
  const contactDays = getDaysSinceContact(candidate);
  const processDays = getDaysInProcess(candidate);
  const entry = getCurrentStageEntry(candidate);
  const now = Date.now();

  if (stageDays !== null && stageDays >= STAGE_WARN_DAYS) {
    alerts.push({
      id: "stage",
      label: `${stageDays}d in ${stageLabel}`,
      tone: stageDays >= STAGE_ALERT_DAYS ? "danger" : "warn",
    });
  }

  if (contactDays !== null && contactDays >= CONTACT_ALERT_DAYS) {
    alerts.push({ id: "contact", label: `No contact ${contactDays}d`, tone: "warn" });
  }

  if ((candidate.contactAttempts ?? 0) >= 2) {
    alerts.push({
      id: "attempts",
      label: `${candidate.contactAttempts} attempts without reply`,
      tone: "danger",
    });
  }

  const scheduledAt = candidate.scheduledInterview?.at ?? entry.scheduledFor;

  if (scheduledAt && new Date(scheduledAt).getTime() < now) {
    alerts.push({ id: "interview", label: "Interview date passed", tone: "danger" });
  }

  const nda = candidate.ndaStatus ?? "required";

  if (
    ndaApplies &&
    nda !== "signed" &&
    getProcessStatusIndex(candidate.processStatus) >= getProcessStatusIndex("tech_interview")
  ) {
    alerts.push({ id: "nda", label: "NDA pending", tone: "warn" });
  }

  if (
    candidate.seniority &&
    seniorityRank(position.seniority) >= 0 &&
    seniorityRank(candidate.seniority) < seniorityRank(position.seniority)
  ) {
    alerts.push({ id: "level", label: "Below required level", tone: "warn" });
  }

  if (
    processDays !== null &&
    processDays >= AGING_DAYS &&
    !(stageDays !== null && stageDays >= STAGE_ALERT_DAYS)
  ) {
    alerts.push({ id: "aging", label: `${processDays}d in process`, tone: "warn" });
  }

  return alerts;
}

/** ¿El candidato es del usuario? (recruiter owner o co-recruiter) */
export function isCandidateOf(candidate: CandidateMini, user: string) {
  return candidate.recruiterOwner === user || (candidate.coRecruiters ?? []).includes(user);
}
