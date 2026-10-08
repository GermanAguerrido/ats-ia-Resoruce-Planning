import type {
    CandidateMini,
    CandidateProcessStatus,
    PositionCard,
    ProjectColumn,
  } from "@/app/data/resourcePlanningMock";
  
  import {
    PROCESS_OUTCOMES,
    PROCESS_STATUS_INFO,
    appendStageEntry,
    daysBetween,
    getProcessStatusIndex,
    todayIso,
  } from "./candidateStatus";
  import type { TechInterview } from "./techInterviews";
  
  /**
   * Requisitos para mover un candidato de etapa. Se aplican igual desde la vista Pipeline y
   * desde el detalle del candidato. Cada movimiento deja un comentario automático en la tarjeta.
   */
  
  export type MoveKind = "forward" | "skip" | "backward" | "outcome" | "reopen";
  
  export type StageGate = {
    // Qué se pide en el diálogo
    needsPersonalInfo?: boolean;
    needsTechInterview?: boolean;
    commentLabel?: string;
    commentRequired?: boolean;
    commentPlaceholder?: string;
    dateLabel?: string;
    // "datetime" para fecha y hora (entrevista con el cliente)
    dateKind?: "date" | "datetime";
    startDateLabel?: string;
    // Texto corto para el título del diálogo
    title: string;
  };
  
  // Requisitos de cada etapa de destino
  export const STAGE_GATES: Partial<Record<CandidateProcessStatus, StageGate>> = {
    screening: {
      title: "Move to Interviewed",
      needsPersonalInfo: true,
      commentLabel: "HR notes",
      commentRequired: true,
      commentPlaceholder: "Summary of the recruiter interview...",
    },
    tech_interview: {
      title: "Move to Tech Interview",
      needsTechInterview: true,
    },
    presented: {
      title: "Present to the client",
      commentLabel: "Presented to the client",
      commentRequired: true,
      commentPlaceholder: "To whom and how it was presented (email, link, etc.)",
      dateLabel: "Presentation date",
    },
    client_interview: {
      title: "Move to Client Tech Interview",
      commentLabel: "Client interview scheduled",
      commentRequired: true,
      commentPlaceholder: "Who interviews, format, link...",
      dateLabel: "Interview date and time",
      dateKind: "datetime",
    },
    to_offer: {
      title: "Move to To offer",
      commentLabel: "Approved by the client",
      commentRequired: true,
      commentPlaceholder: "Who approved and any conditions...",
    },
    offer: {
      title: "Send the offer",
      commentLabel: "Offer details (optional)",
      commentRequired: false,
      commentPlaceholder: "Salary, conditions...",
      dateLabel: "Offer date",
    },
    hired: {
      title: "Mark as Hired",
      commentLabel: "Offer accepted",
      commentRequired: true,
      commentPlaceholder: "Confirmation of the acceptance...",
      dateLabel: "Hire date",
      startDateLabel: "Start date",
    },
  };
  
  export const OUTCOME_REASONS: Record<string, string[]> = {
    rejected: [
      "Seniority too low",
      "Rejected by the client",
      "Rejected by Trick",
      "Candidate withdrew",
      "Other",
    ],
    offer_rejected: [
      "Salary",
      "Counteroffer from current company",
      "Other offer",
      "Personal reasons",
      "Other",
    ],
    stand_by: [
      "Position on hold",
      "Candidate not available now",
      "Revisit later",
      "Other",
    ],
  };
  
  export function isOutcomeStatus(status: CandidateProcessStatus) {
    return PROCESS_OUTCOMES.some((item) => item.value === status);
  }
  
  export function classifyMove(
    from: CandidateProcessStatus,
    to: CandidateProcessStatus
  ): MoveKind {
    if (isOutcomeStatus(to)) {
      return "outcome";
    }
  
    if (isOutcomeStatus(from)) {
      return "reopen";
    }
  
    const diff = getProcessStatusIndex(to) - getProcessStatusIndex(from);
  
    if (diff < 0) {
      return "backward";
    }
  
    return diff > 1 ? "skip" : "forward";
  }
  
  /** Etapas que se saltean (sin contar origen ni destino). */
  export function countSkippedStages(
    from: CandidateProcessStatus,
    to: CandidateProcessStatus
  ) {
    return Math.max(0, getProcessStatusIndex(to) - getProcessStatusIndex(from) - 1);
  }
  
  export type PersonalInfoKey = "email" | "linkedin" | "location" | "salaryExpected";
  
  export const PERSONAL_INFO_FIELDS: { key: PersonalInfoKey; label: string }[] = [
    { key: "email", label: "Email" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "location", label: "Location" },
    { key: "salaryExpected", label: "Expected salary" },
  ];
  
  export function getMissingPersonalInfo(candidate: CandidateMini): PersonalInfoKey[] {
    return PERSONAL_INFO_FIELDS.filter(({ key }) => {
      const value = candidate[key];
  
      return !value || !String(value).trim();
    }).map(({ key }) => key);
  }
  
  /** Lo que carga la persona en el diálogo. */
  export type StageMoveInput = {
    comment?: string;
    reason?: string;
    skipReason?: string;
    // Fecha del evento (presentación, entrevista, oferta, contratación)
    date?: string;
    startDate?: string;
    reviewAt?: string;
    personalInfo?: Partial<Pick<CandidateMini, PersonalInfoKey>>;
    // Entrevista técnica nueva (se guarda al confirmar) o ya existente (se reutiliza)
    newTechInterview?: TechInterview;
    reuseTechInterview?: TechInterview;
  };
  
  export type StageChangeResult = {
    updates: Partial<CandidateMini>;
    timeline: { title: string; description: string };
    // Comentario automático para la tarjeta (varias líneas)
    commentText: string;
    techInterviewToSave?: TechInterview;
  };
  
  function dateLabel(value?: string) {
    return value ? value.replace("T", " ") : "";
  }
  
  /** Arma todos los cambios de un movimiento de etapa (sin efectos secundarios). */
  export function buildStageChange({
    candidate,
    project,
    to,
    input,
    author,
  }: {
    candidate: CandidateMini;
    project: ProjectColumn;
    to: CandidateProcessStatus;
    input: StageMoveInput;
    author: string;
  }): StageChangeResult {
    const from = candidate.processStatus;
    const fromLabel = PROCESS_STATUS_INFO[from].label;
    const toLabel = PROCESS_STATUS_INFO[to].label;
    const kind = classifyMove(from, to);
    const today = todayIso();
    const comment = input.comment?.trim() ?? "";
  
    const updates: Partial<CandidateMini> = {
      processStatus: to,
      stageHistory: appendStageEntry(candidate, to, {
        ...(to === "client_interview"
          ? { clientName: project.clientName, scheduledFor: input.date || undefined }
          : {}),
      }),
      ...input.personalInfo,
    };
  
    const lines: string[] = [`Moved from ${fromLabel} to ${toLabel}.`];
  
    if (kind === "skip") {
      lines.push(`Skipped stages. Reason: ${input.skipReason?.trim() ?? ""}`);
    }
  
    if (kind === "backward") {
      lines.push(`Reason: ${comment}`);
    } else if (kind === "reopen") {
      lines.push(`Reopened. Reason: ${comment}`);
      updates.outcomeReason = undefined;
      updates.reviewAt = undefined;
    } else if (kind === "outcome") {
      lines.push(`Reason: ${input.reason ?? ""}`);
  
      if (comment) {
        lines.push(comment);
      }
  
      updates.outcomeReason = input.reason;
      updates.reviewAt = to === "stand_by" ? input.reviewAt || undefined : undefined;
  
      if (to === "stand_by" && input.reviewAt) {
        lines.push(`Review on: ${input.reviewAt}`);
      }
    } else {
      const gate = STAGE_GATES[to];
  
      if (comment) {
        lines.push(`${gate?.commentLabel?.replace(" (optional)", "") ?? "Note"}: ${comment}`);
      }
  
      if (input.date && gate?.dateLabel) {
        lines.push(`${gate.dateLabel}: ${dateLabel(input.date)}`);
      }
    }
  
    let techInterviewToSave: TechInterview | undefined;
    const techSource = input.newTechInterview ?? input.reuseTechInterview;
  
    if (techSource) {
      updates.seniority = techSource.seniority;
      updates.seniorityValidated = true;
      updates.techInterviewDoneAt = techSource.date;
  
      if (input.newTechInterview) {
        techInterviewToSave = input.newTechInterview;
        lines.push(
          `Tech interview recorded (${techSource.date}, ${techSource.seniority}).`
        );
      } else {
        lines.push(
          `Reused tech interview from ${techSource.date} (${techSource.seniority}).`
        );
      }
    }
  
    if (to === "hired") {
      updates.hiredAt = input.date || today;
      updates.startDate = input.startDate || undefined;
      updates.talentType = "trick_internal";
  
      if (input.startDate) {
        lines.push(`Start date: ${input.startDate}`);
      }
  
      lines.push("Now internal talent; removed from the position list and kept in the Candidates database.");
    }
  
    const commentText = lines.join("\n");
  
    updates.timeline = [
      ...(candidate.timeline ?? []),
      {
        id: `timeline-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
        title: to === "hired" ? "Hired" : "Status changed",
        description: lines.slice(0, 3).join(" "),
        date: today,
        author,
      },
    ];
  
    return {
      updates,
      timeline: {
        title: to === "hired" ? "Hired" : "Status changed",
        description: lines.slice(0, 3).join(" "),
      },
      commentText,
      techInterviewToSave,
    };
  }
  
  export type HireMetrics = {
    // Desde que se abrió la posición hasta que la persona aceptó
    timeToHire: number | null;
    // Desde la contratación hasta que empieza (no depende de Trick ni del cliente)
    notice: number | null;
    // Desde que se abrió la posición hasta que empieza
    timeToStart: number | null;
  };
  
  export function getHireMetrics(
    candidate: CandidateMini,
    position?: PositionCard
  ): HireMetrics {
    const origin = position?.openedAt || candidate.processStartedAt;
  
    if (!origin || !candidate.hiredAt) {
      return { timeToHire: null, notice: null, timeToStart: null };
    }
  
    const timeToHire = daysBetween(origin, candidate.hiredAt);
    const notice = candidate.startDate ? daysBetween(candidate.hiredAt, candidate.startDate) : null;
    const timeToStart = candidate.startDate ? daysBetween(origin, candidate.startDate) : null;
  
    return { timeToHire, notice, timeToStart };
  }
  