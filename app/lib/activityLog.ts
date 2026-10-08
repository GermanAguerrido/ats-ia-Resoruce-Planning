import { getUserInitials } from "./users";

/**
 * Agrega un registro a la actividad de un candidato/posición/proyecto (la misma que se ve en
 * "Comments and activity"). Se usa cuando el cambio se hace fuera del detalle, por ejemplo
 * al mover un candidato en la vista Pipeline. Con type "comment" queda como comentario
 * (por ejemplo el motivo de un cambio de etapa) y con el nombre de quien lo hizo.
 */
export function appendActivityLog(
  storageKey: string,
  text: string,
  options?: { author?: string; type?: "action" | "comment" }
) {
  if (typeof window === "undefined") {
    return;
  }

  const author = options?.author ?? "Germán";
  const type = options?.type ?? "action";

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];

    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      initials: getUserInitials(author) || "GA",
      author,
      text,
      createdAt: new Date().toISOString(),
      meta: type === "comment" ? "Comment · Just now" : "Action · Just now",
      type,
    };

    window.localStorage.setItem(storageKey, JSON.stringify([entry, ...list]));
  } catch {
    // Local storage can fail in private browsing or quota situations.
  }
}
