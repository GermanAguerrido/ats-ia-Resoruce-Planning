"use client";

import { useEffect, useState } from "react";
import type { CandidateMini, PositionCard } from "@/app/data/resourcePlanningMock";
import { englishRank } from "./englishLevels";
import { bandIndex, roleKey, seniorityBand, SENIORITY_BANDS } from "./roles";
import { lookupBudget, parseMoney, type BudgetConfig } from "./candidateBudget";

// Match entre la descripción (JD) de una posición abierta y la base de candidatos.
// Hoy es un cálculo local (palabras clave de la JD contra el rol y las notas de RRHH).
// Con el backend, esta misma función se reemplaza por una llamada a la IA con el mismo resultado.

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "you", "our", "are", "will", "have", "has", "this", "that",
  "from", "your", "who", "not", "but", "can", "all", "any", "per", "more", "must", "need",
  "english", "experience", "years", "year", "work", "team", "game", "games", "level",
  "para", "con", "los", "las", "una", "uno", "que", "del", "por", "como", "mas", "más",
]);

export function jdStorageKey(positionId: string) {
  return `rp-jd:position:${positionId}`;
}

export function usePositionJd(positionId: string) {
  const [jd, setJdState] = useState("");

  useEffect(() => {
    try {
      setJdState(window.localStorage.getItem(jdStorageKey(positionId)) ?? "");
    } catch {
      setJdState("");
    }
  }, [positionId]);

  const setJd = (next: string) => {
    setJdState(next);

    try {
      window.localStorage.setItem(jdStorageKey(positionId), next);
    } catch {
      // Local storage can fail in private browsing or quota situations.
    }
  };

  return [jd, setJd] as const;
}

/**
 * Palabras clave de la JD. Si hay una línea "Must: Unity, C#, multiplayer" (o Skills / Requirements / Stack)
 * se usa esa lista; si no, las palabras más repetidas.
 */
export function extractKeywords(jd: string, fallbackTitle: string): string[] {
  const listed = jd.match(/^\s*(?:must(?: have)?|requirements?|skills?|stack|required)\s*[:\-]\s*(.+)$/im);

  if (listed) {
    const items = listed[1]
      .split(/[,;/]|\band\b/i)
      .map((item) => item.trim().replace(/\.$/, ""))
      .filter((item) => item.length > 1);

    if (items.length > 0) {
      return Array.from(new Set(items.map((item) => item.toLowerCase())));
    }
  }

  const counts = new Map<string, number>();

  `${jd} ${fallbackTitle}`
    .toLowerCase()
    .split(/[^a-z0-9+#áéíóúñ]+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
    .forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
}

export type MatchScore = {
  candidate: CandidateMini;
  total: number;
  haveSkills: string[];
  missingSkills: string[];
  seniorityOk: boolean;
  englishOk: boolean;
  englishKnown: boolean;
  salaryDiff: number | null;
  salaryLevel: "ok" | "negotiable" | "over" | "unknown";
};

export function scoreCandidate(args: {
  candidate: CandidateMini;
  notes: string;
  keywords: string[];
  position: PositionCard;
  clientName: string;
  config: BudgetConfig;
}): MatchScore {
  const { candidate, notes, keywords, position, clientName, config } = args;
  const corpus = `${candidate.role} ${notes} ${(candidate.previousCompanies ?? []).join(" ")}`.toLowerCase();
  const haveSkills = keywords.filter((word) => corpus.includes(word));
  const missingSkills = keywords.filter((word) => !corpus.includes(word));
  const skillRatio = keywords.length > 0 ? haveSkills.length / keywords.length : 0.5;

  const required = SENIORITY_BANDS.indexOf(seniorityBand(position.seniority) ?? "Junior");
  const own = bandIndex(candidate.seniority);
  const seniorityScore = own < 0 ? 0.5 : own >= required ? 1 : own === required - 1 ? 0.5 : 0.1;

  const band = seniorityBand(position.seniority);
  const requiredEnglish = band ? config.englishMin[band] : undefined;
  const ownEnglish = englishRank(candidate.englishLevel);
  const neededEnglish = requiredEnglish ? englishRank(requiredEnglish) : -1;
  const englishKnown = ownEnglish >= 0 && neededEnglish >= 0;
  const englishScore = !englishKnown
    ? 0.5
    : ownEnglish >= neededEnglish
      ? 1
      : ownEnglish === neededEnglish - 1
        ? 0.5
        : 0.1;

  const budget = lookupBudget(config, position.title, band, clientName);
  const expected = parseMoney(candidate.salaryExpected);
  const salaryDiff = budget !== null && expected !== null ? expected - budget : null;
  const salaryLevel =
    salaryDiff === null
      ? "unknown"
      : salaryDiff <= 0
        ? "ok"
        : salaryDiff <= config.margin
          ? "negotiable"
          : "over";
  const salaryScore = salaryLevel === "ok" ? 1 : salaryLevel === "negotiable" ? 0.6 : salaryLevel === "over" ? 0.1 : 0.5;

  return {
    candidate,
    total: Math.round((skillRatio * 0.45 + seniorityScore * 0.2 + englishScore * 0.15 + salaryScore * 0.2) * 100),
    haveSkills,
    missingSkills,
    seniorityOk: own < 0 ? true : own >= required,
    englishOk: !englishKnown || ownEnglish >= neededEnglish,
    englishKnown,
    salaryDiff,
    salaryLevel,
  };
}

/** Mismo rol (o con al menos la mitad de las palabras de la JD) para no comparar con toda la base. */
export function isRelevantForPosition(candidate: CandidateMini, position: PositionCard, score: MatchScore) {
  return roleKey(candidate.role) === roleKey(position.title) || score.haveSkills.length >= Math.ceil(Math.max(1, score.haveSkills.length + score.missingSkills.length) / 2);
}
