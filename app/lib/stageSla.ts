"use client";

import { useEffect, useState } from "react";

import type { CandidateProcessStatus } from "@/app/data/resourcePlanningMock";

/**
 * Tiempos esperados por etapa (documento "Proceso Recruiting End-to-End").
 * Una sola tabla alimenta: las alertas de "estancado en etapa", los colores del pipeline,
 * los chips de días de la ficha y las métricas del Dashboard.
 *
 * Semáforo: verde = dentro del máximo, ámbar = hasta el doble del máximo, rojo = más del doble.
 */
export type SlaStageKey =
  | "contacted"
  | "screening"
  | "tech_interview"
  | "presented"
  | "client_interview"
  | "to_offer"
  | "offer"
  | "hired";

export type SlaRange = { min: number; max: number };
export type SlaConfig = Record<SlaStageKey, SlaRange> & { requisition: SlaRange };
export type SlaLevel = "ok" | "warn" | "bad";

export type SlaStageInfo = {
  key: SlaStageKey;
  label: string;
  // Paso del documento del proceso
  step: string;
  responsible: string;
  // De quién depende la demora
  waitsOn: string;
  // true = depende de alguien que no es la recruiter (cliente, Tech Lead, candidato)
  external: boolean;
};

export const SLA_STAGES: SlaStageInfo[] = [
  {
    key: "contacted",
    label: "Contacted",
    step: "Sourcing and coordination",
    responsible: "Recruiter",
    waitsOn: "Candidate reply",
    external: true,
  },
  {
    key: "screening",
    label: "Interviewed",
    step: "Recruiter interview",
    responsible: "Recruiter",
    waitsOn: "Recruiter",
    external: false,
  },
  {
    key: "tech_interview",
    label: "Tech Interview",
    step: "Internal technical evaluation",
    responsible: "Recruiter / Tech Lead",
    waitsOn: "Tech Lead",
    external: true,
  },
  {
    key: "presented",
    label: "Presented",
    step: "Final screening + client pre-selection",
    responsible: "Recruiter Manager",
    waitsOn: "Client",
    external: true,
  },
  {
    key: "client_interview",
    label: "Client Tech Interview",
    step: "Client technical evaluation + notes",
    responsible: "Client",
    waitsOn: "Client",
    external: true,
  },
  {
    key: "to_offer",
    label: "To offer",
    step: "Hiring manager / validation",
    responsible: "Recruiter Manager",
    waitsOn: "Recruiter",
    external: false,
  },
  {
    key: "offer",
    label: "Offered",
    step: "Offer coordination and negotiation",
    responsible: "Recruiter",
    waitsOn: "Candidate reply",
    external: true,
  },
  {
    key: "hired",
    label: "Hired → Start",
    step: "Hiring, HR and onboarding (notice period)",
    responsible: "HR / IT / Candidate",
    waitsOn: "Candidate notice",
    external: true,
  },
];

export const DEFAULT_SLA: SlaConfig = {
  contacted: { min: 1, max: 5 },
  screening: { min: 1, max: 2 },
  tech_interview: { min: 1, max: 7 },
  presented: { min: 1, max: 3 },
  client_interview: { min: 1, max: 7 },
  to_offer: { min: 1, max: 2 },
  offer: { min: 1, max: 3 },
  hired: { min: 1, max: 15 },
  // Paso 1 (Requisition): se mide en la posición, desde que se abre hasta el primer candidato
  requisition: { min: 1, max: 2 },
};

export const SLA_STORAGE_KEY = "ats-ia:resource-planning:stage-sla";
const SLA_EVENT = "rp-stage-sla";

function sanitizeRange(value: unknown, fallback: SlaRange): SlaRange {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const raw = value as Partial<SlaRange>;
  const min = Number(raw.min);
  const max = Number(raw.max);

  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 1) {
    return fallback;
  }

  return { min: Math.min(min, max), max };
}

export function readStageSla(): SlaConfig {
  if (typeof window === "undefined") {
    return DEFAULT_SLA;
  }

  try {
    const raw = window.localStorage.getItem(SLA_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_SLA;
    }

    const parsed = JSON.parse(raw) as Partial<Record<keyof SlaConfig, unknown>>;
    const next = { ...DEFAULT_SLA };

    (Object.keys(DEFAULT_SLA) as Array<keyof SlaConfig>).forEach((key) => {
      next[key] = sanitizeRange(parsed[key], DEFAULT_SLA[key]);
    });

    return next;
  } catch {
    return DEFAULT_SLA;
  }
}

export function saveStageSla(config: SlaConfig) {
  try {
    window.localStorage.setItem(SLA_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Local storage can fail in private browsing or quota situations.
  }

  window.dispatchEvent(new Event(SLA_EVENT));
}

export function resetStageSla() {
  try {
    window.localStorage.removeItem(SLA_STORAGE_KEY);
  } catch {
    // ignore
  }

  window.dispatchEvent(new Event(SLA_EVENT));
}

/** Configuración de tiempos, sincronizada entre componentes y pestañas. */
export function useStageSla() {
  const [config, setConfig] = useState<SlaConfig>(DEFAULT_SLA);

  useEffect(() => {
    const sync = () => setConfig(readStageSla());

    sync();
    window.addEventListener(SLA_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(SLA_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return config;
}

/** "sourced" es un estado viejo: cuenta como Contacted. Los resultados (rejected…) no tienen tiempo. */
export function slaKeyOf(status: CandidateProcessStatus): SlaStageKey | null {
  if (status === "sourced") {
    return "contacted";
  }

  return SLA_STAGES.some((stage) => stage.key === status) ? (status as SlaStageKey) : null;
}

export function slaLevelFor(days: number, range: SlaRange): SlaLevel {
  if (days <= range.max) return "ok";
  if (days <= range.max * 2) return "warn";

  return "bad";
}

/** Rango esperado para una etapa (lee la configuración guardada). */
export function slaRangeOf(status: CandidateProcessStatus, config?: SlaConfig): SlaRange | null {
  const key = slaKeyOf(status);

  return key ? (config ?? readStageSla())[key] : null;
}

/** Semáforo de los días que lleva una persona en una etapa. null si la etapa no tiene tiempo. */
export function stageSlaLevel(
  status: CandidateProcessStatus,
  days: number,
  config?: SlaConfig
): SlaLevel | null {
  const range = slaRangeOf(status, config);

  return range ? slaLevelFor(days, range) : null;
}

export const SLA_COLORS: Record<SlaLevel, string> = {
  ok: "#10b981",
  warn: "#f59e0b",
  bad: "#ef4444",
};
