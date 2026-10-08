import type {
  CandidateMini,
  CandidateProcessStatus,
  CandidateResumeStatus,
  StageHistoryEntry,
} from "@/app/data/resourcePlanningMock";

export type StatusTone = "violet" | "green" | "blue" | "amber" | "red" | "gray";

export const AGING_DAYS = 14;
export const CONTACT_ALERT_DAYS = 10;

type StatusInfo = { value: CandidateProcessStatus; label: string; tone: StatusTone };

// Flujo del proceso, en orden. Las claves viejas se conservan para no romper datos guardados:
// "screening" se muestra como "Interviewed", "client_interview" como "Client Tech Interview"
// y "offer" como "Offered".
export const PROCESS_FLOW: StatusInfo[] = [
  { value: "contacted", label: "Contacted", tone: "gray" },
  { value: "screening", label: "Interviewed", tone: "blue" },
  { value: "tech_interview", label: "Tech Interview", tone: "violet" },
  { value: "presented", label: "Presented", tone: "violet" },
  { value: "client_interview", label: "Client Tech Interview", tone: "amber" },
  { value: "to_offer", label: "To offer", tone: "amber" },
  { value: "offer", label: "Offered", tone: "amber" },
  { value: "hired", label: "Hired", tone: "green" },
];

export const PROCESS_OUTCOMES: StatusInfo[] = [
  { value: "offer_rejected", label: "Offer rejected", tone: "red" },
  { value: "rejected", label: "Rejected", tone: "red" },
  { value: "stand_by", label: "Stand by", tone: "gray" },
];

export const PROCESS_STATUS_INFO: Record<
  CandidateProcessStatus,
  { label: string; tone: StatusTone }
> = {
  sourced: { label: "Sourced", tone: "gray" },
  contacted: { label: "Contacted", tone: "gray" },
  screening: { label: "Interviewed", tone: "blue" },
  tech_interview: { label: "Tech Interview", tone: "violet" },
  presented: { label: "Presented", tone: "violet" },
  client_interview: { label: "Client Tech Interview", tone: "amber" },
  to_offer: { label: "To offer", tone: "amber" },
  offer: { label: "Offered", tone: "amber" },
  hired: { label: "Hired", tone: "green" },
  offer_rejected: { label: "Offer rejected", tone: "red" },
  rejected: { label: "Rejected", tone: "red" },
  stand_by: { label: "Stand by", tone: "gray" },
};

export const RESUME_STATUS_INFO: Record<
  CandidateResumeStatus,
  { label: string; tone: StatusTone }
> = {
  none: { label: "No resume", tone: "gray" },
  wip_resume: { label: "WIP resume", tone: "amber" },
  resume_ready: { label: "Resume ready", tone: "green" },
};

export const SENIORITY_LEVELS = [
  "Trainee",
  "Junior",
  "Junior Plus",
  "Semi Senior",
  "Semi Senior Plus",
  "Senior",
  "Senior Plus",
  "Lead",
];

// Las posiciones usan abreviaturas (JR, SSR, SR): se traducen a los niveles completos.
export function normalizeSeniority(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const match = SENIORITY_LEVELS.find(
    (level) => level.toLowerCase() === value.trim().toLowerCase()
  );

  if (match) {
    return match;
  }

  const abbreviations: Record<string, string> = {
    tr: "Trainee",
    jr: "Junior",
    ssr: "Semi Senior",
    sr: "Senior",
    lead: "Lead",
  };

  return abbreviations[value.trim().toLowerCase()];
}

export function seniorityRank(value?: string) {
  const normalized = normalizeSeniority(value);

  return normalized ? SENIORITY_LEVELS.indexOf(normalized) : -1;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function daysSince(isoDate?: string): number | null {
  if (!isoDate) {
    return null;
  }

  const timestamp = new Date(isoDate).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
}

/** Días en proceso: se cuentan desde que el recruiter trajo al candidato a la posición. */
export function getDaysInProcess(candidate: CandidateMini): number | null {
  const computed = daysSince(candidate.processStartedAt);

  if (computed !== null) {
    return computed;
  }

  return typeof candidate.daysInProcess === "number" ? candidate.daysInProcess : null;
}

export function getDaysSinceContact(candidate: CandidateMini): number | null {
  return daysSince(candidate.lastContactAt);
}

export function isHiredCandidate(candidate: CandidateMini) {
  return (
    candidate.processStatus === "hired" || candidate.talentType === "trick_internal"
  );
}

export function isInProcessCandidate(candidate: CandidateMini) {
  return (
    !isHiredCandidate(candidate) &&
    candidate.processStatus !== "rejected" &&
    candidate.processStatus !== "offer_rejected"
  );
}

export function getProcessStatusIndex(status: CandidateProcessStatus) {
  return PROCESS_FLOW.findIndex((item) => item.value === status);
}

export function hasTechInterviewDone(candidate: CandidateMini) {
  return (
    Boolean(candidate.techInterviewDoneAt) ||
    getProcessStatusIndex(candidate.processStatus) >
      getProcessStatusIndex("tech_interview")
  );
}

/**
 * ¿Está listo para presentarse al cliente? Aplica hasta el estado "Presented".
 * Necesita: técnica interna hecha, resume listo y el PDF del resume de Trick Studios adjunto.
 */
export function getPresentationReadiness(candidate: CandidateMini) {
  const index = getProcessStatusIndex(candidate.processStatus);
  const applicable =
    isInProcessCandidate(candidate) &&
    (candidate.processStatus === "sourced" ||
      (index >= 0 && index <= getProcessStatusIndex("presented")));

  const missing: string[] = [];

  if (!hasTechInterviewDone(candidate)) {
    missing.push("internal tech interview result");
  }

  if (candidate.resumeStatus !== "resume_ready") {
    missing.push("resume ready");
  } else if (!(candidate.files?.trickResume?.length ?? 0)) {
    missing.push("Trick Studios resume (PDF)");
  }

  return { applicable, ready: missing.length === 0, missing };
}

// ---------- Historial por etapas ----------
export const STAGE_WARN_DAYS = 7;
export const STAGE_ALERT_DAYS = 14;

// Etapas con entrevista: se pueden agendar y registran quién entrevistó
export const INTERVIEW_STAGES: CandidateProcessStatus[] = [
  "screening",
  "tech_interview",
  "client_interview",
];

export const INTERVIEW_LABELS: Partial<Record<CandidateProcessStatus, string>> = {
  screening: "Recruiter interview",
  tech_interview: "Internal tech interview",
  client_interview: "Client tech interview",
};

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

/** Historial de etapas. Si el candidato es anterior al historial, se arma uno con su estado actual. */
export function getStageHistory(candidate: CandidateMini): StageHistoryEntry[] {
  if (candidate.stageHistory && candidate.stageHistory.length > 0) {
    return candidate.stageHistory;
  }

  return [
    {
      status: candidate.processStatus,
      enteredAt: candidate.processStartedAt ?? isoDaysAgo(candidate.daysInProcess ?? 0),
    },
  ];
}

export function getCurrentStageEntry(candidate: CandidateMini): StageHistoryEntry {
  const history = getStageHistory(candidate);

  return history[history.length - 1];
}

/** Días que lleva en la etapa actual. */
export function getDaysInCurrentStage(candidate: CandidateMini): number | null {
  return daysSince(getCurrentStageEntry(candidate).enteredAt);
}

/** Días entre dos fechas AAAA-MM-DD. */
export function daysBetween(from: string, to: string) {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 0;
  }

  return Math.max(0, Math.floor((end - start) / 86400000));
}

/** Cierra la etapa actual y abre la nueva con la fecha de hoy. */
export function appendStageEntry(
  candidate: CandidateMini,
  next: CandidateProcessStatus,
  extra?: Partial<StageHistoryEntry>
): StageHistoryEntry[] {
  const history = getStageHistory(candidate);
  const last = history[history.length - 1];

  if (last.status === next) {
    return history;
  }

  const today = todayIso();

  return [
    ...history.slice(0, -1),
    { ...last, leftAt: today },
    { status: next, enteredAt: today, ...extra },
  ];
}

export function formatDateTime(value?: string) {
  return value ? value.replace("T", " ") : "";
}