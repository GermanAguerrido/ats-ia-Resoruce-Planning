import type { DirectoryCandidate } from "./candidateDirectory";

/**
 * Detección de candidatos duplicados. Un candidato se considera el mismo si coincide su
 * LinkedIn (normalizado) o su mail (normalizado). El nombre solo no alcanza: hay homónimos.
 */

/** "https://www.linkedin.com/in/Juan-Perez/?utm=1" → "in/juan-perez". Sin LinkedIn válido: null. */
export function normalizeLinkedin(value?: string): string | null {
  const raw = (value ?? "").trim().toLowerCase();

  if (!raw) {
    return null;
  }

  const withoutProtocol = raw.replace(/^[a-z]+:\/\//, "");
  const match = withoutProtocol.match(/linkedin\.com\/(in|pub|company)\/([^/?#\s]+)/);

  if (match) {
    let slug = match[2];

    try {
      slug = decodeURIComponent(slug);
    } catch {
      // Se usa tal cual si no se puede decodificar.
    }

    return `${match[1]}/${slug.replace(/\/+$/, "")}`;
  }

  // Un link que no es de LinkedIn (o sin dominio): se compara el texto limpio
  const cleaned = withoutProtocol.replace(/^www\./, "").split(/[?#]/)[0].replace(/\/+$/, "");

  return cleaned.includes("linkedin.com") ? cleaned : null;
}

/** Mail en minúsculas; en Gmail se ignoran los puntos y el "+etiqueta". */
export function normalizeEmail(value?: string): string | null {
  const raw = (value ?? "").trim().toLowerCase();

  if (!raw || !raw.includes("@")) {
    return null;
  }

  const [localPart, domain] = raw.split("@");

  if (!localPart || !domain) {
    return null;
  }

  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${localPart.split("+")[0].replace(/\./g, "")}@gmail.com`;
  }

  return `${localPart.split("+")[0]}@${domain}`;
}

export type DuplicateMatch = {
  entry: DirectoryCandidate;
  matchedBy: Array<"LinkedIn" | "email">;
};

/** Busca en el directorio un candidato con el mismo LinkedIn o mail. */
export function findDuplicateCandidate(
  input: { email?: string; linkedin?: string },
  directory: DirectoryCandidate[]
): DuplicateMatch | null {
  const linkedin = normalizeLinkedin(input.linkedin);
  const email = normalizeEmail(input.email);

  if (!linkedin && !email) {
    return null;
  }

  for (const entry of directory) {
    const matchedBy: DuplicateMatch["matchedBy"] = [];

    if (linkedin && normalizeLinkedin(entry.candidate.linkedin) === linkedin) {
      matchedBy.push("LinkedIn");
    }

    if (email && normalizeEmail(entry.candidate.email) === email) {
      matchedBy.push("email");
    }

    if (matchedBy.length > 0) {
      return { entry, matchedBy };
    }
  }

  return null;
}
