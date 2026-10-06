import type { ProjectColumn } from "@/app/data/resourcePlanningMock";

export const BOARD_STORAGE_KEY = "ats-ia:resource-planning:board:v2";

export type BoardOrderMode = "auto" | "manual";

export type StoredBoard = {
  projects: ProjectColumn[];
  orderMode: BoardOrderMode;
  manualOrder: string[];
  archivedIds: string[];
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function readStoredBoard(): StoredBoard | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(BOARD_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const stored = JSON.parse(rawValue);

    if (
      !stored ||
      !Array.isArray(stored.projects) ||
      !stored.projects.every(
        (project: ProjectColumn) =>
          project &&
          typeof project.id === "string" &&
          Array.isArray(project.positions)
      )
    ) {
      return null;
    }

    return {
      projects: stored.projects,
      orderMode: stored.orderMode === "manual" ? "manual" : "auto",
      manualOrder: isStringArray(stored.manualOrder) ? stored.manualOrder : [],
      archivedIds: isStringArray(stored.archivedIds) ? stored.archivedIds : [],
    };
  } catch {
    return null;
  }
}

export function writeStoredBoard(board: StoredBoard) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(board));
  } catch {
    // Local storage can fail in private browsing or quota situations.
  }
}

export function clearStoredBoard() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(BOARD_STORAGE_KEY);
  } catch {
    // Ignorar: el estado en memoria se restablece igual.
  }
}