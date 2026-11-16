"use client";

import { useEffect, useState } from "react";

import type { CandidateMini, PositionCard, ProjectColumn } from "@/app/data/resourcePlanningMock";
import { readStoredBoard } from "./boardStorage";
import { closeNotificationsByRef, pushNotification, readNotifications } from "./notifications";
import { readUsers, type AppUser } from "./userDirectory";

/**
 * Onboarding process (sección F). Reemplaza la ficha de Zoho People: la recruiter completa la ficha
 * cuando alguien pasa a Hired y después cada rol completa su paso: IT → HR → PM / Lead.
 * Por ahora vive en el navegador; con el backend es una tabla compartida con el módulo interno
 * (la persona contratada es la misma fila) y los avisos salen por mail.
 */
export type EntryType = "Project" | "Bench" | "Bench / Project";
export const ENTRY_TYPES: EntryType[] = ["Project", "Bench", "Bench / Project"];

export type OnboardingStep = "it" | "hr" | "pm";
export type OnboardingStatus = OnboardingStep | "complete";

export type OnboardingFile = {
  // Entrada
  entry: EntryType;
  ref: string; // PM / Lead a quien se presenta (usuario con rol pm)
  projectEntryDate: string;
  // Puesto
  firstName: string;
  lastName: string;
  email: string; // mail corporativo sugerido; IT lo confirma
  designation: string;
  department: string;
  location: string;
  source: string;
  salary: string;
  salaryText: string;
  english: string;
  seniority: string;
  zohoRole: "Team Member" | "Manager";
  joining: string;
  employment: string;
  // Personales
  birth: string;
  gender: string;
  marital: string;
  citizenship: string;
  dni: string;
  personalEmail: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  mobile: string;
  linkedin: string;
  portfolio: string;
};

export type OnboardingRecord = {
  candidateId: string;
  projectId: string;
  positionId: string;
  projectName: string; // "Bench" si no tiene proyecto
  recruiter: string;
  status: OnboardingStatus;
  file: OnboardingFile;
  sentAt: string;
  corporateEmail?: string;
  itDoneAt?: string;
  itDoneBy?: string;
  employeeId?: string;
  vacations?: string;
  interviewDate?: string;
  hrDoneAt?: string;
  hrDoneBy?: string;
  pmDoneAt?: string;
  pmDoneBy?: string;
};

type Store = { since: string; records: Record<string, OnboardingRecord> };

export const ONBOARDING_KEY = "ats-ia:resource-planning:onboarding";
const ONBOARDING_EVENT = "rp-onboarding";

export const STEP_LABELS: Record<OnboardingStep, string> = { it: "IT", hr: "HR", pm: "PM / Lead" };

export const STEP_HINTS: Record<OnboardingStep, string> = {
  it: "Creates the corporate email",
  hr: "Completes the HR fields and the onboarding interview",
  pm: "Prepares the team for the entry date",
};

export const STATUS_LABELS: Record<OnboardingStatus | "no_file", string> = {
  no_file: "File pending",
  it: "Waiting IT",
  hr: "Waiting HR",
  pm: "Waiting PM / Lead",
  complete: "Complete",
};

const STEP_ORDER: OnboardingStatus[] = ["it", "hr", "pm", "complete"];

export function stepIndex(status: OnboardingStatus) {
  return STEP_ORDER.indexOf(status);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- Almacenamiento ----------
function emptyStore(): Store {
  return { since: today(), records: {} };
}

export function readOnboarding(): Store {
  if (typeof window === "undefined") {
    return { since: "9999-12-31", records: {} };
  }

  try {
    const raw = window.localStorage.getItem(ONBOARDING_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Store>) : null;

    if (parsed && typeof parsed.since === "string" && parsed.records && typeof parsed.records === "object") {
      return { since: parsed.since, records: parsed.records };
    }
  } catch {
    // ignore
  }

  // Primera vez: desde hoy cuentan las contrataciones nuevas; las que ya venían como Hired no piden ficha
  const fresh = emptyStore();

  writeOnboarding(fresh, false);

  return fresh;
}

function writeOnboarding(store: Store, notify = true) {
  try {
    window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(store));
  } catch {
    // Local storage can fail in private browsing or quota situations.
  }

  if (notify) {
    window.dispatchEvent(new Event(ONBOARDING_EVENT));
  }
}

export function updateOnboarding(change: (store: Store) => Store) {
  writeOnboarding(change(readOnboarding()));
}

export function useOnboarding() {
  const [store, setStore] = useState<Store>({ since: "9999-12-31", records: {} });

  useEffect(() => {
    const sync = () => setStore(readOnboarding());

    sync();
    window.addEventListener(ONBOARDING_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(ONBOARDING_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return store;
}

// ---------- Contrataciones ----------
export type PendingHire = { candidate: CandidateMini; position: PositionCard; project: ProjectColumn };

/** Contrataciones nuevas (después de que arrancó el ATS) que todavía no tienen ficha enviada. */
export function listPendingHires(projects: ProjectColumn[], store: Store): PendingHire[] {
  const found = new Map<string, PendingHire>();

  projects.forEach((project) =>
    project.positions.forEach((position) =>
      position.candidates.forEach((candidate) => {
        if (
          candidate.processStatus === "hired" &&
          candidate.hiredAt &&
          candidate.hiredAt.slice(0, 10) >= store.since &&
          !store.records[candidate.id] &&
          !found.has(candidate.id)
        ) {
          found.set(candidate.id, { candidate, position, project });
        }
      })
    )
  );

  return Array.from(found.values());
}

// ---------- Datos de la ficha ----------
/** dd-MMM-yyyy en inglés (01-JAN-2024), como pide el template. */
export function formatTemplateDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return `${String(date.getDate()).padStart(2, "0")}-${date
    .toLocaleString("en-GB", { month: "short" })
    .toUpperCase()}-${date.getFullYear()}`;
}

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven",
  "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function below1000(value: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;

  if (hundreds) {
    parts.push(`${ONES[hundreds]} hundred`);
  }

  if (rest) {
    parts.push(rest < 20 ? ONES[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? `-${ONES[rest % 10]}` : ""}`);
  }

  return parts.join(" ");
}

/** Salario en letras, en inglés ("Salary Text" del template). */
export function salaryInWords(value: string) {
  const number = Math.floor(Number(value));

  if (!Number.isFinite(number) || number < 0 || number > 999999) {
    return "";
  }

  if (number === 0) {
    return "zero US dollars";
  }

  const thousands = Math.floor(number / 1000);
  const rest = number % 1000;
  const words = [thousands ? `${below1000(thousands)} thousand` : "", rest ? below1000(rest) : ""]
    .filter(Boolean)
    .join(" ");

  return `${words} US dollars`;
}

export function suggestCorporateEmail(firstName: string, lastName: string, domain: string) {
  const clean = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "");

  const first = clean(firstName);
  const last = clean(lastName);

  return first && last ? `${first}.${last}@${domain}` : "";
}

// ---------- Avisos ----------
function activeUsers(role: AppUser["role"][]) {
  return readUsers().filter((user) => role.includes(user.role) && user.status !== "disabled");
}

export function onboardingRef(step: OnboardingStep | "file", candidateId: string) {
  return `onboarding:${step}:${candidateId}`;
}

function notifyUsers(
  users: string[],
  from: string,
  text: string,
  record: { candidateId: string; candidateName: string },
  options: { ref?: string; pending: boolean }
) {
  Array.from(new Set(users))
    .filter((name) => name && name !== from)
    .forEach((name) =>
      pushNotification({
        to: name,
        from,
        kind: "info",
        state: options.pending ? "pending" : "info",
        text,
        candidateId: record.candidateId,
        candidateName: record.candidateName,
        ref: options.ref,
        href: `/onboarding?open=${encodeURIComponent(record.candidateId)}`,
      })
    );
}

function nameOf(file: OnboardingFile) {
  return `${file.firstName} ${file.lastName}`.trim();
}

/** La recruiter envía la ficha: avisa a IT (pendiente) y a Talent / Owner (informativo). */
export function sendOnboardingFile(
  candidate: CandidateMini,
  position: PositionCard,
  project: ProjectColumn,
  file: OnboardingFile,
  sentBy: string
) {
  const record: OnboardingRecord = {
    candidateId: candidate.id,
    projectId: project.id,
    positionId: position.id,
    projectName: file.entry === "Bench" ? "Bench" : project.projectName,
    recruiter: candidate.recruiterOwner ?? sentBy,
    status: "it",
    file,
    sentAt: new Date().toISOString(),
  };
  const info = { candidateId: candidate.id, candidateName: nameOf(file) };

  updateOnboarding((store) => ({ ...store, records: { ...store.records, [candidate.id]: record } }));
  closeNotificationsByRef(onboardingRef("file", candidate.id));
  notifyUsers(
    activeUsers(["it"]).map((user) => user.name),
    sentBy,
    `Create the corporate email for ${nameOf(file)} (${file.designation}).`,
    info,
    { ref: onboardingRef("it", candidate.id), pending: true }
  );
  notifyUsers(
    activeUsers(["talent", "admin"]).map((user) => user.name),
    sentBy,
    `${nameOf(file)} joins ${record.projectName} on ${formatTemplateDate(file.joining)} as ${file.designation}. Onboarding started.`,
    info,
    { pending: false }
  );

  return record;
}

/** Edición de la ficha ya enviada (la recruiter dueña, Talent u Owner). */
export function editOnboardingFile(candidateId: string, file: OnboardingFile, projectName: string) {
  updateOnboarding((store) => {
    const current = store.records[candidateId];

    return current
      ? { ...store, records: { ...store.records, [candidateId]: { ...current, file, projectName } } }
      : store;
  });
}

export type StepInput = { corporateEmail?: string; employeeId?: string; vacations?: string; interviewDate?: string };

/** Completa un paso y avisa al siguiente. */
export function completeStep(record: OnboardingRecord, step: OnboardingStep, input: StepInput, by: string) {
  const at = new Date().toISOString();
  const info = { candidateId: record.candidateId, candidateName: nameOf(record.file) };
  let next: OnboardingRecord = record;

  if (step === "it") {
    next = { ...record, status: "hr", corporateEmail: input.corporateEmail, itDoneAt: at, itDoneBy: by };
    notifyUsers(
      activeUsers(["hr"]).map((user) => user.name),
      by,
      `Complete the HR file for ${nameOf(record.file)} (corporate email ${input.corporateEmail}).`,
      info,
      { ref: onboardingRef("hr", record.candidateId), pending: true }
    );
  } else if (step === "hr") {
    next = {
      ...record,
      status: "pm",
      employeeId: input.employeeId,
      vacations: input.vacations,
      interviewDate: input.interviewDate,
      hrDoneAt: at,
      hrDoneBy: by,
    };
    notifyUsers(
      record.file.ref ? [record.file.ref] : [],
      by,
      `${nameOf(record.file)} joins ${record.projectName} on ${formatTemplateDate(record.file.joining)} as ${record.file.designation}. Confirm the team is ready.`,
      info,
      { ref: onboardingRef("pm", record.candidateId), pending: true }
    );
  } else {
    next = { ...record, status: "complete", pmDoneAt: at, pmDoneBy: by };
    notifyUsers(
      [record.recruiter, ...activeUsers(["talent", "admin"]).map((user) => user.name)],
      by,
      `Onboarding complete: ${nameOf(record.file)} is internal (${record.corporateEmail ?? record.file.email}).`,
      info,
      { pending: false }
    );
  }

  closeNotificationsByRef(onboardingRef(step, record.candidateId));
  updateOnboarding((store) => ({ ...store, records: { ...store.records, [record.candidateId]: next } }));

  return next;
}

/** Recordatorio a la recruiter cuando alguien pasa a Hired y todavía no hay ficha (una sola vez). */
export function remindPendingFiles() {
  const stored = readStoredBoard();

  if (!stored) {
    return;
  }

  const store = readOnboarding();
  const projects = stored.projects.filter((project) => !stored.archivedIds.includes(project.id));
  const existing = new Set(readNotifications().map((item) => item.ref));

  listPendingHires(projects, store).forEach(({ candidate }) => {
    const ref = onboardingRef("file", candidate.id);

    if (!candidate.recruiterOwner || existing.has(ref)) {
      return;
    }

    pushNotification({
      to: candidate.recruiterOwner,
      from: "ATS",
      kind: "info",
      state: "pending",
      text: `${candidate.name} was hired. Complete the onboarding file so IT, HR and the PM can start.`,
      candidateId: candidate.id,
      candidateName: candidate.name,
      ref,
      href: `/onboarding?open=${encodeURIComponent(candidate.id)}`,
    });
  });
}

/** Se monta una vez en el menú: revisa cada vez que cambia el tablero. */
export function useOnboardingReminders() {
  useEffect(() => {
    remindPendingFiles();

    window.addEventListener("rp-board", remindPendingFiles);
    window.addEventListener("storage", remindPendingFiles);

    return () => {
      window.removeEventListener("rp-board", remindPendingFiles);
      window.removeEventListener("storage", remindPendingFiles);
    };
  }, []);
}
