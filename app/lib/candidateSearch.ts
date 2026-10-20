import type { CandidateMini } from "@/app/data/resourcePlanningMock";
import { richHtmlToPlainText } from "./richText";

/** Texto de las notas de RRHH de una persona (las del editor de la ficha o, si no hay, las del dato inicial). */
export function readNotesText(candidate: CandidateMini): string {
  let stored: string | null = null;

  if (typeof window !== "undefined") {
    try {
      stored = window.localStorage.getItem(`rp-notes:candidate:${candidate.id}`);
    } catch {
      stored = null;
    }
  }

  const text = stored !== null ? richHtmlToPlainText(stored) : (candidate.notes ?? "");

  return text.replace(/\s+/g, " ").trim();
}

export function buildNotesIndex(candidates: CandidateMini[]): Map<string, string> {
  const index = new Map<string, string>();

  candidates.forEach((candidate) => index.set(candidate.id, readNotesText(candidate)));

  return index;
}

/** Fragmento de la nota alrededor de la palabra buscada (para mostrarlo resaltado en la lista). */
export function notesSnippet(text: string, term: string, radius = 48): string | null {
  const clean = term.trim().toLowerCase();

  if (!clean) {
    return null;
  }

  const at = text.toLowerCase().indexOf(clean);

  if (at < 0) {
    return null;
  }

  const start = Math.max(0, at - radius);
  const end = Math.min(text.length, at + clean.length + radius);

  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}
