import { SENIORITY_LEVELS, seniorityRank } from "./candidateStatus";

/**
 * Clave para comparar roles escritos distinto ("Tech Artist" = "Technical Artist",
 * "Game Console Engineer" = "Console Engineer").
 */
export function roleKey(value?: string): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/\btechnical\b/g, "tech")
    .replace(/\bgame\b/g, " ")
    .replace(/\bdeveloper\b/g, "engineer")
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim();
}

// Los presupuestos y las métricas agrupan los 8 niveles de seniority en 4 bandas.
export const SENIORITY_BANDS = ["Junior", "Semi Senior", "Senior", "Lead"] as const;
export type SeniorityBand = (typeof SENIORITY_BANDS)[number];

/** Banda de un seniority (Trainee y Junior Plus cuentan como Junior; Senior Plus como Senior). */
export function seniorityBand(value?: string): SeniorityBand | null {
  const rank = seniorityRank(value);

  if (rank < 0) {
    return null;
  }

  const level = SENIORITY_LEVELS[rank];

  if (level === "Lead") return "Lead";
  if (level.startsWith("Senior")) return "Senior";
  if (level.startsWith("Semi Senior")) return "Semi Senior";

  return "Junior";
}

export function bandIndex(value?: string): number {
  const band = seniorityBand(value);

  return band ? SENIORITY_BANDS.indexOf(band) : -1;
}
