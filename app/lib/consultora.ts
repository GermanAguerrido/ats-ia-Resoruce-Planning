"use client";

import { useEffect, useState } from "react";

import type { CandidateMini, PositionCard, ProjectColumn } from "@/app/data/resourcePlanningMock";
import { daysSince, getCurrentStageEntry, getStageHistory, isHiredCandidate } from "./candidateStatus";
import type { DirectoryCandidate } from "./candidateDirectory";
import { findDuplicateCandidate } from "./duplicateCheck";
import { seniorityBand } from "./roles";

/**
 * Módulo Consultora (sección E): avance de cada perfil, reglas de atribución al cargar y
 * circuito de facturación. Por ahora todo vive en el navegador; con el backend sale de tablas.
 */

// ---------- Avance que ve la consultora ----------
export const CONSULTORA_STEPS = [
  "Loaded",
  "Contacted",
  "Interviewed",
  "Tech interview",
  "Client process",
  "Hired",
] as const;

export type ConsultoraStage = {
  index: number;
  label: string;
  // Fecha en que llegó a esta etapa
  date: string;
  state: "progress" | "hired" | "stopped" | "hold";
};

const STEP_OF: Record<string, number> = {
  sourced: 0,
  contacted: 1,
  screening: 2,
  tech_interview: 3,
  presented: 4,
  client_interview: 4,
  to_offer: 4,
  offer: 4,
  hired: 5,
};

/** Solo etapa y fecha: la consultora no ve notas, sueldos, motivos ni clientes. */
export function consultoraStage(candidate: CandidateMini): ConsultoraStage {
  const entry = getCurrentStageEntry(candidate);
  const date = (entry.enteredAt ?? "").slice(0, 10);

  if (isHiredCandidate(candidate)) {
    return {
      index: 5,
      label: "Hired",
      date: (candidate.hiredAt ?? candidate.startDate ?? date).slice(0, 10),
      state: "hired",
    };
  }

  if (candidate.processStatus === "rejected" || candidate.processStatus === "offer_rejected") {
    return { index: 0, label: "Not continuing", date, state: "stopped" };
  }

  if (candidate.processStatus === "stand_by") {
    const last = [...getStageHistory(candidate)]
      .reverse()
      .find((item) => item.status in STEP_OF);

    return { index: STEP_OF[last?.status ?? "sourced"] ?? 0, label: "On hold", date, state: "hold" };
  }

  const index = STEP_OF[candidate.processStatus] ?? 0;

  return { index, label: CONSULTORA_STEPS[index], date, state: "progress" };
}

// ---------- Reglas de atribución al cargar ----------
export const INACTIVITY_DAYS = 182;

export type LoadCheck =
  | { kind: "empty" }
  | { kind: "new" }
  | { kind: "own"; entry: DirectoryCandidate }
  // Ya lo tiene alguien: el primer contacto del equipo interno (o de otra consultora) prevalece
  | { kind: "blocked"; entry: DirectoryCandidate; recruiter?: string; lastActivityAt?: string }
  // Más de 6 meses sin contacto: puede actualizar y cuenta para la consultora
  | { kind: "update"; entry: DirectoryCandidate; recruiter?: string; lastActivityAt?: string };

/** Última fecha en que pasó algo con la persona (contacto, etapa, contratación). */
export function lastActivityOf(candidate: CandidateMini): string | undefined {
  const dates = [
    candidate.lastContactAt,
    candidate.processStartedAt,
    candidate.hiredAt,
    ...getStageHistory(candidate).map((item) => item.enteredAt),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.slice(0, 10))
    .sort();

  return dates[dates.length - 1];
}

export function checkConsultoraLoad(
  input: { email?: string; linkedin?: string },
  directory: DirectoryCandidate[],
  company: string
): LoadCheck {
  if (!input.email?.trim() && !input.linkedin?.trim()) {
    return { kind: "empty" };
  }

  const match = findDuplicateCandidate(input, directory);

  if (!match) {
    return { kind: "new" };
  }

  const candidate = match.entry.candidate;
  const lastActivityAt = lastActivityOf(candidate);
  const recruiter = candidate.recruiterOwner;

  if (candidate.consultora === company) {
    return { kind: "own", entry: match.entry };
  }

  const idleDays = daysSince(lastActivityAt);

  if (!candidate.consultora && !isHiredCandidate(candidate) && idleDays !== null && idleDays > INACTIVITY_DAYS) {
    return { kind: "update", entry: match.entry, recruiter, lastActivityAt };
  }

  return { kind: "blocked", entry: match.entry, recruiter, lastActivityAt };
}

// ---------- Posiciones visibles para la consultora ----------
export type ConsultoraPositionSetting = { desc?: string; hidden?: boolean };

const POSITIONS_KEY = "ats-ia:resource-planning:consultora-positions";
const POSITIONS_EVENT = "rp-consultora-positions";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);

    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, event: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage can fail in private browsing or quota situations.
  }

  window.dispatchEvent(new Event(event));
}

function useStored<T>(key: string, event: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const sync = () => setValue(readJson(key, fallback));

    sync();
    window.addEventListener(event, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(event, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, event]);

  return value;
}

const NO_POSITION_SETTINGS: Record<string, ConsultoraPositionSetting> = {};

export function useConsultoraPositionSettings() {
  return useStored(POSITIONS_KEY, POSITIONS_EVENT, NO_POSITION_SETTINGS);
}

export function saveConsultoraPositionSetting(positionId: string, change: ConsultoraPositionSetting) {
  const current = readJson<Record<string, ConsultoraPositionSetting>>(POSITIONS_KEY, {});

  writeJson(POSITIONS_KEY, POSITIONS_EVENT, {
    ...current,
    [positionId]: { ...current[positionId], ...change },
  });
}

export type OpenPosition = {
  position: PositionCard;
  project: ProjectColumn;
  setting: ConsultoraPositionSetting;
};

/** Posiciones abiertas (de proyectos no archivados). */
export function listOpenPositions(
  projects: ProjectColumn[],
  settings: Record<string, ConsultoraPositionSetting>
): OpenPosition[] {
  return projects.flatMap((project) =>
    project.positions
      .filter((position) => position.status === "open")
      .map((position) => ({ position, project, setting: settings[position.id] ?? {} }))
  );
}

// ---------- Facturación ----------
export type BillingRate = "standard" | "lead";
export type RequestStatus = "requested" | "approved" | "rejected" | "invoiced";

export type BillingItem = {
  candidateId: string;
  candidateName: string;
  role: string;
  seniority?: string;
  startDate: string;
  rate: BillingRate;
};

export type BillingRequest = {
  id: string;
  consultora: string;
  month: number; // 1-12
  year: number;
  items: BillingItem[];
  status: RequestStatus;
  requestedAt: string;
  requestedBy: string;
  decidedAt?: string;
  decidedBy?: string;
  rejectReason?: string;
  // Factura adjunta por la consultora (hoy se guarda nombre y tamaño; el archivo va con el backend)
  invoice?: { number: string; fileName: string; fileSize: number; attachedAt: string; attachedBy: string };
};

export type BillingState = {
  requests: BillingRequest[];
  // Personas que se fueron antes de los 3 meses (no se facturan)
  notBillable: Record<string, { at: string; by: string }>;
  // Valor por contratación (USD). Sin cargar, los totales no se calculan.
  fees: { standard?: number; lead?: number };
};

const BILLING_KEY = "ats-ia:resource-planning:consultora-billing";
const BILLING_EVENT = "rp-consultora-billing";
const EMPTY_BILLING: BillingState = { requests: [], notBillable: {}, fees: {} };

export function readBilling(): BillingState {
  const stored = readJson<Partial<BillingState>>(BILLING_KEY, {});

  return {
    requests: Array.isArray(stored.requests) ? stored.requests : [],
    notBillable: stored.notBillable ?? {},
    fees: stored.fees ?? {},
  };
}

export function updateBilling(change: (state: BillingState) => BillingState) {
  writeJson(BILLING_KEY, BILLING_EVENT, change(readBilling()));
}

export function useBilling() {
  return useStored<BillingState>(BILLING_KEY, BILLING_EVENT, EMPTY_BILLING);
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthLabel(month: number, year: number) {
  return `${MONTH_NAMES[month - 1] ?? "?"} ${year}`;
}

/** Suma meses a una fecha AAAA-MM-DD. */
export function addMonths(date: string, months: number) {
  const value = new Date(`${date.slice(0, 10)}T00:00:00`);

  value.setMonth(value.getMonth() + months);

  return value.toISOString().slice(0, 10);
}

export type Hire = { candidate: CandidateMini; position: PositionCard; project: ProjectColumn };

/** Contrataciones de una consultora (o de todas) con fecha de ingreso. */
export function listConsultoraHires(projects: ProjectColumn[], company?: string): Hire[] {
  return projects.flatMap((project) =>
    project.positions.flatMap((position) =>
      position.candidates
        .filter(
          (candidate) =>
            candidate.consultora &&
            (!company || candidate.consultora === company) &&
            isHiredCandidate(candidate) &&
            candidate.startDate
        )
        .map((candidate) => ({ candidate, position, project }))
    )
  );
}

export type HireBillingState =
  | { kind: "not_billable" }
  | { kind: "in_request"; request: BillingRequest }
  | { kind: "eligible"; dueOn: string }
  | { kind: "guarantee"; dueOn: string; daysLeft: number };

/** Tarifa por defecto: LEAD si lo contrataron como Lead, Standard en el resto. */
export function defaultRate(hire: Hire): BillingRate {
  return seniorityBand(hire.candidate.seniority ?? hire.position.seniority) === "Lead" ? "lead" : "standard";
}

export function hireBillingState(hire: Hire, billing: BillingState): HireBillingState {
  const id = hire.candidate.id;

  if (billing.notBillable[id]) {
    return { kind: "not_billable" };
  }

  const request = billing.requests.find(
    (item) => item.status !== "rejected" && item.items.some((entry) => entry.candidateId === id)
  );

  if (request) {
    return { kind: "in_request", request };
  }

  const dueOn = addMonths(hire.candidate.startDate as string, 3);
  // Días desde la fecha de vencimiento (negativo = todavía falta; daysSince no devuelve negativos)
  const days = Math.floor((Date.now() - new Date(`${dueOn}T00:00:00`).getTime()) / 86400000);

  return days >= 0 ? { kind: "eligible", dueOn } : { kind: "guarantee", dueOn, daysLeft: -days };
}

export function requestTotal(request: BillingRequest, fees: BillingState["fees"]): number | null {
  if (request.items.some((item) => fees[item.rate] === undefined)) {
    return null;
  }

  return request.items.reduce((total, item) => total + (fees[item.rate] ?? 0), 0);
}

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  requested: "Waiting approval",
  approved: "Approved · attach invoice",
  rejected: "Rejected",
  invoiced: "Invoiced",
};
