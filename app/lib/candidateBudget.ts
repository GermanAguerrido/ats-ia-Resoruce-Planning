"use client";

import { useEffect, useState } from "react";
import type { CandidateMini, PositionCard } from "@/app/data/resourcePlanningMock";
import { englishRank } from "./englishLevels";
import { bandIndex, roleKey, seniorityBand, SENIORITY_BANDS, type SeniorityBand } from "./roles";

// Presupuesto mensual (USD) por rol y banda de seniority. Hay uno general y se puede
// sobreescribir por cliente. También guarda el inglés mínimo que se espera por banda.
export type BudgetMatrix = Record<string, Partial<Record<SeniorityBand, number>>>;

export type BudgetConfig = {
  // Margen negociable: lo que puede pasarse la pretensión del presupuesto sin ser un problema
  margin: number;
  general: BudgetMatrix;
  clients: Record<string, BudgetMatrix>;
  englishMin: Record<SeniorityBand, string>;
};

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  margin: 1000,
  general: {
    "Unity Engineer": { Junior: 1800, "Semi Senior": 2600, Senior: 4500, Lead: 6000 },
    "Gameplay Engineer": { Junior: 1700, "Semi Senior": 2500, Senior: 4200, Lead: 5600 },
    "Console Engineer": { Junior: 2000, "Semi Senior": 3000, Senior: 5000, Lead: 6500 },
    "C++ Engineer": { Junior: 2000, "Semi Senior": 3000, Senior: 4800, Lead: 6200 },
    "Tech Artist": { Junior: 1500, "Semi Senior": 2400, Senior: 3600, Lead: 4800 },
    "UI Artist": { Junior: 1400, "Semi Senior": 2200, Senior: 3600, Lead: 4800 },
    "QA Tester": { Junior: 1000, "Semi Senior": 1600, Senior: 2400, Lead: 3200 },
  },
  clients: {},
  englishMin: {
    Junior: "Intermediate",
    "Semi Senior": "Intermediate",
    Senior: "Intermediate / Advanced",
    Lead: "Advanced",
  },
};

const BUDGET_KEY = "ats-ia:resource-planning:budgets";
const BUDGET_EVENT = "rp-budgets";

function readBudgetConfig(): BudgetConfig {
  if (typeof window === "undefined") {
    return DEFAULT_BUDGET_CONFIG;
  }

  try {
    const raw = window.localStorage.getItem(BUDGET_KEY);

    if (!raw) {
      return DEFAULT_BUDGET_CONFIG;
    }

    const parsed = JSON.parse(raw) as Partial<BudgetConfig>;

    return {
      margin: typeof parsed.margin === "number" ? parsed.margin : DEFAULT_BUDGET_CONFIG.margin,
      general: parsed.general ?? DEFAULT_BUDGET_CONFIG.general,
      clients: parsed.clients ?? {},
      englishMin: { ...DEFAULT_BUDGET_CONFIG.englishMin, ...(parsed.englishMin ?? {}) },
    };
  } catch {
    return DEFAULT_BUDGET_CONFIG;
  }
}

/** Presupuesto compartido por todas las pantallas y pestañas (se sincroniza solo). */
export function useBudgetConfig() {
  const [config, setConfigState] = useState<BudgetConfig>(DEFAULT_BUDGET_CONFIG);

  useEffect(() => {
    const sync = () => setConfigState(readBudgetConfig());

    sync();
    window.addEventListener(BUDGET_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(BUDGET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setConfig = (next: BudgetConfig) => {
    setConfigState(next);

    try {
      window.localStorage.setItem(BUDGET_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(BUDGET_EVENT));
    } catch {
      // Local storage can fail in private browsing or quota situations.
    }
  };

  return { config, setConfig };
}

/** "USD 4.500" → 4500. También entiende "4,5k" y "4500". */
export function parseMoney(value?: string): number | null {
  if (!value) {
    return null;
  }

  const match = value.replace(/\s/g, "").match(/(\d[\d.,]*)(k)?/i);

  if (!match) {
    return null;
  }

  if (match[2]) {
    const thousands = parseFloat(match[1].replace(",", "."));

    return Number.isNaN(thousands) ? null : Math.round(thousands * 1000);
  }

  const amount = parseInt(match[1].replace(/[.,]/g, ""), 10);

  return Number.isNaN(amount) ? null : amount;
}

export function formatMoney(amount: number | null | undefined) {
  return amount === null || amount === undefined ? "—" : `$${amount.toLocaleString("en-US")}`;
}

function findInMatrix(matrix: BudgetMatrix | undefined, role: string, band: SeniorityBand) {
  if (!matrix) {
    return undefined;
  }

  const key = roleKey(role);
  const entry = Object.keys(matrix).find((name) => roleKey(name) === key);

  return entry ? matrix[entry][band] : undefined;
}

/** Presupuesto del cliente si lo tiene cargado; si no, el general. */
export function lookupBudget(
  config: BudgetConfig,
  role: string,
  band: SeniorityBand | null,
  clientName?: string
): number | null {
  if (!band) {
    return null;
  }

  const fromClient = clientName
    ? findInMatrix(config.clients[clientName], role, band)
    : undefined;

  return fromClient ?? findInMatrix(config.general, role, band) ?? null;
}

export type SalaryLevel = "ok" | "negotiable" | "over" | "unknown";

export type CandidateFit = {
  salary: {
    amount: number | null;
    budget: number | null;
    diff: number | null;
    level: SalaryLevel;
  };
  belowSeniority: boolean;
  belowEnglish: boolean;
  requiredSeniority?: string;
  requiredEnglish?: string;
};

/**
 * Compara a la persona con lo que pide la posición:
 * - Pretensión: verde dentro del presupuesto, ámbar hasta el margen negociable, rojo por encima.
 * - Seniority o inglés por debajo de lo pedido: se marca en rojo (igual se puede hacer una excepción).
 * Sin posición se usa el rol y el seniority de la propia persona.
 */
export function evaluateFit(
  candidate: CandidateMini,
  config: BudgetConfig,
  context?: { position?: PositionCard; clientName?: string }
): CandidateFit {
  const position = context?.position;
  const requiredSeniority = position?.seniority ?? candidate.seniority;
  const band = seniorityBand(requiredSeniority);
  const budgetRole = position?.title ?? candidate.role;
  const budget = lookupBudget(config, budgetRole, band, context?.clientName);
  const amount = parseMoney(candidate.salaryExpected);
  const diff = amount !== null && budget !== null ? amount - budget : null;

  let level: SalaryLevel = "unknown";

  if (diff !== null) {
    level = diff <= 0 ? "ok" : diff <= config.margin ? "negotiable" : "over";
  }

  const requiredEnglish = band ? config.englishMin[band] : undefined;
  const candidateBand = bandIndex(candidate.seniority);
  const requiredBand = band ? SENIORITY_BANDS.indexOf(band) : -1;
  const candidateEnglish = englishRank(candidate.englishLevel);

  return {
    salary: { amount, budget, diff, level },
    belowSeniority: position
      ? candidateBand >= 0 && requiredBand >= 0 && candidateBand < requiredBand
      : false,
    belowEnglish:
      requiredEnglish !== undefined &&
      candidateEnglish >= 0 &&
      candidateEnglish < englishRank(requiredEnglish),
    requiredSeniority,
    requiredEnglish,
  };
}
